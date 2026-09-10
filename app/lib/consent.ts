export type ConsentAction = 'accepted' | 'rejected' | 'withdrawn';

function supabaseHeaders(serviceKey: string) {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
}

// Looks up the Supabase Auth user id for an email via the Admin API (no client-side session exists to read it from).
export async function resolveUserIdByEmail(url: string, serviceKey: string, email: string): Promise<string | null> {
  const response = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email.trim().toLowerCase())}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const result = await response.json() as { users?: Array<{ id?: string }> };
  return result.users?.[0]?.id || null;
}

export async function recordUserConsent(url: string, serviceKey: string, params: { userId: string; documentId: string; version: string; action: ConsentAction; ipAddress: string | null; userAgent: string | null }) {
  const response = await fetch(`${url}/rest/v1/consents`, {
    method: 'POST',
    headers: supabaseHeaders(serviceKey),
    body: JSON.stringify({ user_id: params.userId, document_id: params.documentId, version: params.version, action: params.action, ip_address: params.ipAddress, user_agent: params.userAgent }),
  });
  return response.ok;
}

// `consents.user_id` is NOT NULL, so pre-login events (e.g. the cookie banner) go to security_audit_events instead.
export async function recordAnonymousConsent(url: string, serviceKey: string, params: { documentId: string; version: string; action: ConsentAction; ipAddress: string | null; userAgent: string | null; preferences?: unknown }) {
  const response = await fetch(`${url}/rest/v1/security_audit_events`, {
    method: 'POST',
    headers: supabaseHeaders(serviceKey),
    body: JSON.stringify({ event_type: 'consent', metadata: { documentId: params.documentId, version: params.version, action: params.action, preferences: params.preferences ?? null }, ip_address: params.ipAddress, user_agent: params.userAgent }),
  });
  return response.ok;
}
