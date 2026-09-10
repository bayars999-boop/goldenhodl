import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../lib/require-auth';
import { clearedSessionCookieHeader } from '../../lib/session';

function signedOutResponse(body: Record<string, unknown>) {
  const response = NextResponse.json(body);
  response.headers.append('Set-Cookie', clearedSessionCookieHeader);
  return response;
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  const user = await getAuthenticatedUser(request, url, serviceKey);
  if (!user) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({})) as { type?: string; details?: string };
    if (body.type !== 'erasure') return NextResponse.json({ error: 'Only authenticated erasure requests are handled by this endpoint.' }, { status: 400 });

    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
    const now = new Date().toISOString();
    const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.userId)}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ full_name: 'Deleted User', phone: null, country: null, email: `deleted_${user.userId}@anonymized.local`, deletion_requested_at: now, anonymized_at: now, updated_at: now }),
    });
    if (!profileResponse.ok) return NextResponse.json({ error: 'Unable to anonymize profile data.' }, { status: 502 });
    const anonymizedProfiles = await profileResponse.json() as unknown[];
    if (anonymizedProfiles.length !== 1) return NextResponse.json({ error: 'No profile was found for the authenticated user.' }, { status: 404 });

    const auditResponse = await fetch(`${url}/rest/v1/data_subject_requests`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: user.userId, request_type: 'erasure', details: body.details?.slice(0, 2000) || null, status: 'completed', completed_at: now }),
    });
    if (!auditResponse.ok) return NextResponse.json({ error: 'Profile anonymized, but the erasure audit record could not be stored.' }, { status: 502 });

    await fetch(`${url}/rest/v1/security_audit_events`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: user.userId, event_type: 'data_erasure_completed', metadata: { requestType: 'erasure', anonymized: true }, ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null, user_agent: request.headers.get('user-agent') || null }),
    });

    // Also revoke the underlying login credential so the anonymized account can no longer sign in.
    await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(user.email)}`, { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } }).catch(() => undefined);

    return signedOutResponse({ success: true, anonymized: true, signedOut: true, message: 'Your eligible profile data was anonymized and your session was signed out.' });
  } catch {
    return NextResponse.json({ error: 'Unable to process the erasure request.' }, { status: 500 });
  }
}
