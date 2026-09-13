import { env } from "cloudflare:workers";

const COOKIE_NAME = "triage247ng_session";
const SESSION_SECONDS = 8 * 60 * 60;

type NativeAuthEnv = {
  TRIAGENG_ADMIN_EMAIL?: string;
  TRIAGENG_ADMIN_PASSWORD?: string;
  TRIAGENG_SESSION_SECRET?: string;
  EVIDENCE?: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  };
};

type SessionPayload = { email: string; displayName: string; exp: number };

function authEnv() {
  return env as unknown as NativeAuthEnv;
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function base64UrlEncode(value: Uint8Array | string) {
  const data = typeof value === "string" ? bytes(value) : value;
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return new Uint8Array([...binary].map((character) => character.charCodeAt(0)));
}

async function hmac(value: string) {
  const secret = authEnv().TRIAGENG_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) throw new Error("Native authentication is not configured");
  const key = await crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes(value)));
}

export function configuredAdminEmail() {
  return authEnv().TRIAGENG_ADMIN_EMAIL?.trim().toLowerCase() || null;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = configuredAdminEmail();
  const expectedPassword = authEnv().TRIAGENG_ADMIN_PASSWORD || "";
  if (!expectedEmail || expectedPassword.length < 12) return false;
  const [emailHash, expectedEmailHash, passwordHash, expectedPasswordHash] = await Promise.all([
    digest(email.trim().toLowerCase()),
    digest(expectedEmail),
    digest(password),
    digest(expectedPassword),
  ]);
  return constantTimeEqual(emailHash, expectedEmailHash) && constantTimeEqual(passwordHash, expectedPasswordHash);
}

export async function createSessionCookie(email: string, displayName: string) {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    displayName: displayName.trim() || email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(await hmac(encoded));
  return `${COOKIE_NAME}=${encoded}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export async function readNativeSession(cookieHeader: string | null) {
  const token = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  try {
    const expectedSignature = await hmac(encoded);
    if (!constantTimeEqual(base64UrlDecode(suppliedSignature), expectedSignature)) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded))) as SessionPayload;
    if (!payload.email || !payload.displayName || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    if (payload.email !== configuredAdminEmail()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function loginRateLimit(request: Request) {
  const store = authEnv().EVIDENCE;
  if (!store) return { allowed: true, key: "" };
  const address = request.headers.get("cf-connecting-ip") || "unknown";
  const addressHash = base64UrlEncode(await digest(address));
  const key = `auth:login:${addressHash}`;
  const attempts = Number(await store.get(key) || 0);
  if (attempts >= 5) return { allowed: false, key };
  await store.put(key, String(attempts + 1), { expirationTtl: 15 * 60 });
  return { allowed: true, key };
}

export async function clearLoginRateLimit(key: string) {
  if (key) await authEnv().EVIDENCE?.delete(key);
}
