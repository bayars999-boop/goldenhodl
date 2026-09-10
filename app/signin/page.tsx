'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { CountryFlag } from '../country-flag';
import { isAdult, LEGAL_ADULT_AGE } from '../lib/age';
import ThirdPartyDisclosure from '../third-party-disclosure';
import ConsentField from '../consent-field';

type Step = 'register' | 'risk' | 'captcha' | 'otp' | 'complete';
type Country = { name: string; code: string; dial: string };

const countryCodes = 'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CD CG CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ');
const dialCodes: Record<string, string> = { MN: '+976', US: '+1', DE: '+49', JP: '+81', BR: '+55', ZA: '+27', GB: '+44', CN: '+86', KR: '+82', AU: '+61', CA: '+1', FR: '+33', IN: '+91', RU: '+7', SG: '+65', CH: '+41', TR: '+90' };

function getCountries() {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  return countryCodes
    .map((code) => ({ name: regionNames.of(code) || code, code, dial: dialCodes[code] || '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

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
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [step, setStep] = useState<Step>('register');
  const [mode, setMode] = useState<'Email' | 'Mobile'>('Email');
  const [contact, setContact] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [referralCode, setReferralCode] = useState('');
    const [consents, setConsents] = useState({ privacy: false, terms: false, risk: false });
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [puzzle, setPuzzle] = useState([1, 2, 3, 4, 5, 6, 0, 7, 8]);
  const [otp, setOtp] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const puzzleSolved = useMemo(() => puzzle.every((tile, index) => tile === solvedPuzzle[index]), [puzzle]);
  const selectedCountry = countries.find((item) => item.code === country);
    const isFormValid = consents.privacy && consents.terms && consents.risk;
    const ageEligible = isAdult(dateOfBirth);
  const riskAccepted = consents.risk;
  const setRiskAccepted = (value: boolean) => setConsents((current) => ({ ...current, risk: value }));
  const colors = darkMode
    ? { page: '#0f172a', surface: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#475569', input: '#0f172a' }
    : { page: '#f8fafc', surface: '#fff', text: '#1e293b', muted: '#475569', border: '#cbd5e1', input: '#fff' };
  const inputStyle = {
    boxSizing: 'border-box' as const, width: '100%', background: colors.input, color: colors.text,
    border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '14px 12px', marginBottom: '12px', outline: 'none',
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const detectedCountries = getCountries();
      setCountries(detectedCountries);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isSubmitting) return;
    if (!contact.trim() || password.length < 8) {
      setError('Enter your email or mobile number and a password with at least 8 characters.');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }
    if (!ageEligible) {
      setError(`You must be at least ${LEGAL_ADULT_AGE} years old to use this service.`);
      return;
    }
    if (!consents.privacy || !consents.terms || !consents.risk) {
      setError('Please accept the Privacy Policy, Terms and Risk Disclosure before continuing.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contact.trim(), password, dateOfBirth, privacyConsent: consents.privacy, termsConsent: consents.terms, riskConsent: consents.risk, marketingConsent: marketingAccepted }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(result.error || 'Registration failed.');
        return;
      }
      setStep('complete');
      window.setTimeout(() => router.push('/login'), 700);
    } catch {
      setError('Unable to reach the registration server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const sendCode = () => {
    setIsSending(true);
    setError('');
    window.setTimeout(() => {
      setSentCode(String(Math.floor(1000 + Math.random() * 9000)));
      setIsSending(false);
      setStep('otp');
    }, 500);
  };
  const verifyCode = async () => {
    if (otp !== sentCode) {
      setError('The verification code is incorrect.');
      return;
    }
    const registrationResponse = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: contact.trim(), password, dateOfBirth, privacyConsent: consents.privacy, termsConsent: consents.terms, riskConsent: consents.risk, marketingConsent: marketingAccepted }) });
    if (!registrationResponse.ok) {
      const result = await registrationResponse.json().catch(() => ({})) as { error?: string };
      setError(result.error || 'Secure account registration is unavailable.');
      return;
    }
    setError('');
    setStep('complete');
    window.setTimeout(() => router.push('/login'), 700);
  };

  return (
    <main suppressHydrationWarning style={{ minHeight: '100vh', background: colors.page, color: colors.text, fontFamily: 'Arial, sans-serif', padding: '15px 15px 90px' }}>
      <section suppressHydrationWarning style={{ maxWidth: '1280px', margin: '0 auto', background: colors.surface, padding: '15px', borderRadius: '4px', border: `1px solid ${colors.border}`, display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 460px)', gap: '40px', alignItems: 'start' }}>
        <header style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', fontSize: '13px', color: colors.muted, background: colors.surface, padding: '10px 12px', borderRadius: '4px' }}>
          <span style={{ fontSize: '13px', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>Already have an account?</span>
          <a href="/login" style={{ color: '#16a34a', border: '1px solid #16a34a', borderRadius: '4px', padding: '6px 14px', textDecoration: 'none', fontSize: '13px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Login</a>
        </header>
        <div className="registration-hero" style={{ padding: '28px 18px 10px', color: colors.muted, textAlign: 'center' }}>
          <img src={darkMode ? '/goldmaster-logo-dark.png' : '/goldmaster-logo.png'} alt="GoldMaster logo" style={{ display: 'block', width: '90px', height: '90px', objectFit: 'contain', margin: '0 auto 12px' }} />
          <h1 style={{ margin: 0, color: '#0284c7', fontSize: '28px' }}>Welcome to <span style={{ color: '#16a34a' }}>GoldMaster</span></h1>
          <div style={{ fontSize: '25px', lineHeight: 1.3, fontWeight: 800, color: colors.text }}>Build your future with GoldMaster.</div>
          <p style={{ margin: '12px auto 0', maxWidth: '420px', fontSize: '18px', lineHeight: 1.5 }}>Access professional strategies and manage your account securely.</p>
          <svg className="world-circuit-map" viewBox="0 0 760 430" role="img" aria-label="Glowing pointillist world map">
            <defs>
              <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <pattern id="dotGrid" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r=".625" fill="#67e8f9" /></pattern>
              <mask id="landMask" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="760" height="430"><image href="/world-map.svg" x="0" y="0" width="760" height="430" preserveAspectRatio="none" /></mask>
            </defs>
            <rect width="760" height="430" fill="url(#dotGrid)" mask="url(#landMask)" filter="url(#dotGlow)" />
          </svg>
          <p style={{ margin: '14px auto 0', maxWidth: '420px', color: colors.text, fontSize: '16.8px', lineHeight: 1.25, fontWeight: 400 }}>Past performance does not guarantee future results.</p>
        </div>
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '24px' }}>
          {step === 'register' && <div>
            <h2 style={{ margin: '0 0 12px', fontSize: '30px', fontWeight: 700 }}>Register</h2>
            <label>Country of Residence (optional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select aria-label="Country of residence" value={country} onChange={(event) => { setCountry(event.target.value); window.localStorage.setItem('goldmaster-country-code', event.target.value); }} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Prefer not to say</option>
                {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
              <span style={{ ...inputStyle, width: '76px', color: colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>{selectedCountry && <CountryFlag code={selectedCountry.code} size={20} />}</span>
            </div>
            <small style={{ color: colors.muted, display: 'block', marginBottom: '12px' }}>{selectedCountry ? `Phone code for selected country: ${selectedCountry.dial}` : 'Country is optional and can be provided later if required for verification.'}</small>
            <div style={{ display: 'flex', gap: '18px', marginBottom: '12px' }}>{(['Email', 'Mobile'] as const).map((item) => <button className={mode === item ? 'dark-active-nav' : undefined} key={item} type="button" onClick={() => setMode(item)} style={{ background: 'none', border: 0, borderBottom: mode === item ? '2px solid #16a34a' : '2px solid transparent', color: mode === item ? '#0284c7' : colors.text, padding: '8px', fontWeight: 700 }}>{item}</button>)}</div>
            <input aria-label={mode === 'Email' ? 'Email address' : 'Mobile number'} placeholder={mode === 'Email' ? 'Email' : `${selectedCountry?.dial || ''} Mobile number`.trim()} type={mode === 'Email' ? 'email' : 'tel'} value={contact} onChange={(event) => setContact(event.target.value)} style={inputStyle} />
            <input aria-label="Password" placeholder="Password (8+ characters)" type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
            <label htmlFor="date-of-birth" style={{ display: 'block', color: colors.muted, fontSize: '13px', marginBottom: '12px' }}>Date of birth (required)<input id="date-of-birth" aria-label="Date of birth" required type="date" max={new Date().toISOString().slice(0, 10)} value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} style={{ ...inputStyle, marginTop: '6px', marginBottom: 0 }} />{dateOfBirth && !ageEligible && <small style={{ display: 'block', color: '#dc2626', marginTop: '6px' }}>You must be at least {LEGAL_ADULT_AGE} years old to use this service.</small>}</label>
            <p style={{ color: colors.muted }}>Have a partner or referral code? <button type="button" onClick={() => setReferralCode(referralCode ? '' : ' ')} style={{ border: 0, background: 'none', color: '#2563eb', padding: 0 }}>Enter here</button></p>
            {referralCode !== '' && <input aria-label="Referral code" placeholder="Referral code" value={referralCode.trim()} onChange={(event) => setReferralCode(event.target.value)} style={inputStyle} />}
            <p style={{ fontSize: '13px', color: colors.muted }}>Registration is enabled after you read and accept the risk disclosure.</p>
            <button type="button" onClick={() => setStep('risk')} style={{ width: '100%', border: `1px solid ${consents.risk ? '#16a34a' : colors.border}`, borderRadius: '6px', padding: '11px', background: colors.surface, color: consents.risk ? '#16a34a' : colors.text, fontWeight: 700 }}>Risk disclosure {consents.risk ? '✓' : 'Read'}</button>
            <div style={{ display: 'grid', gap: '10px', marginTop: '16px', fontSize: '13px', lineHeight: 1.4 }}>
              <ConsentField id="privacy-consent" checked={consents.privacy} onChange={(checked) => setConsents((current) => ({ ...current, privacy: checked }))} summary="For the service, security, and payment, necessary data may be processed by Supabase, Vercel, MetaApi Cloud, and Lemon Squeezy under contract, security, or legal obligations.">I have read and accept the <a href="/legal-documents?document=privacy" target="_blank" rel="noreferrer">Privacy Policy</a>. <button type="button" onClick={() => setShowPrivacyDetails(true)}>View details</button></ConsentField>
              <ConsentField id="terms-consent" checked={consents.terms} onChange={(checked) => setConsents((current) => ({ ...current, terms: checked }))} summary="These terms explain the service rules, payment obligations, account responsibilities, and trading risks.">I have read and accept the <a href="/legal-documents?document=terms" target="_blank" rel="noreferrer">Terms and Conditions</a>.</ConsentField>
              <ConsentField id="marketing-consent" checked={marketingAccepted} onChange={setMarketingAccepted} summary="You can withdraw this permission at any time without affecting the service.">I agree to receive optional marketing communications.</ConsentField>
            </div>
            <button type="submit" onClick={handleSubmit} disabled={!isFormValid || !ageEligible || isSubmitting} className={isFormValid && ageEligible && !isSubmitting ? 'bg-blue-600' : 'bg-gray-300 cursor-not-allowed'} style={{ width: '100%', marginTop: '12px', border: 0, borderRadius: '6px', padding: '13px', background: isFormValid && ageEligible && !isSubmitting ? '#16a34a' : '#e2e8f0', color: isFormValid && ageEligible && !isSubmitting ? '#fff' : '#94a3b8', fontWeight: 700, cursor: isFormValid && ageEligible && !isSubmitting ? 'pointer' : 'not-allowed' }}>{isSubmitting ? 'Registering...' : 'Register'}</button>
            {showPrivacyDetails && <ThirdPartyDisclosure colors={colors} onClose={() => setShowPrivacyDetails(false)} />}
          </div>}
          {step === 'risk' && <div><h2>RISK DISCLOSURE</h2><style>{`.risk-disclosure h3{margin:1em 0 .5em}.risk-disclosure p{margin:.5em 0}`}</style><div className="risk-disclosure" style={{ maxHeight: '55vh', overflowY: 'auto', color: colors.muted, lineHeight: 1.55, fontSize: '14px' }}><h3>1. Introduction</h3><p><strong>1.1.</strong> This notice is designed to provide you with a general understanding of the risks that may arise when trading gold and investment products.</p><p><strong>1.2.</strong> Since it is impossible to fully explain all risks, you must carefully evaluate your financial situation before making any investments.</p><h3>2. Risk Warnings</h3><p><strong>2.1.</strong> The company uses automated trading robots for investment operations, which process historical market data using mathematical methods to make decisions; however, it is impossible to completely predict the future. Therefore, before deciding to use the system, please carefully study the backtest results and live account trading performance metrics to make your decision. Once a selection is made, the client assumes full responsibility for the risk.</p><p><strong>2.2.</strong> By making an investment decision and using our product, your account balance may increase or decrease. You may suffer large losses in a very short period and completely lose your invested capital, so you should not invest money that you are not prepared to lose.</p><p><strong>2.3.</strong> Once you have chosen our product, you must not perform manual actions on that account such as opening or closing trades, or manually changing profit/loss limits. Such actions by you may disrupt the logic of the trading robot and consequently put your account at risk of being lost.</p><h3>3. Price Volatility and Market Limitations</h3><p><strong>3.1.</strong> During sudden market fluctuations, &quot;Stop Loss&quot; orders may be executed at a worse price than you predetermined. Additionally, &quot;Gapping&quot; phenomena may occur, causing unexpected risks to your account.</p><h3>4. Margin and Leverage</h3><p><strong>4.1.</strong> We handle your trading account and VPS hosting through the broker XMGlobal. According to that broker&apos;s risk policy, positions will begin to close when the margin level reaches approximately 50%, and all orders will be automatically closed if it drops to 20% or lower. This guarantees from the broker&apos;s side that the client&apos;s account will not go into a negative balance.</p><p><strong>4.2.</strong> Leverage allows you to trade large amounts with a small amount of capital; however, if the market moves against you, it multiplies the risk of losing your capital very quickly.</p><h3>5. Other Provisions</h3><p><strong>5.1.</strong> Financing fees (swaps) may be deducted or credited for orders held overnight.</p><p><strong>5.2.</strong> The client shall independently bear taxes and other legal obligations in accordance with applicable laws and regulations. The company does not provide tax or legal advice.</p><p><em>(This document constitutes an official legal notice warning of the risks involved in trading on the financial markets).</em></p></div><label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '22px 0' }}><input type="checkbox" checked={riskAccepted} onChange={(event) => setRiskAccepted(event.target.checked)} /> I have read, understood and accept the Risk Disclosure.</label><button type="button" onClick={() => setStep('register')} disabled={!riskAccepted} style={{ width: '100%', border: 0, borderRadius: '6px', padding: '13px', background: riskAccepted ? '#16a34a' : '#e2e8f0', color: riskAccepted ? '#fff' : '#94a3b8', fontWeight: 700 }}>Continue registration</button></div>}
          {step === 'captcha' && <div><h2>Confirm you are human</h2><p style={{ color: colors.muted }}>Arrange the tiles in the correct order.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: '8px', justifyContent: 'center', margin: '24px 0' }}>{puzzle.map((tile, index) => <button key={index} type="button" onClick={() => setPuzzle(moveTile(puzzle, index))} style={{ width: '64px', height: '64px', background: tile ? '#166534' : colors.page, color: '#fff', fontSize: '20px' }}>{tile || ''}</button>)}</div><button type="button" disabled={!puzzleSolved} onClick={sendCode} style={{ width: '100%', padding: '12px', color: puzzleSolved ? '#16a34a' : colors.muted }}>{isSending ? 'Sending code...' : 'Get verification code'}</button></div>}
          {step === 'otp' && <div><h2>Verify your account</h2><p style={{ color: colors.muted }}>A 4-digit code has been sent.</p><input aria-label="4-digit verification code" inputMode="numeric" maxLength={4} placeholder="0000" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }} /><button type="button" onClick={verifyCode} disabled={otp.length !== 4} style={{ width: '100%', padding: '12px', color: otp.length === 4 ? '#16a34a' : colors.muted }}>Complete registration</button>{isDevelopment && <small>Development code: {sentCode}</small>}</div>}
          {step === 'complete' && <div style={{ textAlign: 'center', padding: '44px 0' }}><div style={{ fontSize: '52px', color: '#16a34a' }}>✓</div><h2>Registration complete</h2></div>}
          {error && <p role="alert" style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
        </div>
      </section>
      <style>{`.registration-hero{transform:translateY(-16px)}.registration-hero>img,.registration-hero>h1{transform:translateY(-32px)}.world-circuit-map{display:block;width:min(120%,624px);height:auto;margin:18px auto 0;background:transparent;filter:drop-shadow(0 0 10px rgba(14,165,233,.3));animation:circuitFloat 5s ease-in-out infinite}@keyframes circuitFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@media(max-width:800px){.registration-hero{padding-top:16px!important;transform:translateY(-16px)}.registration-hero>img,.registration-hero>h1{transform:translateY(-16px)}.world-circuit-map{width:120%;margin-left:-10%;margin-top:10px}}`}</style>
    </main>
  );
}
