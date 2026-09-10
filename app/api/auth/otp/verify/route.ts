import { NextResponse } from 'next/server';
import { verifyPassword } from '../../../../lib/password';

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'OTP storage is not configured.' }, { status: 503 });

  try {
    const body = await request.json() as { contact?: string; purpose?: string; code?: string };
    const contact = body.contact?.trim();
    const purpose = body.purpose;
    const code = body.code?.trim();
    if (!contact || !purpose || !code) return NextResponse.json({ error: 'Contact, purpose, and code are required.' }, { status: 400 });

    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
    const lookupResponse = await fetch(
      `${url}/rest/v1/otp_codes?contact=eq.${encodeURIComponent(contact)}&purpose=eq.${encodeURIComponent(purpose)}&consumed_at=is.null&order=created_at.desc&limit=1&select=id,code_hash,attempts,expires_at`,
      { headers, cache: 'no-store' },
    );
    if (!lookupResponse.ok) return NextResponse.json({ error: 'Unable to verify the code.' }, { status: 502 });
    const rows = await lookupResponse.json() as Array<{ id: number; code_hash: string; attempts: number; expires_at: string }>;
    const record = rows[0];
    if (!record) return NextResponse.json({ error: 'No active verification code was found. Request a new one.' }, { status: 404 });
    if (new Date(record.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'This code has expired. Request a new one.' }, { status: 410 });
    if (record.attempts >= MAX_ATTEMPTS) return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 429 });

    const isValid = await verifyPassword(code, record.code_hash);
    if (!isValid) {
      await fetch(`${url}/rest/v1/otp_codes?id=eq.${record.id}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ attempts: record.attempts + 1 }) });
      return NextResponse.json({ error: 'Incorrect verification code.' }, { status: 401 });
    }

    await fetch(`${url}/rest/v1/otp_codes?id=eq.${record.id}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ consumed_at: new Date().toISOString() }) });
    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });
  }
}
