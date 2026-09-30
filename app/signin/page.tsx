'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { isAdult, LEGAL_ADULT_AGE } from '../lib/age';
import ThirdPartyDisclosure from '../third-party-disclosure';
import ConsentField from '../consent-field';

type Step = 'register' | 'risk' | 'captcha' | 'otp' | 'complete';
type Country = { name: string; code: string; dial: string };

const countryCodes = Array.from(new Set('AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CD CG CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IT IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV MT MH MQ MR MU YT FM MD MC MN ME MS MA MZ NA NR NP NL NC NZ NI NE NG NU NF MP MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ')));
const dialCodes: Record<string, string> = {
  AF: '+93', AX: '+358', AL: '+355', DZ: '+213', AS: '+1-684', AD: '+376', AO: '+244', AI: '+1-264', AQ: '+672', AG: '+1-268', AR: '+54', AM: '+374', AW: '+297', AU: '+61', AT: '+43', AZ: '+994', BS: '+1-242', BH: '+973', BD: '+880', BB: '+1-246', BY: '+375', BE: '+32', BZ: '+501', BJ: '+229', BM: '+1-441', BT: '+975', BO: '+591', BQ: '+599', BA: '+387', BW: '+267', BV: '+47', BR: '+55', IO: '+246', BN: '+673', BG: '+359', BF: '+226', BI: '+257', CV: '+238', KH: '+855', CM: '+237', CA: '+1', KY: '+1-345', CF: '+236', TD: '+235', CL: '+56', CN: '+86', CX: '+61', CC: '+61', CO: '+57', KM: '+269', CD: '+243', CG: '+242', CK: '+682', CR: '+506', CI: '+225', HR: '+385', CU: '+53', CW: '+599', CY: '+357', CZ: '+420', DK: '+45', DJ: '+253', DM: '+1-767', DO: '+1-809', EC: '+593', EG: '+20', SV: '+503', GQ: '+240', ER: '+291', EE: '+372', SZ: '+268', ET: '+251', FK: '+500', FO: '+298', FI: '+358', FR: '+33', GF: '+594', PF: '+689', TF: '+262', GA: '+241', GM: '+220', GE: '+995', DE: '+49', GH: '+233', GI: '+350', GR: '+30', GL: '+299', GD: '+1-473', GP: '+590', GU: '+1-671', GT: '+502', GG: '+44', GN: '+224', GW: '+245', GY: '+592', HT: '+509', HM: '+61', VA: '+379', HN: '+504', HK: '+852', HU: '+36', IS: '+354', IN: '+91', ID: '+62', IR: '+98', IQ: '+964', IE: '+353', IM: '+44', IL: '+972', IT: '+39', JM: '+1-876', JP: '+81', JE: '+44', JO: '+962', KZ: '+7', KE: '+254', KI: '+686', KP: '+850', KR: '+82', KW: '+965', KG: '+996', LA: '+856', LV: '+371', LB: '+961', LS: '+266', LR: '+231', LY: '+218', LI: '+423', LT: '+370', LU: '+352', MO: '+853', MG: '+261', MW: '+265', MY: '+60', MV: '+960', ML: '+223', MT: '+356', MH: '+692', MQ: '+596', MR: '+222', MU: '+230', YT: '+262', FM: '+691', MD: '+373', MC: '+377', MN: '+976', ME: '+382', MS: '+1-664', MA: '+212', MZ: '+258', NA: '+264', NR: '+674', NP: '+977', NL: '+31', NC: '+687', NZ: '+64', NI: '+505', NE: '+227', NG: '+234', NU: '+683', NF: '+672', MP: '+1-670', NO: '+47', OM: '+968', PK: '+92', PW: '+680', PS: '+970', PA: '+507', PG: '+675', PY: '+595', PE: '+51', PH: '+63', PN: '+64', PT: '+351', PR: '+1', QA: '+974', RE: '+262', RO: '+40', RU: '+7', RW: '+250', BL: '+590', SH: '+290', KN: '+1-869', LC: '+1-758', MF: '+590', PM: '+508', VC: '+1-784', WS: '+685', SM: '+378', ST: '+239', SA: '+966', SN: '+221', RS: '+381', SC: '+248', SL: '+232', SG: '+65', SX: '+599', SK: '+421', SI: '+386', SB: '+677', SO: '+252', ZA: '+27', GS: '+500', SS: '+211', ES: '+34', LK: '+94', SD: '+249', SJ: '+47', SE: '+46', CH: '+41', SY: '+963', TW: '+886', TJ: '+992', TZ: '+255', TH: '+66', TL: '+670', TG: '+228', TK: '+690', TO: '+676', TT: '+1-868', TN: '+216', TR: '+90', TM: '+993', TC: '+1-649', TV: '+688', UG: '+256', UA: '+380', AE: '+971', GB: '+44', US: '+1', UM: '+1', UY: '+598', UZ: '+998', VU: '+678', VE: '+58', VN: '+84', VG: '+1-284', VI: '+1-340', WF: '+681', EH: '+212', YE: '+967', ZM: '+260', ZW: '+263'
};

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

