// Signed, stateless session tokens for the custom (non-Supabase-Auth) login flow.
// Uses Web Crypto (available in both the Node.js route handlers and the Edge middleware) so a single
// module can verify sessions everywhere, replacing the previous unsigned `user_credentials.id` cookie
// value, which any client could forge since nothing verified it.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SessionRole = 'user' | 'admin';
export type SessionPayload = { sub: string; email: string; role: SessionRole; iat: number; exp: number };

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(claims: { sub: string; email: string; role: SessionRole }, ttlSeconds = 60 * 60 * 24): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured.');
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { ...claims, iat: now, exp: now + ttlSeconds };
  const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await importSigningKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payloadPart)));
  return `${payloadPart}.${base64UrlEncode(signature)}`;
}

export async function verifySessionToken(token: string | null | undefined): Promise<SessionPayload | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return null;
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  try {
    const key = await importSigningKey(secret);
    const isValid = await crypto.subtle.verify('HMAC', key, base64UrlDecode(signaturePart), encoder.encode(payloadPart));
    if (!isValid) return null;
    const payload = JSON.parse(decoder.decode(base64UrlDecode(payloadPart))) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readSessionCookie(cookieHeader: string | null | undefined): string | null {
  const match = cookieHeader?.match(/(?:^|;\s*)goldmaster-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const SESSION_COOKIE_NAME = 'goldmaster-session';

export function sessionCookieHeader(token: string, maxAgeSeconds: number) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export const clearedSessionCookieHeader = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function hasRole(session: SessionPayload | null, role: SessionRole): boolean {
  if (!session) return false;
  return role === 'user' ? true : session.role === 'admin';
}
