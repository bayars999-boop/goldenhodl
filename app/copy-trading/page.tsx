'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';

type Step = 'register' | 'captcha' | 'otp' | 'complete';

const solvedPuzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function moveTile(board: number[], index: number) {
  const empty = board.indexOf(0);
  const row = Math.floor(index / 3);
  const column = index % 3;
  const emptyRow = Math.floor(empty / 3);
  const emptyColumn = empty % 3;
  if (Math.abs(row - emptyRow) + Math.abs(column - emptyColumn) !== 1) return board;
  const next = [...board];
  [next[index], next[empty]] = [next[empty], next[index]];
  return next;
}

export default function CopyTradingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'Email' | 'Mobile'>('Email');
  const [step, setStep] = useState<Step>('register');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [puzzle, setPuzzle] = useState([1, 2, 3, 4, 5, 6, 0, 7, 8]);
  const [otp, setOtp] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const puzzleSolved = useMemo(() => puzzle.every((tile, index) => tile === solvedPuzzle[index]), [puzzle]);

  const startVerification = () => {
    if (!contact.trim() || password.length < 8) {
      setError('Имэйл/утас болон хамгийн багадаа 8 тэмдэгттэй нууц үгээ оруулна уу.');
      return;
    }
    setError('');
    setStep('captcha');
  };

  const sendCode = () => {
    setIsSending(true);
    setError('');
    const code = String(Math.floor(1000 + Math.random() * 9000));
    window.setTimeout(() => {
      setSentCode(code);
      setIsSending(false);
      setStep('otp');
    }, 500);
  };

  const verifyCode = () => {
    if (otp !== sentCode) {
      setError('Баталгаажуулах код буруу байна.');
      return;
    }
    setError('');
    setStep('complete');
    window.setTimeout(() => router.push('/login'), 700);
  };

  const colors = darkMode ? { page: '#0f172a', surface: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#475569', input: '#0f172a' } : { page: '#f8fafc', surface: '#ffffff', text: '#1e293b', muted: '#475569', border: '#cbd5e1', input: '#ffffff' };
  const inputStyle = { boxSizing: 'border-box' as const, width: '100%', background: colors.input, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '14px 12px', marginBottom: '12px', outline: 'none' };

  return (
    <main style={{ minHeight: '100vh', background: colors.page, color: colors.text, fontFamily: 'Arial, sans-serif', padding: '15px', transition: 'background .2s, color .2s' }}>
      <header style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '18px', fontSize: '13px', color: colors.muted }}>
        <span>Already have an account?</span><a href="/login" style={{ color: '#16a34a', border: '1px solid #16a34a', borderRadius: '4px', padding: '6px 14px', textDecoration: 'none' }}>Login</a>
      </header>
      <section style={{ maxWidth: '1280px', margin: '18px auto 0', background: colors.surface, padding: '15px', borderRadius: '4px', border: `1px solid ${colors.border}`, display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 460px)', gap: '40px', alignItems: 'start' }}>
        <div style={{ paddingTop: '12px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 54px', color: '#0284c7' }}>Welcome to <span style={{ color: '#16a34a' }}>GoldMaster</span></h1>
          <div style={{ textAlign: 'center', maxWidth: '380px' }}><img src={darkMode ? '/goldmaster-logo-dark.png' : '/goldmaster-logo.png'} alt="GoldMaster logo" style={{ display: 'block', width: '90px', height: '90px', objectFit: 'contain', margin: '0 auto 28px' }} /><strong style={{ display: 'block', fontSize: '14px', lineHeight: 1.5, color: colors.text }}>Connect, configure, and follow strategy.</strong></div>
        </div>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '24px', boxShadow: 'none' }}>
          {step === 'register' && <>
            <h2 style={{ margin: '0 0 12px', fontSize: '32px', lineHeight: 1.1, color: colors.text }}>START YOUR TRADING JOURNEY</h2>
            <div style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${colors.border}`, marginBottom: '20px' }}>{(['Email', 'Mobile'] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} style={{ background: 'none', border: 0, borderBottom: mode === item ? '2px solid #16a34a' : '2px solid transparent', color: mode === item ? '#0284c7' : colors.text, fontWeight: 700, padding: '0 10px 10px', cursor: 'pointer' }}>{item}</button>)}</div>
            <input aria-label={mode === 'Email' ? 'Email address' : 'Mobile number'} placeholder={mode === 'Email' ? 'Email address' : 'Mobile number'} type={mode === 'Email' ? 'email' : 'tel'} value={contact} onChange={(event) => setContact(event.target.value)} style={inputStyle} />
            <input aria-label="Password" placeholder="Create a password (8+ characters)" type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
            <button type="button" onClick={startVerification} style={{ width: '100%', border: '1px solid #16a34a', borderRadius: '4px', padding: '10px 14px', background: colors.surface, color: '#16a34a', fontWeight: 700, cursor: 'pointer' }}>Continue</button>
          </>}
          {step === 'captcha' && <><h2 style={{ margin: '0 0 10px', fontSize: '28px', color: '#0284c7' }}>Confirm you are human</h2><p style={{ color: colors.muted, fontSize: '13px' }}>Дүрсүүдийг зөв дарааллаар эвлүүлнэ үү.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: '8px', justifyContent: 'center', margin: '24px 0' }}>{puzzle.map((tile, index) => <button key={index} type="button" aria-label={tile ? `Puzzle tile ${tile}` : 'Empty puzzle tile'} onClick={() => setPuzzle(moveTile(puzzle, index))} style={{ width: '64px', height: '64px', borderRadius: '4px', border: `1px solid ${colors.border}`, background: tile ? (tile % 2 ? '#0c4a6e' : '#166534') : colors.page, color: '#f8fafc', fontSize: '20px', fontWeight: 700, cursor: tile ? 'pointer' : 'default' }}>{tile || ''}</button>)}</div><p style={{ color: puzzleSolved ? '#16a34a' : colors.muted, textAlign: 'center', fontSize: '13px' }}>{puzzleSolved ? 'Зөв эвлүүллээ.' : '1-8 хүртэлх тоог дарааллаар байрлуулна уу.'}</p><button type="button" disabled={!puzzleSolved} onClick={sendCode} style={{ width: '100%', border: '1px solid #16a34a', borderRadius: '4px', padding: '10px 14px', background: colors.surface, color: puzzleSolved ? '#16a34a' : colors.muted, fontWeight: 700, cursor: puzzleSolved ? 'pointer' : 'not-allowed' }}>{isSending ? 'Код илгээж байна...' : 'Баталгаажуулах код авах'}</button></>}
          {step === 'otp' && <><h2 style={{ margin: '0 0 10px', fontSize: '28px', color: '#0284c7' }}>Verify your account</h2><p style={{ color: '#475569', fontSize: '13px' }}>Таны бүртгүүлсэн {mode === 'Email' ? 'имэйлд' : 'утасны дугаарт'} 4 оронтой код илгээгдлээ.</p><input aria-label="4-digit verification code" inputMode="numeric" maxLength={4} placeholder="0000" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }} /><button type="button" onClick={verifyCode} disabled={otp.length !== 4} style={{ width: '100%', border: '1px solid #16a34a', borderRadius: '4px', padding: '10px 14px', background: '#ffffff', color: otp.length === 4 ? '#16a34a' : '#94a3b8', fontWeight: 700, cursor: otp.length === 4 ? 'pointer' : 'not-allowed' }}>Бүртгэлийг баталгаажуулах</button>{isDevelopment && <small style={{ display: 'block', marginTop: '14px', color: '#64748b', textAlign: 'center' }}>Development mode: илгээсэн код {sentCode}</small>}</>}
          {step === 'complete' && <div style={{ textAlign: 'center', padding: '44px 0' }}><div style={{ fontSize: '52px', color: '#16a34a' }}>✓</div><h2 style={{ color: '#0284c7' }}>Бүртгэл баталгаажлаа</h2><p style={{ color: '#475569' }}>Copy Trading үндсэн хуудас руу нэвтэрч байна...</p></div>}
          {error && <p role="alert" style={{ color: '#dc2626', fontSize: '13px', margin: '14px 0 0' }}>{error}</p>}
        </div>
      </section>
      <style>{`@media (max-width: 800px) { section { grid-template-columns: 1fr !important; gap: 34px !important; margin-top: 36px !important; } }`}</style>
    </main>
  );
}
