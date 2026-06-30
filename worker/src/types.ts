export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CACHE?: KVNamespace;
  AI: Ai;
  JWT_SECRET: string;
  INSTANCE_NAME: string;
  APP_VERSION: string;
  // S3 配置（直连模式必填，B2_PROXY 模式也需要）
  S3_ENDPOINT?: string;
  S3_REGION: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  // Service Binding 模式（优先于 S3_ENDPOINT）
  B2_PROXY?: Fetcher;
}

export interface UserPayload {
  id: number;
  username: string;
  role: string;
  status: string;
}

export interface JWTClaims {
  sub: string;
  iss: string;
  aud: string;
  name: string;
  role: string;
  status: string;
  exp: number;
  iat: number;
  tid?: string;
}
