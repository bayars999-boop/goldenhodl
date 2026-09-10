import { NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/password';
import { generateOtpCode, sendOtpCode, type OtpChannel } from '../../../../lib/otp';

const allowedPurposes = new Set(['contact-verification', 'login-mfa']);

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'OTP storage is not configured.' }, { status: 503 });

  try {
    const body = await request.json() as { contact?: string; channel?: OtpChannel; purpose?: string };
    const contact = body.contact?.trim();
    const channel = body.channel;
    const purpose = body.purpose;
    if (!contact || (channel !== 'email' && channel !== 'sms') || !purpose || !allowedPurposes.has(purpose)) {
      return NextResponse.json({ error: 'A valid contact, channel, and purpose are required.' }, { status: 400 });
    }
    if (channel === 'email' && !contact.includes('@')) return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    if (channel === 'sms' && !/^\+?[0-9]{7,15}$/.test(contact)) return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });

    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

    // Throttle: at most one active code per contact/purpose every 60 seconds.
    const recentResponse = await fetch(`${url}/rest/v1/otp_codes?contact=eq.${encodeURIComponent(contact)}&purpose=eq.${encodeURIComponent(purpose)}&order=created_at.desc&limit=1&select=created_at`, { headers, cache: 'no-store' });
    const recent = recentResponse.ok ? await recentResponse.json() as Array<{ created_at: string }> : [];
    if (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < 60_000) {
      return NextResponse.json({ error: 'Please wait a minute before requesting another code.' }, { status: 429 });
    }

    const code = generateOtpCode();
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    const insertResponse = await fetch(`${url}/rest/v1/otp_codes`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ contact, purpose, code_hash: codeHash, expires_at: expiresAt }),
    });
    if (!insertResponse.ok) return NextResponse.json({ error: 'Unable to create a verification code.' }, { status: 502 });

    const sendResult = await sendOtpCode(channel, contact, code);
    if (!sendResult.success) {
      console.error(`[otp] failed to send ${channel} code to ${contact}: ${sendResult.error}`);
      return NextResponse.json({ error: sendResult.error || 'Unable to send the verification code.' }, { status: 502 });
    }

    return NextResponse.json({ sent: true, expiresInSeconds: 600 });
  } catch {
    return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });
  }
}
