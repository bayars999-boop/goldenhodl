import { NextResponse } from 'next/server';
import { recordAnonymousConsent, recordUserConsent, resolveUserIdByEmail } from '../../lib/consent';

const allowedDocuments = new Set(['privacy', 'terms', 'cookies', 'risk', 'refund', 'aml', 'vulnerability', 'ea-rental-agreement', 'copy-trading-agreement']);
const allowedActions = new Set(['accepted', 'rejected', 'withdrawn']);

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; documentId?: string; version?: string; action?: string; preferences?: unknown };
    if (!body.documentId || !allowedDocuments.has(body.documentId) || !body.version || !body.action || !allowedActions.has(body.action)) {
      return NextResponse.json({ error: 'Invalid consent event.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'Supabase storage configuration is missing.' }, { status: 503 });

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const action = body.action as 'accepted' | 'rejected' | 'withdrawn';

    // Pre-login events (e.g. the cookie banner) have no email/user id, so they fall back to the anonymous audit trail.
    const userId = body.email ? await resolveUserIdByEmail(url, serviceKey, body.email) : null;
    const stored = userId
      ? await recordUserConsent(url, serviceKey, { userId, documentId: body.documentId, version: body.version, action, ipAddress, userAgent })
      : await recordAnonymousConsent(url, serviceKey, { documentId: body.documentId, version: body.version, action, ipAddress, userAgent, preferences: body.preferences });

    if (!stored) {
      console.error(`[consent] failed to persist ${body.documentId} (${action})`);
      return NextResponse.json({ error: 'Failed to persist audit trail record.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid consent request.' }, { status: 400 });
  }
}
