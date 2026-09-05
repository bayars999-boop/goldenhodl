'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';

type Tab = 'Overview' | 'Copy trading' | 'EA rental' | 'Products' | 'Activity' | 'Account';

const tabs: Tab[] = ['Overview', 'Copy trading', 'EA rental', 'Products', 'Activity', 'Account'];

export default function UserDashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [contact, setContact] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [liveProfit, setLiveProfit] = useState(421.65);
  const [profile, setProfile] = useState({ fullName: '', phone: '', country: '', timezone: 'Asia/Ulaanbaatar' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);

  useEffect(() => {
    const saved = window.localStorage.getItem('goldmaster-user-contact');
    if (!saved) {
      router.replace('/login');
      return;
    }
    setContact(saved);
    const savedProfile = window.localStorage.getItem('goldmaster-profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed && typeof parsed === 'object') setProfile((current) => ({ ...current, ...parsed }));
      } catch {
        window.localStorage.removeItem('goldmaster-profile');
      }
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastUpdated(new Date());
      setLiveProfit((value) => Number((value + (Math.random() - 0.45) * 1.8).toFixed(2)));
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const colors = useMemo(() => dark
    ? { page: '#0b1220', surface: '#162033', surfaceAlt: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#334155', blue: '#38bdf8' }
    : { page: '#f8fafc', surface: '#ffffff', surfaceAlt: '#f1f5f9', text: '#1e293b', muted: '#475569', border: '#e2e8f0', blue: '#0284c7' }, [dark]);

  const logout = () => {
    window.localStorage.removeItem('goldmaster-user-contact');
    router.push('/login');
  };
  const saveProfile = () => {
    window.localStorage.setItem('goldmaster-profile', JSON.stringify(profile));
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2500);
  };

  const card = { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '18px' };
  const button = (active = false) => ({ border: `1px solid ${active ? colors.blue : colors.border}`, background: active ? colors.blue : colors.surface, color: active ? '#fff' : colors.text, borderRadius: '6px', padding: '9px 13px', cursor: 'pointer', fontWeight: 600 as const });

  return (
    <main style={{ minHeight: '100vh', background: colors.page, color: colors.text, padding: '62px 20px 40px', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '22px', flexWrap: 'wrap' }}>
          <div><p style={{ margin: 0, color: colors.blue, fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>GOLDMASTER MEMBER AREA</p><h1 style={{ margin: '6px 0', fontSize: '30px' }}>Welcome back</h1><p style={{ margin: 0, color: colors.muted }}>{contact || 'Loading account...'} · Last synced {lastUpdated.toLocaleTimeString()}</p></div>
          <div style={{ display: 'flex', gap: '8px' }}><button type="button" onClick={() => router.push('/')} style={button()}>Public signal</button><button type="button" onClick={logout} style={button()}>Log out</button></div>
        </header>

        <nav style={{ display: 'flex', gap: '7px', overflowX: 'auto', marginBottom: '18px', paddingBottom: '3px' }}>{tabs.map((tab) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} style={button(activeTab === tab)}>{tab}</button>)}</nav>

        {activeTab === 'Overview' && <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '14px' }}>
            {[['Portfolio value', '$4,921.65', colors.blue], ['Net profit', `+$${liveProfit.toFixed(2)}`, '#16a34a'], ['Return', '+9.37%', '#16a34a'], ['Risk score', 'Low · 4.2%', '#f59e0b']].map(([label, value, accent]) => <div key={label} style={card}><span style={{ color: colors.muted, fontSize: '13px' }}>{label}</span><strong style={{ display: 'block', marginTop: '12px', fontSize: '25px', color: accent }}>{value}</strong><small style={{ color: colors.muted }}>Updated automatically</small></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
            <section style={card}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><h2 style={{ margin: 0, fontSize: '18px' }}>Performance</h2><p style={{ margin: '6px 0 18px', color: colors.muted }}>Account growth since your first trade</p></div><span style={{ color: '#16a34a', fontWeight: 700 }}>LIVE</span></div><svg viewBox="0 0 700 210" style={{ width: '100%', height: '210px', background: colors.surfaceAlt, borderRadius: '6px' }}><path d="M30 178 C110 168 130 150 190 158 S270 120 330 132 S410 92 470 108 S570 55 670 65" fill="none" stroke="#16a34a" strokeWidth="4" /><path d="M30 178 C110 168 130 150 190 158 S270 120 330 132 S410 92 470 108 S570 55 670 65 L670 190 L30 190 Z" fill="#16a34a" opacity=".12" /><line x1="30" y1="190" x2="670" y2="190" stroke={colors.border} /></svg></section>
            <section style={card}><h2 style={{ margin: 0, fontSize: '18px' }}>Account allocation</h2><p style={{ color: colors.muted, margin: '6px 0 20px' }}>Where your capital is working</p>{[['Copy trading', '55%', '#0284c7'], ['EA rental', '30%', '#16a34a'], ['Available cash', '15%', '#f59e0b']].map(([name, percent, accent]) => <div key={name} style={{ marginBottom: '18px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}><span>{name}</span><strong>{percent}</strong></div><div style={{ height: '8px', background: colors.surfaceAlt, borderRadius: '8px' }}><div style={{ width: percent, height: '100%', background: accent, borderRadius: '8px' }} /></div></div>)}</section>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}><section style={card}><h2 style={{ margin: 0, fontSize: '18px' }}>Active services</h2><p style={{ color: colors.muted }}>Your current products and subscriptions</p><div style={{ display: 'grid', gap: '10px' }}>{[['GoldMaster Pro EA', 'Rental · Active', '#16a34a'], ['Conservative Copy Strategy', 'Copy trade · Active', '#16a34a']].map(([name, status, accent]) => <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: colors.surfaceAlt, borderRadius: '6px' }}><span>{name}<small style={{ display: 'block', color: colors.muted, marginTop: '4px' }}>{status}</small></span><strong style={{ color: accent }}>●</strong></div>)}</div></section><section style={card}><h2 style={{ margin: 0, fontSize: '18px' }}>Recent activity</h2><p style={{ color: colors.muted }}>Latest account events</p>{['Profit credited · +$18.40', 'Copy strategy allocation updated', 'EA rental renewed · 30 days'].map((event, index) => <div key={event} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: index < 2 ? `1px solid ${colors.border}` : 'none' }}><span>{event}</span><small style={{ color: colors.muted }}>{index + 1}h ago</small></div>)}</section></div>
        </div>}

        {activeTab === 'Account' && <section style={{ display: 'grid', gap: '14px' }}>
          <section style={card}><h2 style={{ margin: 0 }}>Profile</h2><p style={{ color: colors.muted }}>Keep your personal and contact details current. Sensitive identity documents must be stored and verified by a secure backend.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>{[['Full legal name', 'fullName', 'Your name as shown on ID'], ['Phone number', 'phone', '+976...'], ['Country / region', 'country', 'Mongolia']].map(([label, key, placeholder]) => <label key={key} style={{ color: colors.muted, fontSize: '13px' }}>{label}<input value={profile[key as keyof typeof profile]} placeholder={placeholder} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '5px', background: colors.surfaceAlt, color: colors.text }} /></label>)}<label style={{ color: colors.muted, fontSize: '13px' }}>Email<input value={contact} readOnly style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '5px', background: colors.surfaceAlt, color: colors.muted }} /></label></div><button type="button" onClick={saveProfile} style={{ ...button(true), marginTop: '14px' }}>{profileSaved ? 'Saved securely' : 'Save profile'}</button></section>
          <section style={card}><h2 style={{ margin: 0 }}>Verification / KYC</h2><p style={{ color: colors.muted }}>Complete identity, contact, and suitability checks before withdrawals or regulated services are enabled.</p>{[['Contact verification', 'Email or mobile OTP', true], ['Identity verification', 'Government ID and liveness check', verificationStep >= 2], ['Address verification', 'Proof of address', verificationStep >= 3], ['Suitability review', 'Risk questionnaire and terms', verificationStep >= 4]].map(([label, detail, done], index) => <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}><strong style={{ color: done ? '#16a34a' : colors.muted }}>{done ? '✓' : index + 1}</strong><div style={{ flex: 1 }}><b>{label}</b><small style={{ display: 'block', color: colors.muted, marginTop: '3px' }}>{detail}</small></div>{!done && index === verificationStep - 1 && <button type="button" onClick={() => setVerificationStep((step) => Math.min(4, step + 1))} style={button(true)}>Continue</button>}</div>)}</section>
          <section style={card}><h2 style={{ margin: 0 }}>Security</h2><p style={{ color: colors.muted }}>Use strong authentication and review sessions regularly. Passwords and MFA secrets are never stored in this browser.</p><div style={{ display: 'grid', gap: '10px' }}><div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px', background: colors.surfaceAlt, borderRadius: '6px' }}><span><b>Multi-factor authentication</b><small style={{ display: 'block', color: colors.muted }}>Authenticator app or passkey recommended</small></span><button type="button" onClick={() => setMfaEnabled(!mfaEnabled)} style={button(mfaEnabled)}>{mfaEnabled ? 'Enabled' : 'Enable MFA'}</button></div><div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px', background: colors.surfaceAlt, borderRadius: '6px' }}><span><b>Active sessions</b><small style={{ display: 'block', color: colors.muted }}>Review and revoke unknown devices</small></span><button type="button" onClick={() => setLastUpdated(new Date())} style={button()}>Review sessions</button></div><div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px', background: colors.surfaceAlt, borderRadius: '6px' }}><span><b>Account recovery</b><small style={{ display: 'block', color: colors.muted }}>Verified email and phone recovery channels</small></span><span style={{ color: '#16a34a', fontWeight: 700 }}>Protected</span></div></div></section>
        </section>}
        {activeTab !== 'Overview' && activeTab !== 'Account' && <section style={card}><h2 style={{ marginTop: 0 }}>{activeTab}</h2><p style={{ color: colors.muted }}>Manage your {activeTab.toLowerCase()} and review its complete history.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>{(activeTab === 'Activity' ? [['Total events', '128'], ['Deposits', '$5,000'], ['Withdrawals', '$0']] : [['Status', 'Active'], ['Monthly result', '+9.37%'], ['Next update', 'Live']]).map(([label, value]) => <div key={label} style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '16px' }}><small style={{ color: colors.muted }}>{label}</small><strong style={{ display: 'block', marginTop: '9px' }}>{value}</strong></div>)}</div><button type="button" style={{ ...button(true), marginTop: '20px' }} onClick={() => setLastUpdated(new Date())}>Refresh data</button></section>}
      </section>
    </main>
  );
}
