import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../lib/require-auth';

type ProfilePayload = { fullName?: string; phone?: string; country?: string };

function getSupabaseConfig() {
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY };
}

async function supabaseRequest(request: Request, method: 'GET' | 'PATCH', body?: ProfilePayload) {
  const { url, serviceKey } = getSupabaseConfig();
  if (!url || !serviceKey) return NextResponse.json({ error: 'Authenticated profile storage is not configured.' }, { status: 503 });

  const user = await getAuthenticatedUser(request, url, serviceKey);
  if (!user) return NextResponse.json({ error: 'Authentication session is invalid.' }, { status: 401 });

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const endpoint = `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.userId)}`;
  if (method === 'GET') {
    const response = await fetch(endpoint, { headers, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: 'Unable to load profile.' }, { status: 502 });
    return NextResponse.json({ profile: data[0] || { full_name: '', phone: '', country: '' } });
  }

  const response = await fetch(`${url}/rest/v1/profiles`, { method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ id: user.userId, full_name: body?.fullName || null, phone: body?.phone || null, country: body?.country || null, email: user.email, updated_at: new Date().toISOString() }) });
  const data = await response.json();
  if (!response.ok) return NextResponse.json({ error: 'Unable to save profile.' }, { status: 502 });
  return NextResponse.json({ profile: data[0] });
}

export async function GET(request: Request) {
  try { return await supabaseRequest(request, 'GET'); } catch { return NextResponse.json({ error: 'Unable to load profile.' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as ProfilePayload;
    return await supabaseRequest(request, 'PATCH', body);
  } catch { return NextResponse.json({ error: 'Unable to save profile.' }, { status: 400 }); }
}