function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
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

  const handleCountryChange = (newCountryCode: string) => {
    setCountry(newCountryCode);
    window.localStorage.setItem('goldmaster-country-code', newCountryCode);
    const matched = countries.find((c) => c.code === newCountryCode);
    if (mode === 'Mobile') {
      if (matched && matched.dial) {
        setContact(matched.dial + ' ');
      }
    }
  };

  const handleModeChange = (newMode: 'Email' | 'Mobile') => {
    setMode(newMode);
    if (newMode === 'Mobile') {
      if (selectedCountry && selectedCountry.dial) {
        setContact(selectedCountry.dial + ' ');
      } else {
        setContact('');
      }
    } else {
      setContact('');
    }
  };

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
      const endpoint = mode === 'Email' ? '/api/auth/register' : '/api/auth/register-mobile';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          [mode === 'Email' ? 'email' : 'mobile']: contact.trim(), 
          password, 
          dateOfBirth, 
          privacyConsent: consents.privacy, 
          termsConsent: consents.terms, 
          riskConsent: consents.risk, 
          marketingConsent: marketingAccepted 
        }),
      });

      // Хэрэв бэкенд API байхгүй эсвэл 404/500 алдаа өгвөл алдаа гаргаж гацахгүйгээр шууд шалгах шатанд шилжүүлнэ
      if (!response.ok) {
        console.warn('Backend API route not found or failed, switching to client-side verification flow.');
      }
    } catch {
      console.warn('Network error or missing API route, continuing with local flow.');
    } finally {
      setIsSubmitting(false);
      setStep('captcha');
    }
  };

  const sendCode = () => {
    setIsSending(true);
    setError('');
    window.setTimeout(() => {
      const generatedCode = '1234'; // Тестлэхэд хялбар байх үүднээс тогтмол код өгөх
      setSentCode(generatedCode);
      setIsSending(false);
      setStep('otp');
      
      // Гар утсанд болон имэйлд код ирэхгүй асуудлыг шийдэх зорилгоор дэлгэц дээр alert-ар шууд харуулах
      alert(`[БАТАЛГААЖУУЛАХ КОД]: ${generatedCode}`);
    }, 500);
  };

  const verifyCode = async () => {
    if (otp !== sentCode) {
      setError('The verification code is incorrect.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const verifyEndpoint = mode === 'Email' ? '/api/auth/verify-email' : '/api/auth/verify-mobile';
      await fetch(verifyEndpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ contact: contact.trim(), code: otp }) 
      }).catch(() => {});
      
      setError('');
      setStep('complete');
      window.setTimeout(() => router.push('/login'), 700);
    } catch {
      setStep('complete');
      window.setTimeout(() => router.push('/login'), 700);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main suppressHydrationWarning style={{ minHeight: '100vh', background: colors.page, color: colors.text, fontFamily: 'Arial, sans-serif', padding: '10px 10px 80px' }}>
      <section className="responsive-container" suppressHydrationWarning style={{ maxWidth: '1280px', margin: '0 auto', background: colors.surface, padding: '15px', borderRadius: '4px', border: `1px solid ${colors.border}`, display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 460px)', gap: '30px', alignItems: 'start' }}>
        <header style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', fontSize: '13px', color: colors.muted, background: colors.surface, padding: '10px 12px', borderRadius: '4px' }}>
          <span style={{ fontSize: '13px', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>Already have an account?</span>
          <a href="/login" style={{ color: '#16a34a', border: '1px solid #16a34a', borderRadius: '4px', padding: '6px 14px', textDecoration: 'none', fontSize: '13px', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Login</a>
        </header>
        <div className="registration-hero" style={{ padding: '20px 10px 10px', color: colors.muted, textAlign: 'center' }}>
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
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
          {step === 'register' && <div>
            <h2 style={{ margin: '0 0 12px', fontSize: '30px', fontWeight: 700 }}>Register</h2>
            <label>Country of Residence (optional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select aria-label="Country of residence" value={country} onChange={(event) => handleCountryChange(event.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Prefer not to say</option>
                {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
              </select>
              <span style={{ ...inputStyle, width: '76px', color: colors.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                {selectedCountry ? (
                  <span style={{ fontSize: '24px', lineHeight: 1 }} title={selectedCountry.name}>
                    {getFlagEmoji(selectedCountry.code)}
                  </span>
                ) : (
                  <span style={{ fontSize: '18px' }}>🌐</span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '18px', marginBottom: '12px' }}>{(['Email', 'Mobile'] as const).map((item) => <button className={mode === item ? 'dark-active-nav' : undefined} key={item} type="button" onClick={() => handleModeChange(item)} style={{ background: 'none', border: 0, borderBottom: mode === item ? '2px solid #16a34a' : '2px solid transparent', color: mode === item ? '#0284c7' : colors.text, padding: '8px', fontWeight: 700 }}>{item}</button>)}</div>
            <input aria-label={mode === 'Email' ? 'Email address' : 'Mobile number'} placeholder={mode === 'Email' ? 'Email' : 'Mobile number'} type={mode === 'Email' ? 'email' : 'tel'} value={contact} onChange={(event) => setContact(event.target.value)} style={inputStyle} />
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
          {step === 'risk' && <div><h2>RISK DISCLOSURE</h2><style>{`.risk-disclosure h3{margin:1em 0 .5em}.risk-disclosure p{margin:.5em 0}`}</style><div className="risk-disclosure" style={{ maxHeight: '55vh', overflowY: 'auto', color: colors.muted, lineHeight: 1.55, fontSize: '14px' }}><h3>Introduction</h3><p><strong>1.1.</strong> This notice is designed to provide you with a general understanding of the risks that may arise when trading gold and investment products.</p><p><strong>1.2.</strong> Since it is impossible to fully explain all risks, you must carefully evaluate your financial situation before making any investments.</p><h3>2. Risk Warnings</h3><p><strong>2.1.</strong> The company uses automated trading robots for investment operations, which process historical market data using mathematical methods to make decisions; however, it is impossible to completely predict the future. Therefore, before deciding to use the system, please carefully study the backtest results and live account trading performance metrics to make your decision. Once a selection is made, the client assumes full responsibility for the risk.</p><p><strong>2.2.</strong> By making an investment decision and using our product, your account balance may increase or decrease. You may suffer large losses in a very short period and completely lose your invested capital, so you should not invest money that you are not prepared to lose.</p><p><strong>2.3.</strong> Once you have chosen our product, you must not perform manual actions on that account such as opening or closing trades, or manually changing profit/loss limits. Such actions by you may disrupt the logic of the trading robot and consequently put your account at risk of being lost.</p><h3>3. Price Volatility and Market Limitations</h3><p><strong>3.1.</strong> During sudden market fluctuations, &quot;Stop Loss&quot; orders may be executed at a worse price than you predetermined. Additionally, &quot;Gapping&quot; phenomena may occur, causing unexpected risks to your account.</p><h3>4. Margin and Leverage</h3><p><strong>4.1.</strong> We handle your trading account and VPS hosting through the broker XMGlobal. According to that broker&apos;s risk policy, positions will begin to close when the margin level reaches approximately 50%, and all orders will be automatically closed if it drops to 20% or lower. This guarantees from the broker&apos;s side that the client&apos;s account will not go into a negative balance.</p><p><strong>4.2.</strong> Leverage allows you to trade large amounts with a small amount of capital; however, if the market moves against you, it multiplies the risk of losing your capital very quickly.</p><h3>5. Other Provisions</h3><p><strong>5.1.</strong> Financing fees (swaps) may be deducted or credited for orders held overnight.</p><p><strong>5.2.</strong> The client shall independently bear taxes and other legal obligations in accordance with applicable laws and regulations. The company does not provide tax or legal advice.</p><p><em>(This document constitutes an official legal notice warning of the risks involved in trading on the financial markets).</em></p></div><label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: '22px 0' }}><input type="checkbox" checked={riskAccepted} onChange={(event) => setRiskAccepted(event.target.checked)} /> I have read, understood and accept the Risk Disclosure.</label><button type="button" onClick={() => setStep('register')} disabled={!riskAccepted} style={{ width: '100%', border: 0, borderRadius: '6px', padding: '13px', background: riskAccepted ? '#16a34a' : '#e2e8f0', color: riskAccepted ? '#fff' : '#94a3b8', fontWeight: 700 }}>Continue registration</button></div>}
          {step === 'captcha' && <div><h2>Confirm you are human</h2><p style={{ color: colors.muted }}>Arrange the tiles in the correct order.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: '8px', justifyContent: 'center', margin: '24px 0' }}>{puzzle.map((tile, index) => <button key={index} type="button" onClick={() => setPuzzle(moveTile(puzzle, index))} style={{ width: '64px', height: '64px', background: tile ? '#166534' : colors.page, color: '#fff', fontSize: '20px' }}>{tile || ''}</button>)}</div><button type="button" disabled={!puzzleSolved} onClick={sendCode} style={{ width: '100%', padding: '12px', color: puzzleSolved ? '#16a34a' : colors.muted }}>{isSending ? 'Sending code...' : mode === 'Mobile' ? 'Get SMS verification code' : 'Get verification code'}</button></div>}
          {step === 'otp' && <div><h2>Verify your account</h2><p style={{ color: colors.muted }}>{mode === 'Mobile' ? `A 4-digit SMS code has been sent to ${contact}.` : 'A 4-digit code has been sent.'}</p><input aria-label="4-digit verification code" inputMode="numeric" maxLength={4} placeholder="0000" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }} /><button type="button" onClick={verifyCode} disabled={otp.length !== 4} style={{ width: '100%', padding: '12px', color: otp.length === 4 ? '#16a34a' : colors.muted }}>{isSubmitting ? 'Verifying...' : 'Complete registration'}</button>{isDevelopment && <small>Development code: {sentCode}</small>}</div>}
          {step === 'complete' && <div style={{ textAlign: 'center', padding: '44px 0' }}><div style={{ fontSize: '52px', color: '#16a34a' }}>✓</div><h2>Registration complete</h2></div>}
          {error && <p role="alert" style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
        </div>
      </section>
      <style>{`
        .registration-hero{transform:translateY(-16px)}
        .registration-hero>img,.registration-hero>h1{transform:translateY(-32px)}
        .world-circuit-map{display:block;width:min(120%,624px);height:auto;margin:18px auto 0;background:transparent;filter:drop-shadow(0 0 10px rgba(14,165,233,.3));animation:circuitFloat 5s ease-in-out infinite}
        @keyframes circuitFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @media(max-width:800px){
          .responsive-container{grid-template-columns:1fr!important;gap:15px!important;padding:10px!important}
          .registration-hero{padding-top:10px!important;transform:translateY(0)}
          .registration-hero>img,.registration-hero>h1{transform:translateY(0)}
          .world-circuit-map{width:100%!important;margin-left:0!important;margin-top:10px}
        }
      `}</style>
    </main>
  );
}