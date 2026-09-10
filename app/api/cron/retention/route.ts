import { NextResponse } from 'next/server';
import { retentionConfiguration } from '../../../lib/data-retention';
import { privacyMatrixVersion } from '../../../privacy-data-matrix';

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) return false;
  return request.headers.get('authorization') === `Bearer ${configuredSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const cleanupUrl = process.env.RETENTION_CLEANUP_URL;
  if (!cleanupUrl) {
    return NextResponse.json({
      error: 'Retention cleanup adapter is not configured.',
      matrixVersion: privacyMatrixVersion,
      schedule: retentionConfiguration.schedule,
    }, { status: 503 });
  }

  try {
    const response = await fetch(cleanupUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RETENTION_CLEANUP_SECRET || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matrixVersion: privacyMatrixVersion,
        policy: retentionConfiguration,
        requestedAt: new Date().toISOString(),
      }),
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: 'Retention cleanup adapter failed.', details: result }, { status: 502 });
    return NextResponse.json({ completed: true, matrixVersion: privacyMatrixVersion, result });
  } catch {
    return NextResponse.json({ error: 'Retention cleanup adapter is unreachable.' }, { status: 502 });
  }
}
