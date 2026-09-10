import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../lib/require-auth';

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  const user = await getAuthenticatedUser(request, url, serviceKey);
  if (!user) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  try {
    const queryHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
    const [profileResponse, requestsResponse] = await Promise.all([
      fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.userId)}&select=*`, { headers: queryHeaders, cache: 'no-store' }),
      fetch(`${url}/rest/v1/data_subject_requests?user_id=eq.${encodeURIComponent(user.userId)}&select=id,request_type,status,created_at,completed_at`, { headers: queryHeaders, cache: 'no-store' }),
    ]);
    if (!profileResponse.ok || !requestsResponse.ok) return NextResponse.json({ error: 'Unable to prepare your data export.' }, { status: 502 });

    const exportData = {
      user_id: user.userId,
      email: user.email || null,
      profile: (await profileResponse.json())[0] || null,
      data_subject_requests: await requestsResponse.json(),
      exported_at: new Date().toISOString(),
    };
    const format = new URL(request.url).searchParams.get('format')?.toLowerCase() || 'json';
    if (format === 'csv') {
      const rows = [['field', 'value'], ...Object.entries(exportData).map(([field, value]) => [field, value])];
      const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
      return new NextResponse(`${csv}\r\n`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="my-data-${user.userId}.csv"`, 'Cache-Control': 'no-store' } });
    }
    if (format !== 'json') return NextResponse.json({ error: 'Format must be json or csv.' }, { status: 400 });
    return new NextResponse(JSON.stringify(exportData, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="my-data-${user.userId}.json"`, 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to prepare your data export.' }, { status: 500 });
  }
}
