import { NextResponse } from 'next/server';

const RECOVERY_COOKIE = 'goldmaster-recovery';

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: 'Password reset is not configured.' }, { status: 503 });

  try {
    const body = await request.json() as { accessToken?: string; email?: string };
    if (!body.accessToken) return NextResponse.json({ error: 'A valid recovery session is required.' }, { status: 400 });
    const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${body.accessToken}` }, cache: 'no-store' });
    if (!userResponse.ok) return NextResponse.json({ error: 'The recovery session is invalid or has expired.' }, { status: 401 });
    const user = await userResponse.json() as { email?: string };
    const email = (user.email || body.email || '').toLowerCase();
    if (!email) return NextResponse.json({ error: 'The recovery session is invalid.' }, { status: 400 });
    const payload = Buffer.from(JSON.stringify({ accessToken: body.accessToken, email })).toString('base64');
    const result = NextResponse.json({ ok: true });
    result.headers.append('Set-Cookie', `${RECOVERY_COOKIE}=${encodeURIComponent(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    return result;
  } catch {
    return NextResponse.json({ error: 'Invalid recovery session request.' }, { status: 400 });
  }
}
