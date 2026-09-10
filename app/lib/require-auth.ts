import { resolveUserIdByEmail } from './consent';
import { readSessionCookie, verifySessionToken, type SessionRole } from './session';

export type AuthenticatedUser = { userId: string; email: string; role: SessionRole };

// Canonical server-side identity check for API routes: verifies the signed `goldmaster-session`
// cookie, then resolves the Supabase Auth user id for the session email (the two identity spaces
// are linked only by email, since login checks `user_credentials`, not a Supabase Auth session).
export async function getAuthenticatedUser(request: Request, url: string, serviceKey: string): Promise<AuthenticatedUser | null> {
  const token = readSessionCookie(request.headers.get('cookie'));
  const session = await verifySessionToken(token);
  if (!session) return null;

  const userId = await resolveUserIdByEmail(url, serviceKey, session.email);
  if (!userId) return null;

  let role: SessionRole = session.role;
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=app_role`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  });
  if (profileResponse.ok) {
    const rows = await profileResponse.json() as Array<{ app_role?: SessionRole }>;
    if (rows[0]?.app_role === 'admin') role = 'admin';
  }

  return { userId, email: session.email, role };
}
