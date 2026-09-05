'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';

type Step = 'login' | 'forgot' | 'reset-code' | 'new-password';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [mode, setMode] = useState<'Email' | 'Mobile'>('Email');
  const [step, setStep] = useState<Step>('login');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const colors = dark ? { page: '#0f172a', surface: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#475569', input: '#0f172a' } : { page: '#f8fafc', surface: '#fff', text: '#1e293b', muted: '#475569', border: '#cbd5e1', input: '#fff' };
  const input = { width: '100%', boxSizing: 'border-box' as const, padding: '13px 12px', marginBottom: '12px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: colors.input, color: colors.text, outline: 'none' };
  const sendCode = () => { if (!contact.trim()) { setError('Имэйл эсвэл утасны дугаараа оруулна уу.'); return; } setError(''); setSentCode(String(Math.floor(1000 + Math.random() * 9000))); setStep('reset-code'); };
  const finishReset = () => { if (code !== sentCode) { setError('4 оронтой код буруу байна.'); return; } setError(''); setStep('new-password'); };
  const login = () => { if (!contact.trim() || !password) { setError('Имэйл/утас болон нууц үгээ оруулна уу.'); return; } window.localStorage.setItem('goldmaster-user-contact', contact.trim()); router.push('/dashboard'); };

  return <main style={{ minHeight: '100vh', background: colors.page, color: colors.text, padding: '15px', fontFamily: 'Arial, sans-serif' }}>
    <section style={{ maxWidth: '460px', margin: '80px auto', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '30px', boxShadow: dark ? '0 12px 35px rgba(0,0,0,.3)' : '0 8px 25px rgba(15,23,42,.08)' }}>
      <img src={dark ? '/goldmaster-logo-dark.png' : '/goldmaster-logo.png'} alt="GoldMaster logo" style={{ display: 'block', width: '90px', height: '90px', objectFit: 'contain', margin: '0 auto 14px' }} />
      {step === 'login' && <><h1 style={{ textAlign: 'center', fontSize: '28px', margin: '0 0 22px' }}>LOG IN</h1><div style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${colors.border}`, marginBottom: '20px' }}>{(['Email', 'Mobile'] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} style={{ background: 'none', border: 0, padding: '0 10px 10px', color: mode === item ? '#0284c7' : colors.text, fontWeight: 700, borderBottom: mode === item ? '2px solid #16a34a' : '2px solid transparent' }}>{item}</button>)}</div><input aria-label={mode === 'Email' ? 'Email address' : 'Mobile number'} placeholder={mode === 'Email' ? 'Email address' : 'Mobile number'} value={contact} onChange={(e) => setContact(e.target.value)} style={input} /><input aria-label="Password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} /><button type="button" onClick={login} style={{ width: '100%', padding: '11px', border: '1px solid #16a34a', borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700 }}>Log in</button><button type="button" onClick={() => { setError(''); setStep('forgot'); }} style={{ display: 'block', margin: '18px auto 0', border: 0, background: 'none', color: '#0284c7', cursor: 'pointer' }}>Forgot password?</button></>}
      {step === 'forgot' && <><h1 style={{ textAlign: 'center', fontSize: '24px' }}>Reset password</h1><p style={{ color: colors.muted, fontSize: '13px' }}>Имэйл эсвэл утасны дугаарт 4 оронтой код илгээнэ.</p><input aria-label="Recovery contact" placeholder="Email or mobile number" value={contact} onChange={(e) => setContact(e.target.value)} style={input} /><button type="button" onClick={sendCode} style={{ width: '100%', padding: '11px', border: 0, borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700 }}>Send code</button></>}
      {step === 'reset-code' && <><h1 style={{ textAlign: 'center', fontSize: '24px' }}>Enter code</h1><p style={{ color: colors.muted, fontSize: '13px' }}>4 оронтой код илгээгдлээ.</p><input aria-label="4-digit reset code" inputMode="numeric" maxLength={4} placeholder="0000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ ...input, textAlign: 'center', letterSpacing: '8px', fontSize: '22px' }} /><button type="button" onClick={finishReset} style={{ width: '100%', padding: '11px', border: 0, borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700 }}>Verify code</button>{process.env.NODE_ENV !== 'production' && <small style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: colors.muted }}>Development code: {sentCode}</small>}</>}
      {step === 'new-password' && <><h1 style={{ textAlign: 'center', fontSize: '24px' }}>Create new password</h1><input aria-label="New password" placeholder="New password (8+ characters)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={input} /><button type="button" onClick={() => newPassword.length >= 8 ? setStep('login') : setError('Нууц үг 8-аас дээш тэмдэгттэй байна.')} style={{ width: '100%', padding: '11px', border: 0, borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700 }}>Save password</button></>}
      {error && <p role="alert" style={{ color: '#fb7185', fontSize: '13px', marginTop: '14px' }}>{error}</p>}
      <a href="/copy-trading" style={{ display: 'block', textAlign: 'center', marginTop: '22px', color: '#0284c7', fontSize: '13px' }}>Create an account</a>
    </section>
  </main>;
}
