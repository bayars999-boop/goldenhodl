import { NextResponse } from 'next/server';
import { verifyPassword } from '../../../lib/password';
import { createSessionToken, sessionCookieHeader } from '../../../lib/session';

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!url || !serviceKey || !sessionSecret) return NextResponse.json({ error: 'Secure account authentication is not configured.' }, { status: 503 });

  try {
    const body = await request.json() as { contact?: string; password?: string };
    const rawContact = body.contact?.trim();
    const contact = rawContact && rawContact.includes('@') ? rawContact.toLowerCase() : rawContact;
    if (!contact || !body.password) return NextResponse.json({ error: 'Contact and password are required.' }, { status: 400 });
    const response = await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(contact)}&select=id,contact,password_hash`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
    const records = await response.json() as Array<{ id: string; contact: string; password_hash: string }>;
    const valid = records.length === 1 && await verifyPassword(body.password, records[0].password_hash);
    if (!valid) return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
    const maxAgeSeconds = 60 * 60 * 24;
    const token = await createSessionToken({ sub: String(records[0].id), email: records[0].contact, role: 'user' }, maxAgeSeconds);
    const result = NextResponse.json({ authenticated: true, contact: records[0].contact });
    result.headers.append('Set-Cookie', sessionCookieHeader(token, maxAgeSeconds));
    return result;
  } catch (error) {
    console.error('[login] authentication request failed:', error);
    return NextResponse.json({ error: 'Authentication is temporarily unavailable. Please try again later.' }, { status: 502 });
  }
}
