'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Completing secure authentication…');

  useEffect(() => {
    const fail = (text: string) => { setMessage(text); window.setTimeout(() => router.replace('/login'), 2500); };
    const finish = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const query = new URLSearchParams(window.location.search);
      const type = hash.get('type') || query.get('type') || 'signup';
      let accessToken = hash.get('access_token');
      let email = '';
      const tokenHash = query.get('token_hash');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!accessToken && tokenHash && supabaseUrl && anonKey) {
        const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, { method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ token_hash: tokenHash, type }) });
        const verified = await verifyResponse.json() as { access_token?: string; user?: { email?: string } };
        if (verifyResponse.ok && verified.access_token) {
          accessToken = verified.access_token;
          email = (verified.user?.email || '').toLowerCase();
        }
      }
      if (accessToken && !email) {
        try { email = ((JSON.parse(atob(accessToken.split('.')[1])) as { email?: string }).email || '').toLowerCase(); } catch { email = ''; }
      }

      if (!accessToken) {
        if (query.get('code')) { router.replace('/login?confirmed=1'); return; }
        fail('This link is invalid or has expired. Request a new one.');
        return;
      }

      if (type === 'recovery') {
        const sessionResponse = await fetch('/api/auth/reset/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken, email }) });
        if (sessionResponse.ok) { router.replace('/login?step=new-password'); return; }
        fail('Unable to start the password reset session. Request a new reset link.');
        return;
      }
      router.replace('/login?confirmed=1');
    };
    finish().catch(() => fail('This link is invalid or has expired. Request a new one.'));
  }, [router]);

  return <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', background: '#f8fafc', color: '#1e293b', padding: '15px' }}><p style={{ fontSize: '14px' }}>{message}</p></main>;
}
