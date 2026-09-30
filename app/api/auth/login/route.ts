import { NextResponse } from 'next/server';
import { verifyPassword } from '../../../../lib/password';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { 
      contact?: string;
      identifier?: string; 
      email?: string; 
      mobile?: string; 
      phone?: string; 
      password?: string; 
    };

    // Бүх боломжит түлхүүрээс утгыг шүүж авна
    const rawContact = body.contact || body.identifier || body.email || body.mobile || body.phone;
    const password = body.password;

    if (!rawContact || !password) {
      return NextResponse.json({ error: 'Identifier (email or mobile) and password are required.' }, { status: 400 });
    }

    const contactInput = rawContact.trim();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Database storage is not configured.' }, { status: 503 });
    }

    // 1. Эхлээд яг бичсэн хэлбэрээр нь хайж үзэх
    let res = await fetch(`${url}/rest/v1/user_credentials?contact=eq.${encodeURIComponent(contactInput)}&select=*`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store'
    });

    let rows = await res.json() as Array<{ contact: string; password_hash: string }>;

    // 2. Хэрэв олдохгүй бол утасны дугаар эсвэл имэйл дэх хоосон зай, тусгай тэмдэгтүүдийг цэвэрлээд цифр эсвэл үсгээр нь ilike (case-insensitive) байдлаар хайх
    if (!rows || rows.length === 0) {
      // Хэрэв имэйл биш бол (утасны дугаар бол) зөвхөн цифрүүдийг нь шүүж авна
      const cleanSearch = contactInput.includes('@') ? contactInput.toLowerCase() : contactInput.replace(/[^0-9]/g, '');
      
      if (cleanSearch.length > 0) {
        res = await fetch(`${url}/rest/v1/user_credentials?contact=ilike.*${encodeURIComponent(cleanSearch)}*&select=*`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
          cache: 'no-store'
        });
        rows = await res.json() as Array<{ contact: string; password_hash: string }>;
      }
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Authentication failed. Account not found.' }, { status: 401 });
    }

    const userRecord = rows[0];
    const isValidPassword = await verifyPassword(password, userRecord.password_hash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Authentication failed. Incorrect password.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Login successful', contact: userRecord.contact }, { status: 200 });
  } catch (err) {
    console.error('[Login Error]:', err);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 400 });
  }
}