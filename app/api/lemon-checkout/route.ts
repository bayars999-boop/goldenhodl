import { NextResponse } from 'next/server';
import { recordUserConsent, resolveUserIdByEmail } from '../../lib/consent';

type ProductKind = 'Copy trading' | 'EA rental';
type Duration = '30 days' | '3 months' | '6 months' | '12 months';

const productConfig: Record<ProductKind, { variantEnv: string; minimumBalance: number }> = {
  'Copy trading': { variantEnv: 'LEMON_SQUEEZY_COPY_TRADING_VARIANT_ID', minimumBalance: 500 },
  'EA rental': { variantEnv: 'LEMON_SQUEEZY_EA_RENTAL_VARIANT_ID', minimumBalance: 1000 },
};
const durations: Duration[] = ['30 days', '3 months', '6 months', '12 months'];

const calculateFee = (kind: ProductKind, balance: number, duration: Duration) => {
  if (kind === 'Copy trading') {
    const rate = duration === '30 days' ? 0.03 : duration === '3 months' ? 0.08 : duration === '6 months' ? 0.15 : 0.29;
    return Math.round(balance * rate * 100);
  }

  return Math.round((duration === '12 months' ? 120 : duration === '6 months' ? 65 : duration === '3 months' ? 39 : 15) * 100);
};

const formatMoney = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export async function POST(request: Request) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    return NextResponse.json({ error: 'Lemon Squeezy server configuration is missing.' }, { status: 503 });
  }

  try {
    const body = await request.json() as { kind?: ProductKind; balance?: number; duration?: Duration; email?: string; documentVersion?: string };
    const kind = body.kind;
    const balance = Number(body.balance);
    const duration = body.duration;
    const email = body.email?.trim().toLowerCase();

    if (!kind || !productConfig[kind] || !Number.isFinite(balance) || balance < productConfig[kind].minimumBalance || !duration || !durations.includes(duration)) {
      return NextResponse.json({ error: 'Invalid product checkout data.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid account email is required to record the agreement acceptance.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Consent audit trail storage is not configured.' }, { status: 503 });
    }

    const userId = await resolveUserIdByEmail(supabaseUrl, serviceKey, email);
    if (!userId) {
      return NextResponse.json({ error: 'Unable to verify the account for consent recording.' }, { status: 404 });
    }

    // Click-wrap audit trail: document version, IP address, and server-received timestamp (consents.created_at) for this agreement.
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const documentVersion = body.documentVersion || '2026-09';
    const documentId = kind === 'EA rental' ? 'ea-rental-agreement' : 'copy-trading-agreement';
    const consentStored = await recordUserConsent(supabaseUrl, serviceKey, { userId, documentId, version: documentVersion, action: 'accepted', ipAddress, userAgent });
    if (!consentStored) {
      console.error(`[lemon-checkout] failed to record ${documentId} consent for ${email}`);
      return NextResponse.json({ error: 'Unable to record the required agreement acceptance. Please try again.' }, { status: 502 });
    }

    const variantId = process.env[productConfig[kind].variantEnv];
    if (!variantId) {
      return NextResponse.json({ error: `Missing Lemon Squeezy variant for ${kind}.` }, { status: 503 });
    }

    const customPrice = calculateFee(kind, balance, duration);
    const checkoutResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email,
              custom_price: customPrice,
            },
            checkout_options: { embed: false },
            // Requests the VAT/tax breakdown so the UI can disclose subtotal/tax/total before redirecting.
            preview: true,
          },
          relationships: {
            store: { data: { type: 'stores', id: String(storeId) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    });

    const checkoutJson = await checkoutResponse.json() as {
      data?: {
        attributes?: {
          url?: string;
          preview?: { currency?: string; subtotal_formatted?: string; tax_formatted?: string; total_formatted?: string };
        };
      };
      errors?: unknown;
    };
    if (!checkoutResponse.ok || !checkoutJson.data?.attributes?.url) {
      console.error('Lemon Squeezy checkout creation failed', checkoutJson.errors || checkoutJson);
      return NextResponse.json({ error: 'Unable to create Lemon Squeezy checkout.' }, { status: 502 });
    }

    const preview = checkoutJson.data.attributes.preview;
    return NextResponse.json({
      url: checkoutJson.data.attributes.url,
      amount: customPrice / 100,
      currency: preview?.currency || 'USD',
      subtotal: preview?.subtotal_formatted || formatMoney(customPrice / 100),
      tax: preview?.tax_formatted || formatMoney(0),
      total: preview?.total_formatted || formatMoney(customPrice / 100),
    });
  } catch (error) {
    console.error('Lemon Squeezy checkout request failed', error);
    return NextResponse.json({ error: 'Unable to create checkout.' }, { status: 500 });
  }
}
