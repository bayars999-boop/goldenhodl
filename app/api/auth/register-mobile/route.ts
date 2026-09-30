import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { sendRealSMS } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { 
      mobile?: string; 
      password?: string; 
      dateOfBirth?: string; 
      privacyConsent?: boolean; 
      termsConsent?: boolean; 
      riskConsent?: boolean; 
      marketingConsent?: boolean;
      code?: string;
      action?: 'send_code' | 'verify_and_register';
    };

    const mobile = body.mobile?.trim();
    if (!mobile || mobile.length < 8) {
      return NextResponse.json({ error: 'A valid mobile number is required.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Database storage is not configured.' }, { status: 503 });
    }

    // 1-р алхам: Код илгээх хүсэлт
    if (body.action === 'send_code') {
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Кодыг датабазад түр хадгалах эсвэл OTP хүснэгт рүү бичих
      await fetch(`${url}/rest/v1/mobile_otps`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ mobile, code: generatedCode, expires_at: new Date(Date.now() + 5 * 60000).toISOString() })
      }).catch(() => {});

      // Бодит SMS илгээх функц дуудах
      await sendRealSMS(mobile, `Your GoldMaster verification code is: ${generatedCode}`);

      return NextResponse.json({ success: true, message: 'SMS verification code sent successfully.' });
    }

    // 2-р алхам: Кодыг шалгаад бүртгэлийг эцэслэн үүсгэх
    if (!body.password || body.password.length < 8) {
      return NextResponse.json({ error: 'Password of at least 8 characters is required.' }, { status: 400 });
    }
    if (!body.privacyConsent || !body.termsConsent || !body.riskConsent) {
      return NextResponse.json({ error: 'Required consents are missing.' }, { status: 400 });
    }

    // OTP кодыг шалгах
    const otpCheck = await fetch(`${url}/rest/v1/mobile_otps?mobile=eq.${encodeURIComponent(mobile)}&select=code`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store'
    });
    const otpData = await otpCheck.json() as Array<{ code: string }>;
    if (!otpData || otpData.length === 0 || otpData[0].code !== body.code) {
      return NextResponse.json({ error: 'The verification code is incorrect or expired.' }, { status: 400 });
    }

    // Хэрэглэгч аль хэдийн бүртгэгдсэн эсэхийг шалгах
    const existing = await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(mobile)}&select=id`, { 
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, 
      cache: 'no-store' 
    });
    if (existing.ok && (await existing.json() as Array<unknown>).length > 0) {
      return NextResponse.json({ error: 'An account with this mobile number already exists.' }, { status: 409 });
    }

    // Supabase Auth дээр хэрэглэгч үүсгэх (утасны дугаарыг имэйл хэлбэрээр эсвэл metadata болгон хадгалах)
    const pseudoEmail = `${mobile.replace(/[^0-9]/g, '')}@mobile.goldmaster.internal`;
    const createResponse = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pseudoEmail, password: body.password, email_confirm: true, user_metadata: { mobile, date_of_birth: body.dateOfBirth } }),
    });

    const created = await createResponse.json() as { id?: string; error_description?: string; message?: string };
    if (!createResponse.ok || !created.id) {
      return NextResponse.json({ error: created.error_description || created.message || 'Unable to create account.' }, { status: 502 });
    }
    const userId = created.id;

    // Утасны дугаар болон нууц үгийн хашийг хадгалах
    const passwordHash = await hashPassword(body.password);
    await fetch(`${url}/rest/v1/user_credentials`, { 
      method: 'POST', 
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, 
      body: JSON.stringify({ contact: mobile, password_hash: passwordHash }) 
    });

    return NextResponse.json({ created: true, userId, mobileVerified: true }, { status: 201 });
  } catch (err) {
    console.error('[Register Mobile Error]:', err);
    return NextResponse.json({ error: 'Invalid registration request.' }, { status: 400 });
  }
}