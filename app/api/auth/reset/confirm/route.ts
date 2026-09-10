import { NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/password';

const RECOVERY_COOKIE = 'goldmaster-recovery';

type VerifiedRecovery = { accessToken: string; email: string };

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return NextResponse.json({ error: 'Password reset is not configured.' }, { status: 503 });

  try {
    const body = await request.json() as { newPassword?: string };
    const newPassword = body.newPassword || '';
    if (newPassword.length < 8) return NextResponse.json({ error: 'The new password must contain at least 8 characters.' }, { status: 400 });

    // The emailed reset link has already verified the user and created the recovery cookie.
    let recovery: VerifiedRecovery | null = null;
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${RECOVERY_COOKIE}=`));
    if (match) {
      try {
        const parsed = JSON.parse(Buffer.from(decodeURIComponent(match.slice(RECOVERY_COOKIE.length + 1)), 'base64').toString('utf8')) as { accessToken?: string; email?: string };
        if (parsed.accessToken && parsed.email) recovery = { accessToken: parsed.accessToken, email: parsed.email.toLowerCase() };
      } catch { recovery = null; }
    }
    if (!recovery) return NextResponse.json({ error: 'Your reset session has expired. Open the reset link from your email again.' }, { status: 400 });

    const updateAuth = await fetch(`${url}/auth/v1/user`, { method: 'PUT', headers: { apikey: anonKey, Authorization: `Bearer ${recovery.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) });
    if (!updateAuth.ok) return NextResponse.json({ error: 'The new password could not be saved. Request a new reset code and try again.' }, { status: 502 });

    const passwordHash = await hashPassword(newPassword);
    const updateCredentials = await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(recovery.email)}`, { method: 'PATCH', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ password_hash: passwordHash, updated_at: new Date().toISOString() }) });
    if (!updateCredentials.ok) return NextResponse.json({ error: 'The new password could not be saved. Please try again.' }, { status: 502 });

    const result = NextResponse.json({ updated: true });
    result.headers.append('Set-Cookie', `${RECOVERY_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return result;
  } catch {
    return NextResponse.json({ error: 'Invalid password reset request.' }, { status: 400 });
  }
}
