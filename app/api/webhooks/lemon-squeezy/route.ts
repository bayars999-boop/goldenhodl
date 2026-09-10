import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { issueEbarimtReceipt } from '../../../lib/ebarimt';

type LemonOrderAttributes = {
  identifier?: string;
  user_email?: string;
  currency?: string;
  total?: number;
  tax?: number;
  created_at?: string;
};

type LemonWebhookPayload = {
  meta?: { event_name?: string };
  data?: { id?: string; attributes?: LemonOrderAttributes };
};

function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

async function logAuditEvent(url: string, serviceKey: string, eventType: string, metadata: Record<string, unknown>, request: Request) {
  await fetch(`${url}/rest/v1/security_audit_events`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      event_type: eventType,
      metadata,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
      user_agent: request.headers.get('user-agent') || null,
    }),
  }).catch(() => undefined);
}

// Receives Lemon Squeezy's `order_created` webhook and issues the Mongolian e-Barimt VAT receipt for the order.
export async function POST(request: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }

  if (payload.meta?.event_name !== 'order_created') return NextResponse.json({ received: true });

  const attributes = payload.data?.attributes;
  const orderId = payload.data?.id || attributes?.identifier || 'unknown';
  const receipt = await issueEbarimtReceipt({
    orderId,
    customerEmail: attributes?.user_email || null,
    totalAmount: attributes?.total ?? 0,
    taxAmount: attributes?.tax ?? 0,
    currency: attributes?.currency || 'USD',
    issuedAt: attributes?.created_at || new Date().toISOString(),
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    await logAuditEvent(
      supabaseUrl,
      serviceKey,
      receipt.success ? 'ebarimt_receipt_issued' : 'ebarimt_receipt_failed',
      { orderId, receiptId: receipt.receiptId ?? null, error: receipt.error ?? null },
      request,
    );
  }
  if (!receipt.success) console.error(`[lemon-squeezy-webhook] e-Barimt receipt failed for order ${orderId}: ${receipt.error}`);

  // Always acknowledge the webhook so Lemon Squeezy does not retry; failures are tracked in the audit log above.
  return NextResponse.json({ received: true, ebarimt: receipt.success });
}
