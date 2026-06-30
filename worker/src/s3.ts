import { AwsClient } from "aws4fetch";
import type { Env } from "./types";

const clients = new WeakMap<Env, AwsClient>();

function getS3Client(env: Env): AwsClient {
  let client = clients.get(env);
  if (!client) {
    client = new AwsClient({
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      region: env.S3_REGION,
      service: "s3",
    });
    clients.set(env, client);
  }
  return client;
}

/** 双模式：Service Binding 优先，回退到直连 S3 */
function requestUrl(env: Env, key: string): string {
  if (env.B2_PROXY) {
    return `https://b2-proxy/${env.S3_BUCKET}/${key}`;
  }
  return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
}

function sendRequest(env: Env, signed: Request): Promise<Response> {
  if (env.B2_PROXY) {
    return env.B2_PROXY.fetch(signed);
  }
  return fetch(signed);
}

export async function s3Get(
  env: Env,
  key: string,
  options?: { range?: { offset: number; length: number } },
): Promise<Response | null> {
  const client = getS3Client(env);
  const url = requestUrl(env, key);
  const headers: Record<string, string> = {};
  if (options?.range) {
    headers["Range"] = `bytes=${options.range.offset}-${options.range.offset + options.range.length - 1}`;
  }
  const signed = await client.sign(url, { headers });
  const response = await sendRequest(env, signed);
  if (response.status === 404) return null;
  return response;
}

export async function s3Put(
  env: Env,
  key: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const client = getS3Client(env);
  const url = requestUrl(env, key);
  const signed = await client.sign(url, {
    method: "PUT",
    body: data,
    headers: { "Content-Type": contentType },
  });
  const response = await sendRequest(env, signed);
  if (!response.ok) {
    throw new Error(`S3 PUT failed: ${response.status} ${await response.text()}`);
  }
}

export async function s3Delete(env: Env, key: string): Promise<void> {
  const client = getS3Client(env);
  const url = requestUrl(env, key);
  const signed = await client.sign(url, { method: "DELETE" });
  const response = await sendRequest(env, signed);
  if (!response.ok) {
    throw new Error(`S3 DELETE failed: ${response.status} ${await response.text()}`);
  }
}
