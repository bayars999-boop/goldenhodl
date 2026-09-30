'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { CountryFlag } from '../country-flag';

type Step = 'login' | 'forgot' | 'new-password';

const dialCodes: Record<string, string> = {
  AF: '+93', AX: '+358', AL: '+355', DZ: '+213', AS: '+1-684', AD: '+376', AO: '+244', AI: '+1-264', AQ: '+672', AG: '+1-268', AR: '+54', AM: '+374', AW: '+297', AU: '+61', AT: '+43', AZ: '+994', BS: '+1-242', BH: '+973', BD: '+880', BB: '+1-246', BY: '+375', BE: '+32', BZ: '+501', BJ: '+229', BM: '+1-441', BT: '+975', BO: '+591', BQ: '+599', BA: '+387', BW: '+267', BV: '+47', BR: '+55', IO: '+246', BN: '+673', BG: '+359', BF: '+226', BI: '+257', CV: '+238', KH: '+855', CM: '+237', CA: '+1', KY: '+1-345', CF: '+236', TD: '+235', CL: '+56', CN: '+86', CX: '+61', CC: '+61', CO: '+57', KM: '+269', CD: '+243', CG: '+242', CK: '+682', CR: '+506', CI: '+225', HR: '+385', CU: '+53', CW: '+599', CY: '+357', CZ: '+420', DK: '+45', DJ: '+253', DM: '+1-767', DO: '+1-809', EC: '+593', EG: '+20', SV: '+503', GQ: '+240', ER: '+291', EE: '+372', SZ: '+268', ET: '+251', FK: '+500', FO: '+298', FI: '+358', FR: '+33', GF: '+594', PF: '+689', TF: '+262', GA: '+241', GM: '+220', GE: '+995', DE: '+49', GH: '+233', GI: '+350', GR: '+30', GL: '+299', GD: '+1-473', GP: '+590', GU: '+1-671', GT: '+502', GG: '+44', GN: '+224', GW: '+245', GY: '+592', HT: '+509', HM: '+61', VA: '+379', HN: '+504', HK: '+852', HU: '+36', IS: '+354', IN: '+91', ID: '+62', IR: '+98', IQ: '+964', IE: '+353', IM: '+44', IL: '+972', IT: '+39', JM: '+1-876', JP: '+81', JE: '+44', JO: '+962', KZ: '+7', KE: '+254', KI: '+686', KP: '+850', KR: '+82', KW: '+965', KG: '+996', LA: '+856', LV: '+371', LB: '+961', LS: '+266', LR: '+231', LY: '+218', LI: '+423', LT: '+370', LU: '+352', MO: '+853', MG: '+261', MW: '+265', MY: '+60', MV: '+960', ML: '+223', MT: '+356', MH: '+692', MQ: '+596', MR: '+222', MU: '+230', YT: '+262', FM: '+691', MD: '+373', MC: '+377', MN: '+976', ME: '+382', MS: '+1-664', MA: '+212', MZ: '+258', NA: '+264', NR: '+674', NP: '+977', NL: '+31', NC: '+687', NZ: '+64', NI: '+505', NE: '+227', NG: '+234', NU: '+683', NF: '+672', MP: '+1-670', NO: '+47', OM: '+968', PK: '+92', PW: '+680', PS: '+970', PA: '+507', PG: '+675', PY: '+595', PE: '+51', PH: '+63', PN: '+64', PT: '+351', PR: '+1', QA: '+974', RE: '+262', RO: '+40', RU: '+7', RW: '+250', BL: '+590', SH: '+290', KN: '+1-869', LC: '+1-758', MF: '+590', PM: '+508', VC: '+1-784', WS: '+685', SM: '+378', ST: '+239', SA: '+966', SN: '+221', RS: '+381', SC: '+248', SL: '+232', SG: '+65', SX: '+599', SK: '+421', SI: '+386', SB: '+677', SO: '+252', ZA: '+27', GS: '+500', SS: '+211', ES: '+34', LK: '+94', SD: '+249', SJ: '+47', SE: '+46', CH: '+41', SY: '+963', TW: '+886', TJ: '+992', TZ: '+255', TH: '+66', TL: '+670', TG: '+228', TK: '+690', TO: '+676', TT: '+1-868', TN: '+216', TR: '+90', TM: '+993', TC: '+1-649', TV: '+688', UG: '+256', UA: '+380', AE: '+971', GB: '+44', US: '+1', UM: '+1', UY: '+598', UZ: '+998', VU: '+678', VE: '+58', VN: '+84', VG: '+1-284', VI: '+1-340', WF: '+681', EH: '+212', YE: '+967', ZM: '+260', ZW: '+263'
};

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [mode, setMode] = useState<'Email' | 'Mobile'>('Email');
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [dialCode, setDialCode] = useState('');

  const colors = dark ? { page: '#0f172a', surface: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#475569', input: '#0f172a' } : { page: '#f8fafc', surface: '#fff', text: '#1e293b', muted: '#cbd5e1', border: '#475569', input: '#fff' };
  const input = { width: '100%', boxSizing: 'border-box' as const, padding: '13px 12px', marginBottom: '12px', border: `1px solid ${colors.border}`, borderRadius: '4px', background: colors.input, color: colors.text, outline: 'none' };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('confirmed') === '1') setNotice('Your email address has been confirmed. You can log in now.');
      if (params.get('error') === 'link-expired') setError('That link is invalid or has expired. Request a new one.');
      const requestedStep = params.get('step');
      if (requestedStep === 'new-password') setStep(requestedStep);
      
      const storedCountry = window.localStorage.getItem('goldmaster-country-code') || '';
      setCountryCode(storedCountry);
      if (storedCountry && dialCodes[storedCountry.toUpperCase()]) {
        const code = dialCodes[storedCountry.toUpperCase()];
        setDialCode(code);
        setMobile(code + ' ');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleModeChange = (newMode: 'Email' | 'Mobile') => {
    setMode(newMode);
    setError('');
    if (newMode === 'Mobile' && !mobile.trim() && dialCode) {
      setMobile(dialCode + ' ');
    }
  };

  const sendCode = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) { setError('Enter the email address registered to your account.'); return; }
    setError(''); setNotice(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: targetEmail }) });
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
    const contactValue = mode === 'Email' ? email.trim() : mobile.trim();
    if (!contactValue || !password) { setError('Enter your email or mobile number and password.'); return; }
    setError(''); setNotice(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          contact: contactValue, 
          identifier: contactValue, // API талдаа аль аль түлхүүрээр хүлээж авах боломжтой болгох үүднээс давхар дамжуулав
          password 
        }) 
      });
      const result = await response.json().catch(() => ({})) as { contact?: string; error?: string };
      if (!response.ok) { setError(result.error || 'Authentication failed.'); return; }
      window.localStorage.setItem('goldmaster-user-contact', result.contact || contactValue);
      router.push('/dashboard');
    } finally { setBusy(false); }
  };

  return <main suppressHydrationWarning style={{ minHeight: '100vh', background: colors.page, color: colors.text, padding: '15px', fontFamily: 'Arial, sans-serif' }}>
    <section suppressHydrationWarning style={{ maxWidth: '460px', margin: '50px auto', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '30px', boxShadow: dark ? '0 12px 35px rgba(0,0,0,.3)' : '0 8px 25px rgba(15,23,42,.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <img src={dark ? '/goldmaster-logo-dark.png' : '/goldmaster-logo.png'} alt="GoldMaster logo" style={{ display: 'block', width: '90px', height: '90px', objectFit: 'contain', margin: '0 auto 14px' }} />
        {countryCode && <CountryFlag code={countryCode} size={22} />}
        <h2 style={{ margin: 0, color: '#0284c7', fontSize: '28px' }}>Welcome to <span style={{ color: '#16a34a' }}>GoldMaster</span></h2>
        <p style={{ margin: '18px 0 6px', fontSize: '16.8px', lineHeight: 1.25, fontWeight: 400, color: colors.text }}>Past performance does not guarantee future results.</p>
      </div>
      {step === 'login' && <><h1 style={{ textAlign: 'center', fontSize: '28px', margin: '0 0 22px' }}>LOG IN</h1><div style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${colors.border}`, marginBottom: '20px' }}>{(['Email', 'Mobile'] as const).map((item) => <button className={mode === item ? 'dark-active-nav' : undefined} key={item} type="button" onClick={() => handleModeChange(item)} style={{ background: 'none', border: 0, padding: '0 10px 10px', color: mode === item ? '#0284c7' : colors.text, fontWeight: 700, borderBottom: mode === item ? '2px solid #16a34a' : '2px solid transparent' }}>{item}</button>)}</div>
        {mode === 'Email' ? (
          <input aria-label="Email address" placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
        ) : (
          <input aria-label="Mobile number" placeholder="Mobile number" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} style={input} />
        )}
        <input aria-label="Password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} /><button type="button" onClick={login} disabled={busy} style={{ width: '100%', padding: '11px', border: '1px solid #16a34a', borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>{busy ? 'Logging in...' : 'Log in'}</button><button type="button" onClick={() => { setError(''); setNotice(''); setStep('forgot'); }} style={{ display: 'block', margin: '18px auto 0', border: 0, background: 'none', color: '#0284c7', cursor: 'pointer' }}>Forgot password?</button></>}
      {step === 'forgot' && <><h1 style={{ textAlign: 'center', fontSize: '24px' }}>Reset password</h1><p style={{ color: colors.muted, fontSize: '13px' }}>Enter the email address registered to your account. A password reset link will be emailed to you.</p><input aria-label="Recovery email" placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} /><button type="button" onClick={sendCode} disabled={busy} style={{ width: '100%', padding: '11px', border: 0, borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>{busy ? 'Sending…' : 'Send code'}</button></>}
      {step === 'new-password' && <><h1 style={{ textAlign: 'center', fontSize: '24px' }}>Create new password</h1><input aria-label="New password" placeholder="New password (8+ characters)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={input} /><button type="button" onClick={savePassword} disabled={busy} style={{ width: '100%', padding: '11px', border: 0, borderRadius: '4px', background: '#16a34a', color: '#fff', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>{busy ? 'Saving…' : 'Save password'}</button></>}
      {error && <p role="alert" style={{ color: '#fb7185', fontSize: '13px', marginTop: '14px' }}>{error}</p>}
      {notice && !error && <p role="status" style={{ color: '#16a34a', fontSize: '13px', marginTop: '14px' }}>{notice}</p>}
      <a href="/signin" style={{ display: 'block', textAlign: 'center', marginTop: '22px', color: '#0284c7', fontSize: '13px' }}>Create an account</a>
    </section>
  </main>;
}