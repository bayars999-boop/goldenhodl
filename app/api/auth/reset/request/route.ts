import { NextResponse } from 'next/server';

type SupabaseError = { message?: string; msg?: string; error_description?: string };

function errorMessage(payload: SupabaseError, fallback: string) {
  return payload.error_description || payload.message || payload.msg || fallback;
}

async function sendWithResend(to: string, resetLink: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_ADDRESS;
  if (!apiKey || !fromAddress) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject: 'Reset your GoldMaster password',
      text: `Open this link to reset your GoldMaster password: ${resetLink}\n\nThis link expires automatically. If you did not request a password reset, you can ignore this email.`,
    }),
  });
  if (!response.ok) {
    console.error(`[password-reset] Resend delivery failed (${response.status}): ${await response.text()}`);
  }
  return response.ok;
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return NextResponse.json({ error: 'Password reset is not configured.' }, { status: 503 });

  try {
    const body = await request.json() as { contact?: string };
    const email = body.contact?.trim().toLowerCase();
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Enter the email address registered to your account.' }, { status: 400 });

    const lookup = await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(email)}&select=id`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
    if (!lookup.ok) {
      console.error(`[password-reset] account lookup failed (${lookup.status}): ${await lookup.text()}`);
      return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again later.' }, { status: 502 });
    }
    const records = await lookup.json() as Array<{ id: number }>;
    if (records.length === 1) {
      const origin = new URL(request.url).origin;
      const redirectTo = `${origin}/auth/callback`;
      if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_ADDRESS) {
        const generateResponse = await fetch(`${url}/auth/v1/admin/generate_link`, {
          method: 'POST',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'recovery', email, options: { redirectTo } }),
        });
        const generated = await generateResponse.json().catch(() => ({})) as SupabaseError & { action_link?: string };
        if (!generateResponse.ok || !generated.action_link) {
          console.error(`[password-reset] recovery link generation failed (${generateResponse.status}): ${errorMessage(generated, 'Unknown error')}`);
          return NextResponse.json({ error: 'Unable to create a password reset link. Please try again later.' }, { status: 502 });
        }
        if (!await sendWithResend(email, generated.action_link)) {
          return NextResponse.json({ error: 'Unable to email the password reset link. Please try again later.' }, { status: 502 });
        }
      } else {
        const recoveryResponse = await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
          method: 'POST',
          headers: { apikey: anonKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!recoveryResponse.ok) {
          const detail = await recoveryResponse.json().catch(() => ({})) as SupabaseError;
          console.error(`[password-reset] Supabase delivery failed (${recoveryResponse.status}): ${errorMessage(detail, 'Unknown error')}`);
          return NextResponse.json({ error: 'Unable to email the password reset link. Please try again later.' }, { status: 502 });
        }
      }
    }
    // Always report success so this endpoint cannot be used to enumerate accounts.
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: 'Invalid password reset request.' }, { status: 400 });
  }
}
