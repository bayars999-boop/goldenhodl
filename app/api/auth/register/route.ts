import { NextResponse } from 'next/server';
import { hashPassword } from '../../../lib/password';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string; dateOfBirth?: string; privacyConsent?: boolean; termsConsent?: boolean; riskConsent?: boolean; marketingConsent?: boolean };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes('@') || !body.password || body.password.length < 8) return NextResponse.json({ error: 'A valid email and password of at least 8 characters are required.' }, { status: 400 });
    if (!body.privacyConsent || !body.termsConsent || !body.riskConsent) return NextResponse.json({ error: 'Required consents are missing.' }, { status: 400 });
    if (!body.dateOfBirth) return NextResponse.json({ error: 'Date of birth is required.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'Supabase account storage is not configured.' }, { status: 503 });

    const existing = await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(email)}&select=id`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
    if (existing.ok && (await existing.json() as Array<unknown>).length > 0) return NextResponse.json({ error: 'An account with this email already exists. Log in or reset your password.' }, { status: 409 });

    // Create the account pre-confirmed via the Admin API. No confirmation email is sent, so
    // Supabase's default-SMTP email rate limit (only a few emails per hour) cannot block registration.
    // (Replaces the legacy public /auth/v1/signup flow, which required a rate-limited confirmation email.)
    const createResponse = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: body.password, email_confirm: true, user_metadata: { date_of_birth: body.dateOfBirth } }),
    });
    const created = await createResponse.json() as { id?: string; msg?: string; message?: string; error_description?: string };
    if (!createResponse.ok || !created.id) {
      const message = created.error_description || created.msg || created.message || 'Unable to create the account.';
      if (createResponse.status === 422) return NextResponse.json({ error: 'An account with this email already exists. Log in or reset your password.' }, { status: 409 });
      if (createResponse.status === 429 || /rate limit/i.test(message)) return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 });
      return NextResponse.json({ error: message }, { status: 502 });
    }
    const userId = created.id;

    const passwordHash = await hashPassword(body.password);
    let credentialResponse = await fetch(`${url}/rest/v1/user_credentials`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ contact: email, password_hash: passwordHash }) });
    if (!credentialResponse.ok) {
      const detail = await credentialResponse.text();
      console.error(`[register] user_credentials insert failed (${credentialResponse.status}): ${detail}`);
      if (credentialResponse.status === 409) {
        // Stale credential row left behind when the auth user was deleted. Update it instead.
        credentialResponse = await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(email)}`, { method: 'PATCH', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ password_hash: passwordHash, updated_at: new Date().toISOString() }) });
        if (!credentialResponse.ok) console.error(`[register] user_credentials update failed (${credentialResponse.status}): ${await credentialResponse.text()}`);
      }
    }
    if (!credentialResponse.ok) {
      await fetch(`${url}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
      return NextResponse.json({ error: 'Account credentials could not be stored. Please register again.' }, { status: 502 });
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const consentRows = [
      ['privacy', body.privacyConsent],
      ['terms', body.termsConsent],
      ['risk', body.riskConsent],
      ['privacy-marketing', body.marketingConsent === true],
    ].filter(([, accepted]) => accepted).map(([documentId]) => ({ user_id: userId, document_id: documentId, version: '2026-09', action: 'accepted', ip_address: ipAddress, user_agent: userAgent }));
    const consentResponse = await fetch(`${url}/rest/v1/consents`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(consentRows) });
    if (!consentResponse.ok) {
      console.error(`[register] consents insert failed (${consentResponse.status}): ${await consentResponse.text()}`);
      return NextResponse.json({ error: 'Account created, but consent records could not be stored.' }, { status: 502 });
    }
    return NextResponse.json({ created: true, userId, emailVerified: true }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Invalid registration request.' }, { status: 400 }); }
}
