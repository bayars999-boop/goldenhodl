'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { CountryFlag } from '../country-flag';

type Step = 'login' | 'forgot' | 'new-password';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [mode, setMode] = useState<'Email' | 'Mobile'>('Email');
  const [step, setStep] = useState<Step>('login');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const colors = dark ? { page: '#0f172a', surface: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#475569', input: '#0f172a' } : { page: '#f8fafc', surface: '#fff', text: '#1e293b', muted: '#475569', border: '#cbd5e1', input: '#fff' };
  const input = { width: '100%', boxSizing: 'border-box' as const, padding: '13px 12px', marginBottom: '12px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: colors.input, color: colors.text, outline: 'none' };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('confirmed') === '1') setNotice('Your email address has been confirmed. You can log in now.');
      if (params.get('error') === 'link-expired') setError('That link is invalid or has expired. Request a new one.');
      const requestedStep = params.get('step');
      if (requestedStep === 'new-password') setStep(requestedStep);
      setCountryCode(window.localStorage.getItem('goldmaster-country-code') || '');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const sendCode = async () => {
    const email = contact.trim().toLowerCase();
    if (!email || !email.includes('@')) { setError('Enter the email address registered to your account.'); return; }
    setError(''); setNotice(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: email }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) { setError(result.error || 'Unable to send the reset code.'); return; }
      setNotice('A password reset link has been emailed to you. Open it to set a new password.');
      setStep('login');
    } finally { setBusy(false); }
  };
  const savePassword = async () => {
    if (newPassword.length < 8) { setError('Password must contain at least 8 characters.'); return; }
    setError(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/reset/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) { setError(result.error || 'Unable to save the new password.'); return; }
      setNewPassword(''); setPassword('');
      setStep('login');
      setNotice('Your password has been updated. Log in with your new password.');
    } finally { setBusy(false); }
  };
  const login = async () => {
    if (!contact.trim() || !password) { setError('Enter your email or mobile number and password.'); return; }
    setError(''); setNotice('');
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: contact.trim(), password }) });
    const result = await response.json().catch(() => ({})) as { contact?: string; error?: string };
    if (!response.ok) { setError(result.error || 'Authentication failed.'); return; }
    window.localStorage.setItem('goldmaster-user-contact', result.contact || contact.trim());
    router.push('/dashboard');
  };

  return <main suppressHydrationWarning style={{ minHeight: '100vh', background: colors.page, color: colors.text, padding: '15px', fontFamily: 'Arial, sans-serif' }}>
    <section suppressHydrationWarning style={{ maxWidth: '460px', margin: '50px auto', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '30px', boxShadow: dark ? '0 12px 35px rgba(0,0,0,.3)' : '0 8px 25px rgba(15,23,42,.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <img src={dark ? '/goldmaster-logo-dark.png' : '/goldmaster-logo.png'} alt="GoldMaster logo" style={{ display: 'block', width: '90px', height: '90px', objectFit: 'contain', margin: '0 auto 14px' }} />
        {countryCode && <CountryFlag code={countryCode} size={22} />}
        <h2 style={{ margin: 0, color: '#0284c7', fontSize: '28px' }}>Welcome to <span style={{ color: '#16a34a' }}>GoldMaster</span></h2>
        <p style={{ margin: '18px 0 6px', fontSize: '16.8px', lineHeight: 1.25, fontWeight: 400, color: colors.text }}>Past performance does not guarantee future results.</p>
      </div>
      {step === 'login' && <><h1 style={{ textAlign: 'center', fontSize: '28px', margin: '0 0 22px' }}>LOG IN</h1><div style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${colors.border}`, marginBottom: '20px' }}>{(['Email', 'Mobile'] as const).map((item) => <button className={mode === item ? 'dark-active-nav' : undefined} key={item} type="button" onClick={() => setMode(item)} style={{ background: 'none', border: 0, padding: '0 10px 10px', color: mode === item ? '#0284c7' : colors.text, fontWeight: 700, borderBottom: mode === item ? '2px solid #16a34a' : '2px solid transparent' }}>{item}</button>)}</div><input aria-label={mode === 'Email' ? 'Email address' : 'Mobile number'} placeholder={mode === 'Email' ? 'Email address' : 'Mobile number'} value={contact} onChange={(e) => setContact(e.target.value)} style={input} /><input aria-label="Password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} /><button type="button" onClick={login} style={{ width: '100%', padding: '11px', border: '1px solid #16a34a', borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700 }}>Log in</button><button type="button" onClick={() => { setError(''); setNotice(''); setStep('forgot'); }} style={{ display: 'block', margin: '18px auto 0', border: 0, background: 'none', color: '#0284c7', cursor: 'pointer' }}>Forgot password?</button></>}
      {step === 'forgot' && <><h1 style={{ textAlign: 'center', fontSize: '24px' }}>Reset password</h1><p style={{ color: colors.muted, fontSize: '13px' }}>Enter the email address registered to your account. A password reset link will be emailed to you.</p><input aria-label="Recovery email" placeholder="Email address" type="email" value={contact} onChange={(e) => setContact(e.target.value)} style={input} /><button type="button" onClick={sendCode} disabled={busy} style={{ width: '100%', padding: '11px', border: 0, borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>{busy ? 'Sending…' : 'Send code'}</button></>}
      {step === 'new-password' && <><h1 style={{ textAlign: 'center', fontSize: '24px' }}>Create new password</h1><input aria-label="New password" placeholder="New password (8+ characters)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={input} /><button type="button" onClick={savePassword} disabled={busy} style={{ width: '100%', padding: '11px', border: 0, borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>{busy ? 'Saving…' : 'Save password'}</button></>}
      {error && <p role="alert" style={{ color: '#fb7185', fontSize: '13px', marginTop: '14px' }}>{error}</p>}
      {notice && !error && <p role="status" style={{ color: '#16a34a', fontSize: '13px', marginTop: '14px' }}>{notice}</p>}
      <a href="/signin" style={{ display: 'block', textAlign: 'center', marginTop: '22px', color: '#0284c7', fontSize: '13px' }}>Create an account</a>
    </section>
  </main>;
}
