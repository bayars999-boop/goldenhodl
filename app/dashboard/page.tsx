'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { CountryFlag } from '../country-flag';

type Tab = 'Overview' | 'Copy trading' | 'EA rental' | 'Products' | 'Activity' | 'Account';

const tabs: Tab[] = ['Overview', 'Copy trading', 'EA rental', 'Products', 'Activity', 'Account'];
type ServiceKind = 'Copy trading' | 'EA rental';
type ServiceProduct = { name: string; description: string };
type ProductSetup = { kind: ServiceKind; balance: string; duration: string; agreed: boolean };
type ProductRecord = { id: string; kind: ServiceKind; name: string; balance: number; startedAt: string; expiresAt: string; dailyBalance: number; profitLoss: number; history?: Array<{ instrument: string; result: number; date: string }>; statistics?: string; risk?: string };
const serviceProducts: Record<ServiceKind, ServiceProduct[]> = {
  'Copy trading': [{ name: 'Conservative Copy Strategy', description: 'Automatically mirror a diversified strategy with controlled exposure and transparent performance tracking.' }],
  'EA rental': [{ name: 'GoldMaster Pro EA', description: 'Rent the GoldMaster automated advisor with VPS execution and monitored gold-trading performance.' }],
};
const demoSelectedServices: Partial<Record<ServiceKind, string>> = {
  'Copy trading': 'Conservative Copy Strategy',
  'EA rental': 'GoldMaster Pro EA',
};
const demoServiceData = {
  'Copy trading': { balance: 2500, duration: '3 months', activatedAt: '2026-09-01', history: [{ instrument: 'XAUUSD', result: 42.5, date: '2026-09-05' }], statistics: 'Demo data · 1 recorded trade', risk: 'Moderate · Demo data' },
  'EA rental': { balance: 1800, duration: '3 months', activatedAt: '2026-09-01', history: [{ instrument: 'XAUUSD', result: 31.2, date: '2026-09-04' }], statistics: 'Demo data · 1 recorded trade', risk: 'Controlled · Demo data' },
};
const demoProductRecords: ProductRecord[] = [
  { id: 'A7K2P', kind: 'Copy trading', name: 'Conservative Copy Strategy', balance: 2500, startedAt: '2026-09-01', expiresAt: '2026-12-01', dailyBalance: 2542.5, profitLoss: 42.5, history: [{ instrument: 'XAUUSD', result: 42.5, date: '2026-09-05' }], statistics: 'Demo data · 1 recorded trade', risk: 'Moderate · Demo data' },
  { id: 'Q4M3L', kind: 'EA rental', name: 'GoldMaster Pro EA', balance: 1800, startedAt: '2026-09-01', expiresAt: '2026-12-01', dailyBalance: 1831.2, profitLoss: 31.2, history: [{ instrument: 'XAUUSD', result: 31.2, date: '2026-09-04' }], statistics: 'Demo data · 1 recorded trade', risk: 'Controlled · Demo data' },
];

const generateProductCode = (usedCodes: Iterable<string>) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const used = new Set(usedCodes);
  let candidate = '';
  do {
    candidate = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (used.has(candidate));
  return candidate;
};

const formatMoney = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export default function UserDashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [contact, setContact] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [profile, setProfile] = useState({ fullName: '', phone: '', country: '', timezone: 'Asia/Ulaanbaatar' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Partial<Record<ServiceKind, string>>>({});
  const [serviceSection, setServiceSection] = useState<'Balance' | 'History' | 'Statistics' | 'Risks'>('Balance');
  const [serviceData, setServiceData] = useState<Partial<Record<ServiceKind, { balance?: number; duration?: string; activatedAt?: string; history?: Array<{ instrument: string; result: number; date: string }>; statistics?: string; risk?: string }>>>({});
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [selectedCopyRecordId, setSelectedCopyRecordId] = useState<string | null>(null);
  const [selectedEaRecordId, setSelectedEaRecordId] = useState<string | null>(null);
  const [productSetup, setProductSetup] = useState<ProductSetup | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activationMessage, setActivationMessage] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('goldmaster-user-contact');
    if (!saved) {
      router.replace('/login');
      return;
    }
    setContact(saved);
    const savedServiceData = window.localStorage.getItem('goldmaster-user-service-data');
    if (savedServiceData) {
      try {
        const parsed = JSON.parse(savedServiceData);
        if (parsed && typeof parsed === 'object') setServiceData(parsed);
      } catch {
        window.localStorage.removeItem('goldmaster-user-service-data');
      }
    } else {
      setServiceData(demoServiceData);
    }
    const savedProductRecords = window.localStorage.getItem('goldmaster-product-records');
    if (savedProductRecords) {
      try {
        const parsed = JSON.parse(savedProductRecords);
        if (Array.isArray(parsed)) setProductRecords(parsed);
      } catch {
        window.localStorage.removeItem('goldmaster-product-records');
      }
    } else {
      setProductRecords(demoProductRecords);
    }
    const savedServices = window.localStorage.getItem('goldmaster-selected-services');
    if (savedServices) {
      try {
        const parsed = JSON.parse(savedServices);
        if (parsed && typeof parsed === 'object') setSelectedServices(parsed as Partial<Record<ServiceKind, string>>);
      } catch {
        window.localStorage.removeItem('goldmaster-selected-services');
      }
    } else {
      setSelectedServices(demoSelectedServices);
    }
    const savedProfile = window.localStorage.getItem('goldmaster-profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed && typeof parsed === 'object') {
          const value = parsed as { country?: string; countryCode?: string };
          const codes: Record<string, string> = { Mongolia: 'MN', 'United States': 'US', Germany: 'DE', Japan: 'JP', Brazil: 'BR', 'South Africa': 'ZA' };
          setProfile((current) => ({ ...current, ...parsed, countryCode: value.countryCode || (value.country ? codes[value.country] : 'MN') || 'MN' }));
        }
      } catch {
        window.localStorage.removeItem('goldmaster-profile');
      }
    }
  }, [router]);

  useEffect(() => {
    setLastUpdated(new Date());
    const timer = window.setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (productRecords.length || !Object.values(selectedServices).some(Boolean)) return;
    const records = (Object.keys(serviceProducts) as ServiceKind[]).filter((kind) => selectedServices[kind]).map((kind) => {
      const data = serviceData[kind];
      const startedAt = data?.activatedAt || new Date().toISOString().slice(0, 10);
      const duration = data?.duration || '1 month';
      const expiry = new Date(startedAt);
      expiry.setMonth(expiry.getMonth() + (duration === '12 months' ? 12 : duration === '6 months' ? 6 : duration === '3 months' ? 3 : 1));
      const profitLoss = data?.history?.reduce((sum, item) => sum + item.result, 0) || 0;
      return { id: generateProductCode(productRecords.map((item) => item.id)), kind, name: selectedServices[kind] || serviceProducts[kind][0].name, balance: data?.balance || 0, startedAt, expiresAt: expiry.toISOString().slice(0, 10), dailyBalance: (data?.balance || 0) + profitLoss, profitLoss };
    });
    setProductRecords(records);
  }, [productRecords.length, selectedServices, serviceData]);

  const colors = useMemo(() => dark
    ? { page: '#0b1220', surface: '#162033', surfaceAlt: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#334155', blue: '#38bdf8' }
    : { page: '#f8fafc', surface: '#ffffff', surfaceAlt: '#f1f5f9', text: '#1e293b', muted: '#475569', border: '#e2e8f0', blue: '#0284c7' }, [dark]);

  const logout = () => {
    window.localStorage.removeItem('goldmaster-user-contact');
    router.push('/login');
  };
  const saveProfile = () => {
    window.localStorage.setItem('goldmaster-profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('goldmaster-profile-updated'));
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2500);
  };
  const selectService = (kind: ServiceKind, product: ServiceProduct) => {
    const next = { ...selectedServices, [kind]: product.name };
    setSelectedServices(next);
    window.localStorage.setItem('goldmaster-selected-services', JSON.stringify(next));
    setLastUpdated(new Date());
  };
  const beginProductSetup = (kind: ServiceKind) => {
    setProductSetup({ kind, balance: '', duration: '', agreed: false });
    setPaymentOpen(false);
    setActivationMessage('');
  };
  const openPayment = () => {
    if (!productSetup || !productSetup.balance || Number(productSetup.balance) < (productSetup.kind === 'EA rental' ? 1000 : 500) || !productSetup.duration || (productSetup.kind === 'EA rental' && !productSetup.agreed)) return;
    setPaymentOpen(true);
  };
  const completePayment = () => {
    if (!productSetup) return;
    const product = serviceProducts[productSetup.kind][0];
    const nextServices = { ...selectedServices, [productSetup.kind]: product.name };
    const nextData = { ...serviceData, [productSetup.kind]: { balance: Number(productSetup.balance), duration: productSetup.duration, activatedAt: new Date().toISOString().slice(0, 10), history: [], statistics: 'Account activated; awaiting user trades', risk: 'Pending first trade' } };
    const startedAt = new Date();
    const months = productSetup.duration === '12 months' ? 12 : productSetup.duration === '6 months' ? 6 : productSetup.duration === '3 months' ? 3 : 1;
    const expiresAt = new Date(startedAt);
    expiresAt.setMonth(expiresAt.getMonth() + months);
    const nextRecords = [...productRecords, { id: generateProductCode(productRecords.map((item) => item.id)), kind: productSetup.kind, name: product.name, balance: Number(productSetup.balance), startedAt: startedAt.toISOString().slice(0, 10), expiresAt: expiresAt.toISOString().slice(0, 10), dailyBalance: Number(productSetup.balance), profitLoss: 0 }];
    setSelectedServices(nextServices);
    setServiceData(nextData);
    setProductRecords(nextRecords);
    window.localStorage.setItem('goldmaster-selected-services', JSON.stringify(nextServices));
    window.localStorage.setItem('goldmaster-user-service-data', JSON.stringify(nextData));
    window.localStorage.setItem('goldmaster-product-records', JSON.stringify(nextRecords));
    setProductSetup(null);
    setPaymentOpen(false);
    setActivationMessage(`${productSetup.kind} setup submitted. Broker account provisioning is pending confirmation.`);
    setLastUpdated(new Date());
  };
  const getProductFee = (setup: ProductSetup) => {
    const balance = Number(setup.balance);
    if (setup.kind === 'Copy trading') {
      const rate = setup.duration === '30 days' ? 0.03 : setup.duration === '3 months' ? 0.08 : setup.duration === '6 months' ? 0.15 : 0.29;
      return balance * rate;
    }
    return setup.duration === '12 months' ? 120 : setup.duration === '6 months' ? 65 : setup.duration === '3 months' ? 39 : 15;
  };
  const setupReady = productSetup !== null && Number.isFinite(Number(productSetup.balance)) && Number(productSetup.balance) >= (productSetup.kind === 'EA rental' ? 1000 : 500) && Boolean(productSetup.duration) && (productSetup.kind !== 'EA rental' || productSetup.agreed);
  const getProfitSplit = (balance: number, duration: string) => {
    const column = balance <= 5000 ? 0 : balance <= 50000 ? 1 : 2;
    const rows: Record<string, string[][]> = {
      '30 days': [['45% : 55%', '50% : 50%', '55% : 45%']],
      '3 months': [['46% : 54%', '51% : 49%', '56% : 44%']],
      '6 months': [['48% : 52%', '53% : 47%', '58% : 42%']],
      '12 months': [['50% : 50%', '55% : 45%', '60% : 40%']],
    };
    return rows[duration]?.[0][column] || '—';
  };
  const getServiceStatus = (kind: ServiceKind) => {
    const data = serviceData[kind];
    if (!selectedServices[kind]) return 'Not selected';
    if (!data?.activatedAt || !data.duration) return 'Pending activation';
    const months = data.duration === '12 months' ? 12 : data.duration === '6 months' ? 6 : data.duration === '3 months' ? 3 : 1;
    const expiry = new Date(data.activatedAt);
    expiry.setMonth(expiry.getMonth() + months);
    return expiry.getTime() > Date.now() ? `Active until ${expiry.toLocaleDateString()}` : 'Expired';
  };
  const getProfitSplitParts = (balance: number, duration: string) => {
    const split = getProfitSplit(balance, duration).split(':').map((part) => part.trim());
    return { client: split[0] || '—', owner: split[1] || '—' };
  };
  const renderEAAgreement = () => <div style={{ margin: '16px 0 20px', display: 'grid', gap: '12px', lineHeight: 1.6 }}>
    <h3 style={{ margin: 0 }}>EXPERT ADVISOR (EA) RENTAL AGREEMENT</h3>
    {productSetup && Number(productSetup.balance) < 1000 && <p style={{ margin: 0, color: '#dc2626', fontWeight: 700 }}>Warning: Minimum balance must start at $1000.</p>}
    <p style={{ margin: 0 }}>This agreement is concluded electronically between the Lessor on the one hand and the Lessee (Client) on the other hand, and defines the terms and conditions for renting and using the automated trading robot (Expert Advisor - EA) software.</p>
    <p style={{ margin: 0 }}><strong>1. General Terms</strong></p>
    <p style={{ margin: 0 }}>1.1. The Lessor shall provide the service of deploying and connecting a trading robot (EA) designed for the MetaTrader 5 (MT5) platform, featuring mathematical logic based on historical market data, to the Lessee's trading account.</p>
    <p style={{ margin: 0 }}>1.2. The Lessee has the right to use the respective robot solely on their own XM Global broker account, and transferring, copying, or decompiling it to third parties is strictly prohibited.</p>
    <p style={{ margin: 0 }}><strong>2. Payments and Duration</strong></p>
    <p style={{ margin: 0 }}>2.1. The rental duration and fee amount vary depending on the selected package (1 month, 3 months, 6 months, 12 months).</p>
    <p style={{ margin: 0 }}>2.2. Upon prepayment of the rental fee, the service and robot license will be activated for the respective period.</p>
    <p style={{ margin: 0 }}><strong>3. Rights, Obligations of the Parties, and Risk Disclosure</strong></p>
    <p style={{ margin: 0 }}>3.1. The Lessor never guarantees future profits or results of the market. Since the robot is based on historical data and algorithms, there is a risk of incurring losses during sudden market fluctuations.</p>
    <p style={{ margin: 0 }}>3.2. The Lessee is prohibited from manually opening or closing trades, or arbitrarily changing profit/loss limits (such as Stop Loss) on the account where the robot is operating. It must be noted that such actions may disrupt the robot's logic and put the account at risk.</p>
    <p style={{ margin: 0 }}>3.3. If the account balance and margin level violate broker requirements during the rental period (e.g., positions starting to close at a 50% margin level, automatic shutdown at 20%), the Lessee shall bear full responsibility for the resulting risks.</p>
    <p style={{ margin: 0 }}><strong>4. Other Provisions</strong></p>
    <p style={{ margin: 0 }}>4.1. This agreement shall be confirmed electronically and become effective from the date the payment is made.</p>
    <p style={{ margin: 0 }}>4.2. Financing fees (swaps) may be deducted for orders held overnight, and the Lessee shall fully bear their own tax and other relevant legal obligations.</p>
    <p style={{ margin: 0 }}><strong>Current profit split:</strong> {productSetup ? getProfitSplit(Number(productSetup.balance), productSetup.duration) : '—'}</p>
    <p style={{ margin: 0, color: colors.muted }}>Regarding the profit-sharing terms, the first figure of {productSetup ? getProfitSplitParts(Number(productSetup.balance), productSetup.duration).client : '—'} represents your return, while the second figure of {productSetup ? getProfitSplitParts(Number(productSetup.balance), productSetup.duration).owner : '—'} represents the return received by the robot owner.</p>
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse' }}><thead><tr>{['Time', '$1000-$5000', '$5001-$50000', 'More then $50000'].map((heading) => <th key={heading} style={{ padding: '10px', border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: 'left' }}>{heading}</th>)}</tr></thead><tbody>{[['30 days', '45% : 55%', '50% : 50%', '55% : 45%'], ['3 months', '46% : 54%', '51% : 49%', '56% : 44%'], ['6 months', '48% : 52%', '53% : 47%', '58% : 42%'], ['12 months', '50% : 50%', '55% : 45%', '60% : 40%']].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} style={{ padding: '10px', border: `1px solid ${colors.border}` }}>{cell}</td>)}</tr>)}</tbody></table></div>
  </div>;

  const card = { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '18px' };
  const userMetrics = Object.values(serviceData).filter((value) => value && value.balance !== undefined);
  const userBalance = userMetrics.length ? userMetrics.reduce((sum, value) => sum + (value?.balance || 0), 0) : undefined;
  const productSummary = productRecords.reduce((summary, record) => {
    summary.balance += record.balance;
    summary.profitLoss += record.profitLoss;
    summary.dailyBalance += record.dailyBalance;
    summary.trades += record.history?.length || 0;
    return summary;
  }, { balance: 0, profitLoss: 0, dailyBalance: 0, trades: 0 });
  const button = (active = false) => ({ border: `1px solid ${active ? colors.blue : colors.border}`, background: active ? colors.blue : colors.surface, color: active ? '#fff' : colors.text, borderRadius: '6px', padding: '9px 13px', cursor: 'pointer', fontWeight: 600 as const });
  const renderServiceWorkspace = (kind: ServiceKind) => {
    const product = serviceProducts[kind].find((item) => item.name === selectedServices[kind]);
    const accent = kind === 'Copy trading' ? colors.blue : '#16a34a';
    const purchasedCopyRecords = productRecords.filter((record) => record.kind === 'Copy trading');
    const rentedEaRecords = productRecords.filter((record) => record.kind === 'EA rental');
    const activeCopyRecord: ProductRecord | null = purchasedCopyRecords.find((record) => record.id === selectedCopyRecordId) ?? purchasedCopyRecords[0] ?? null;
    const activeEaRecord: ProductRecord | null = rentedEaRecords.find((record) => record.id === selectedEaRecordId) ?? rentedEaRecords[0] ?? null;
    const subTabs: Array<'Balance' | 'History' | 'Statistics' | 'Risks'> = ['Balance', 'History', 'Statistics', 'Risks'];

    if (kind === 'Copy trading') {
      if (!activeCopyRecord) {
        return <section style={card}><h2 style={{ marginTop: 0 }}>Copy trading</h2><p style={{ color: colors.muted, marginBottom: 0 }}>Currently you do not have any purchased Copy trading rights. Please go to the Products menu and select one.</p></section>;
      }

      const detailHistory: Array<{ instrument: string; result: number; date: string }> = activeCopyRecord.history && activeCopyRecord.history.length ? activeCopyRecord.history : [{ instrument: '—', result: 0, date: '—' }];
      const detailStats = activeCopyRecord.statistics || 'Awaiting live trading activity';
      const detailRisk = activeCopyRecord.risk || 'Awaiting risk evaluation';
      const detailResult = detailHistory.reduce<number>((sum, item) => sum + Number(item.result || 0), 0);

      return <section style={{ display: 'grid', gap: '14px' }}>
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Copy trading</h2>
          <p style={{ color: colors.muted, margin: '0 0 14px' }}>Your purchased Copy trading rights and live runtime summary.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['No.', 'Product', 'Starting balance', 'Started', 'Expires', 'Daily balance', 'Profit / loss', 'Status'].map((heading) => <th key={heading} style={{ padding: '10px', border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: 'left' }}>{heading}</th>)}</tr>
              </thead>
              <tbody>
                {purchasedCopyRecords.map((record) => {
                  const isActive = new Date(record.expiresAt).getTime() > Date.now();
                  const isSelected = activeCopyRecord.id === record.id;
                  return (
                    <tr key={record.id} onClick={() => setSelectedCopyRecordId(record.id)} style={{ cursor: 'pointer', background: isSelected ? colors.surfaceAlt : 'transparent' }}>
                      {[record.id, `${record.kind} · ${record.name}`, formatMoney(record.balance), record.startedAt, record.expiresAt, formatMoney(record.dailyBalance), `${record.profitLoss >= 0 ? '+' : ''}${formatMoney(record.profitLoss).replace(/^\$/, '')}`, isActive ? 'Active' : 'Expired'].map((cell, index) => (
                        <td key={`${record.id}-${index}`} style={{ padding: '10px', border: `1px solid ${colors.border}`, color: index === 7 ? (isActive ? '#16a34a' : '#dc2626') : colors.text, fontWeight: index === 7 ? 700 : 400 }}>{cell}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0 }}>{activeCopyRecord.name}</h2>
              <p style={{ color: colors.muted, margin: '6px 0 0' }}>{activeCopyRecord.kind}</p>
            </div>
            <span style={{ color: accent, fontWeight: 700 }}>USER PRODUCT</span>
          </div>
          <nav style={{ display: 'flex', gap: '7px', overflowX: 'auto', margin: '18px 0 0', borderBottom: `1px solid ${colors.border}` }}>{subTabs.map((tab) => <button type="button" key={tab} onClick={() => setServiceSection(tab)} style={{ background: 'transparent', border: 0, borderBottom: serviceSection === tab ? `2px solid ${accent}` : '2px solid transparent', color: serviceSection === tab ? accent : colors.text, padding: '9px 12px', cursor: 'pointer' }}>{tab}</button>)}</nav>
        </section>

        {serviceSection === 'Balance' && <section style={card}><h3 style={{ marginTop: 0 }}>Balance</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>{[['Current balance', formatMoney(activeCopyRecord.balance)], ['Selected product', activeCopyRecord.name], ['Updated', lastUpdated ? lastUpdated.toLocaleTimeString() : '—']].map(([label, value]) => <div key={label} style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '14px' }}><small style={{ color: colors.muted }}>{label}</small><strong style={{ display: 'block', marginTop: '8px', color: accent }}>{value}</strong></div>)}</div></section>}
        {serviceSection === 'History' && <section style={card}><h3 style={{ marginTop: 0 }}>History</h3>{detailHistory.length ? <div style={{ display: 'grid', gap: '8px' }}>{detailHistory.map((item: { instrument: string; result: number; date: string }) => <div key={`${item.instrument}-${item.date}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}><span>{item.instrument}</span><span>{item.date}</span><strong style={{ color: item.result >= 0 ? '#16a34a' : '#dc2626' }}>{item.result >= 0 ? '+' : ''}{formatMoney(item.result)}</strong></div>)}</div> : <p style={{ color: colors.muted }}>No history is available for your selected product yet.</p>}</section>}
        {serviceSection === 'Statistics' && <section style={card}><h3 style={{ marginTop: 0 }}>Statistics</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>{[['Total trades', String(detailHistory.length)], ['Recorded result', formatMoney(detailResult)], ['Data status', detailStats]].map(([label, value]) => <div key={label} style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '14px' }}><small style={{ color: colors.muted }}>{label}</small><strong style={{ display: 'block', marginTop: '8px', color: accent }}>{value}</strong></div>)}</div></section>}
        {serviceSection === 'Risks' && <section style={card}><h3 style={{ marginTop: 0 }}>Risks</h3><p style={{ color: colors.muted }}>Risk information is calculated from your selected product activity and is not taken from the public administrator account.</p><strong style={{ color: '#f59e0b' }}>{detailRisk}</strong></section>}
      </section>;
    }

    if (kind === 'EA rental') {
      if (!activeEaRecord) {
        return <section style={card}><h2 style={{ marginTop: 0 }}>EA rental</h2><p style={{ color: colors.muted, marginBottom: 0 }}>Currently you do not have any rented EA. Please go to the Products menu and select one.</p></section>;
      }

      const detailHistory: Array<{ instrument: string; result: number; date: string }> = activeEaRecord.history && activeEaRecord.history.length ? activeEaRecord.history : [{ instrument: '—', result: 0, date: '—' }];
      const detailStats = activeEaRecord.statistics || 'Awaiting live EA activity';
      const detailRisk = activeEaRecord.risk || 'Awaiting risk evaluation';
      const detailResult = detailHistory.reduce<number>((sum, item) => sum + Number(item.result || 0), 0);

      return <section style={{ display: 'grid', gap: '14px' }}>
        <section style={card}>
          <h2 style={{ marginTop: 0 }}>EA rental</h2>
          <p style={{ color: colors.muted, margin: '0 0 14px' }}>Your rented EA subscriptions and live runtime summary.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['No.', 'Product', 'Starting balance', 'Started', 'Expires', 'Daily balance', 'Profit / loss', 'Status'].map((heading) => <th key={heading} style={{ padding: '10px', border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: 'left' }}>{heading}</th>)}</tr>
              </thead>
              <tbody>
                {rentedEaRecords.map((record) => {
                  const isActive = new Date(record.expiresAt).getTime() > Date.now();
                  const isSelected = activeEaRecord.id === record.id;
                  return (
                    <tr key={record.id} onClick={() => setSelectedEaRecordId(record.id)} style={{ cursor: 'pointer', background: isSelected ? colors.surfaceAlt : 'transparent' }}>
                      {[record.id, `${record.kind} · ${record.name}`, formatMoney(record.balance), record.startedAt, record.expiresAt, formatMoney(record.dailyBalance), `${record.profitLoss >= 0 ? '+' : ''}${formatMoney(record.profitLoss).replace(/^\$/, '')}`, isActive ? 'Active' : 'Expired'].map((cell, index) => (
                        <td key={`${record.id}-${index}`} style={{ padding: '10px', border: `1px solid ${colors.border}`, color: index === 7 ? (isActive ? '#16a34a' : '#dc2626') : colors.text, fontWeight: index === 7 ? 700 : 400 }}>{cell}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0 }}>{activeEaRecord.name}</h2>
              <p style={{ color: colors.muted, margin: '6px 0 0' }}>{activeEaRecord.kind}</p>
            </div>
            <span style={{ color: accent, fontWeight: 700 }}>USER PRODUCT</span>
          </div>
          <nav style={{ display: 'flex', gap: '7px', overflowX: 'auto', margin: '18px 0 0', borderBottom: `1px solid ${colors.border}` }}>{subTabs.map((tab) => <button type="button" key={tab} onClick={() => setServiceSection(tab)} style={{ background: 'transparent', border: 0, borderBottom: serviceSection === tab ? `2px solid ${accent}` : '2px solid transparent', color: serviceSection === tab ? accent : colors.text, padding: '9px 12px', cursor: 'pointer' }}>{tab}</button>)}</nav>
        </section>

        {serviceSection === 'Balance' && <section style={card}><h3 style={{ marginTop: 0 }}>Balance</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>{[['Current balance', formatMoney(activeEaRecord.balance)], ['Selected product', activeEaRecord.name], ['Updated', lastUpdated ? lastUpdated.toLocaleTimeString() : '—']].map(([label, value]) => <div key={label} style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '14px' }}><small style={{ color: colors.muted }}>{label}</small><strong style={{ display: 'block', marginTop: '8px', color: accent }}>{value}</strong></div>)}</div></section>}
        {serviceSection === 'History' && <section style={card}><h3 style={{ marginTop: 0 }}>History</h3>{detailHistory.length ? <div style={{ display: 'grid', gap: '8px' }}>{detailHistory.map((item: { instrument: string; result: number; date: string }) => <div key={`${item.instrument}-${item.date}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}><span>{item.instrument}</span><span>{item.date}</span><strong style={{ color: item.result >= 0 ? '#16a34a' : '#dc2626' }}>{item.result >= 0 ? '+' : ''}{formatMoney(item.result)}</strong></div>)}</div> : <p style={{ color: colors.muted }}>No history is available for your selected product yet.</p>}</section>}
        {serviceSection === 'Statistics' && <section style={card}><h3 style={{ marginTop: 0 }}>Statistics</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>{[['Total trades', String(detailHistory.length)], ['Recorded result', formatMoney(detailResult)], ['Data status', detailStats]].map(([label, value]) => <div key={label} style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '14px' }}><small style={{ color: colors.muted }}>{label}</small><strong style={{ display: 'block', marginTop: '8px', color: accent }}>{value}</strong></div>)}</div></section>}
        {serviceSection === 'Risks' && <section style={card}><h3 style={{ marginTop: 0 }}>Risks</h3><p style={{ color: colors.muted }}>Risk information is calculated from your selected product activity and is not taken from the public administrator account.</p><strong style={{ color: '#f59e0b' }}>{detailRisk}</strong></section>}
      </section>;
    }

    const currentKind = kind as ServiceKind;
    const selectedProduct = product ?? serviceProducts[currentKind][0];
    const data = serviceData[currentKind];
    if (!product) {
      return <section style={card}><h2 style={{ marginTop: 0 }}>{currentKind}</h2><p style={{ color: colors.muted }}>You have not selected a {currentKind} product.</p><div style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '16px' }}><h3 style={{ margin: '0 0 8px' }}>Choose a {currentKind} product</h3><p style={{ color: colors.muted, marginTop: 0 }}>{selectedProduct.description}</p><button type="button" onClick={() => selectService(currentKind, selectedProduct)} style={button(true)}>Select {selectedProduct.name}</button></div></section>;
    }
    return <section style={{ display: 'grid', gap: '14px' }}><section style={card}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}><div><h2 style={{ margin: 0 }}>{product.name}</h2><p style={{ color: colors.muted, margin: '6px 0 0' }}>{product.description}</p></div><span style={{ color: accent, fontWeight: 700 }}>USER PRODUCT</span></div><nav style={{ display: 'flex', gap: '7px', overflowX: 'auto', margin: '18px 0 0', borderBottom: `1px solid ${colors.border}` }}>{subTabs.map((tab) => <button type="button" key={tab} onClick={() => setServiceSection(tab)} style={{ background: 'transparent', border: 0, borderBottom: serviceSection === tab ? `2px solid ${accent}` : '2px solid transparent', color: serviceSection === tab ? accent : colors.text, padding: '9px 12px', cursor: 'pointer' }}>{tab}</button>)}</nav></section>{serviceSection === 'Balance' && <section style={card}><h3 style={{ marginTop: 0 }}>Balance</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>{[['Current balance', data?.balance === undefined ? '—' : formatMoney(data.balance)], ['Selected product', product.name], ['Updated', lastUpdated ? lastUpdated.toLocaleTimeString() : '—']].map(([label, value]) => <div key={label} style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '14px' }}><small style={{ color: colors.muted }}>{label}</small><strong style={{ display: 'block', marginTop: '8px', color: accent }}>{value}</strong></div>)}</div></section>}{serviceSection === 'History' && <section style={card}><h3 style={{ marginTop: 0 }}>History</h3>{data?.history?.length ? <div style={{ display: 'grid', gap: '8px' }}>{data.history.map((item: { instrument: string; result: number; date: string }) => <div key={`${item.instrument}-${item.date}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}><span>{item.instrument}</span><span>{item.date}</span><strong style={{ color: item.result >= 0 ? '#16a34a' : '#dc2626' }}>{item.result >= 0 ? '+' : ''}{formatMoney(item.result)}</strong></div>)}</div> : <p style={{ color: colors.muted }}>No history is available for your selected product yet.</p>}</section>}{serviceSection === 'Statistics' && <section style={card}><h3 style={{ marginTop: 0 }}>Statistics</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>{[['Total trades', data?.history?.length === undefined ? '—' : String(data.history.length)], ['Recorded result', data?.history?.length ? formatMoney(data.history.reduce<number>((sum, item) => sum + Number(item.result || 0), 0)) : '—'], ['Data status', data?.statistics || 'Awaiting user activity']].map(([label, value]) => <div key={label} style={{ background: colors.surfaceAlt, borderRadius: '6px', padding: '14px' }}><small style={{ color: colors.muted }}>{label}</small><strong style={{ display: 'block', marginTop: '8px', color: accent }}>{value}</strong></div>)}</div></section>}{serviceSection === 'Risks' && <section style={card}><h3 style={{ marginTop: 0 }}>Risks</h3><p style={{ color: colors.muted }}>Risk information is calculated from your selected product activity and is not taken from the public administrator account.</p><strong style={{ color: '#f59e0b' }}>{data?.risk || 'Awaiting user activity'}</strong></section>}</section>;
  };
  const renderProductRecords = () => <section style={{ display: 'grid', gap: '14px' }}><section style={card}><h2 style={{ marginTop: 0 }}>Selected products</h2><p style={{ color: colors.muted }}>Your saved product subscriptions and current performance summary.</p><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}><thead><tr>{['No.', 'Product', 'Starting balance', 'Started', 'Expires', 'Daily balance', 'Profit / loss', 'Status'].map((heading) => <th key={heading} style={{ padding: '10px', border: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: 'left' }}>{heading}</th>)}</tr></thead><tbody>{productRecords.map((record) => { const active = new Date(record.expiresAt).getTime() > Date.now(); return <tr key={record.id}>{[String(record.id), `${record.kind} · ${record.name}`, formatMoney(record.balance), record.startedAt, record.expiresAt, formatMoney(record.dailyBalance), `${record.profitLoss >= 0 ? '+' : ''}${formatMoney(record.profitLoss).replace(/^\$/, '')}`, active ? 'Active' : 'Expired'].map((cell, index) => <td key={`${record.id}-${index}`} style={{ padding: '10px', border: `1px solid ${colors.border}`, color: index === 7 ? (active ? '#16a34a' : '#dc2626') : colors.text, fontWeight: index === 7 ? 700 : 400 }}>{cell}</td>)}</tr>; })}</tbody></table></div>{productRecords.length === 0 && <p style={{ color: colors.muted }}>No products selected.</p>}</section><section style={card}><h2 style={{ marginTop: 0 }}>Add product</h2><div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}><button type="button" onClick={() => beginProductSetup('Copy trading')} style={button(true)}>New Copy Trading</button><button type="button" onClick={() => beginProductSetup('EA rental')} style={button(true)}>New EA Rent</button></div>{activationMessage && <p style={{ marginTop: '12px', color: '#16a34a', fontWeight: 700 }}>{activationMessage}</p>}</section>{productSetup && <section style={card}><h2 style={{ marginTop: 0, fontSize: '28px' }}>{productSetup.kind} setup</h2>{productSetup.kind === 'Copy trading' && <div style={{ margin: '16px 0 20px', display: 'grid', gap: '14px', lineHeight: 1.6 }}><p style={{ margin: 0 }}>Copy trading subscription plans and pricing structures commonly incorporate tiered terms, bundled discounts for longer durations, and risk management parameters:</p><div style={{ display: 'grid', gap: '10px' }}><p style={{ margin: 0 }}><strong>1-Month Plan:</strong> Short-term subscription billed on a monthly basis, carrying a standard baseline fee (e.g., 3% or a fixed monthly rate) without long-term commitment discounts.</p><p style={{ margin: 0 }}><strong>3-Month Plan:</strong> Quarterly plan designed for intermediate traders, typically offering a moderate percentage fee reduction or cost savings compared to monthly renewals.</p><p style={{ margin: 0 }}><strong>6-Month Plan:</strong> Semi-annual plan providing enhanced structural savings and extended access for users pursuing medium-term market strategies.</p><p style={{ margin: 0 }}><strong>12-Month Plan:</strong> Annual subscription offering maximum value, significantly lower relative periodic costs, and the highest total savings for committed participants.</p><p style={{ margin: 0 }}><strong>Risk-Gated Plans:</strong> Specialized subscription levels that enforce strict account prerequisites, such as a mandatory minimum balance requirement (e.g., a $500 minimum account threshold) to ensure proper risk management during automated strategy replication.</p></div><div style={{ overflowX: 'auto' }}><div style={{ minWidth: '620px', display: 'grid', gridTemplateColumns: '1.1fr 1.8fr 1.2fr', border: `1px solid ${colors.border}`, borderRadius: '6px', overflow: 'hidden' }}>{[['Plan', 'Structure', 'Example pricing'], ['1-Month', 'Monthly baseline', '3% or fixed fee'], ['3-Month', 'Quarterly discount', 'Reduced vs monthly'], ['6-Month', 'Semi-annual savings', 'Enhanced savings'], ['12-Month', 'Annual value', 'Maximum savings'], ['Risk-Gated', '$500 minimum balance', 'Risk-managed access']].map(([cell, value, extra], index) => <div key={`${cell}-${value}`} style={{ display: 'contents' }}><strong style={{ padding: '10px', background: index === 0 ? colors.surfaceAlt : colors.surface, borderBottom: `1px solid ${colors.border}` }}>{cell}</strong><span style={{ padding: '10px', background: index === 0 ? colors.surfaceAlt : colors.surface, borderBottom: `1px solid ${colors.border}` }}>{value}</span><span style={{ padding: '10px', background: index === 0 ? colors.surfaceAlt : colors.surface, borderBottom: `1px solid ${colors.border}` }}>{extra}</span></div>)}</div></div></div>}{productSetup.kind === 'EA rental' && renderEAAgreement()}<label style={{ display: 'block', color: colors.muted }}>Starting account balance<input type="number" min="0" value={productSetup.balance} onChange={(event) => setProductSetup({ ...productSetup, balance: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '5px' }} />{productSetup.balance && Number(productSetup.balance) < (productSetup.kind === 'EA rental' ? 1000 : 500) && <small style={{ display: 'block', marginTop: '6px', color: '#dc2626', fontWeight: 700 }}>Warning: Minimum balance is ${productSetup.kind === 'EA rental' ? '1000' : '500'}.</small>}</label><label style={{ display: 'block', color: colors.muted, marginTop: '12px' }}>Duration<select value={productSetup.duration} onChange={(event) => setProductSetup({ ...productSetup, duration: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '5px' }}><option value="">Select duration</option><option value="30 days">1 month (30 days)</option><option>3 months</option><option>6 months</option><option>12 months</option></select></label>{productSetup.kind === 'EA rental' && <><p style={{ margin: '14px 0 0', fontStyle: 'italic', color: colors.muted }}>I authorize the system to apply taxes to my allocated profit in accordance with the tax laws applicable in my country and transfer the remaining amount to my account.</p><label style={{ display: 'flex', gap: '8px', marginTop: '14px', color: colors.text }}><input type="checkbox" checked={productSetup.agreed} onChange={(event) => setProductSetup({ ...productSetup, agreed: event.target.checked })} /> I accept the EA rental agreement terms.</label></>}{productSetup.kind === 'EA rental' && Number(productSetup.balance) < 1000 && <p style={{ marginTop: '12px', color: '#dc2626', fontWeight: 700 }}>Warning: Minimum balance must start at $1000.</p>}<button type="button" onClick={openPayment} disabled={!setupReady} style={{ ...button(true), marginTop: '16px', opacity: setupReady ? 1 : .5 }}>Review payment</button></section>}{paymentOpen && productSetup && <section style={{ ...card, borderColor: '#16a34a' }}><h2 style={{ marginTop: 0 }}>Payment summary</h2><p style={{ color: colors.muted }}>Account funding: ${formatMoney(productSetup.balance)}</p><p style={{ color: colors.muted }}>{productSetup.kind === 'EA rental' ? 'Server rent' : 'Product/service fee'}: ${formatMoney(getProductFee(productSetup))}</p><p style={{ fontWeight: 700 }}>Total payable: ${formatMoney(Number(productSetup.balance) + getProductFee(productSetup))}</p><p style={{ color: colors.muted, fontSize: '13px' }}>This demo records your instruction locally. Live XM broker account creation, payment processing, and robot deployment require a secured backend integration.</p><button type="button" onClick={completePayment} style={button(true)}>Confirm payment and activate</button></section>}</section>;

  return (
    <main style={{ minHeight: '100vh', background: colors.page, color: colors.text, padding: '62px 20px 40px', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '22px', flexWrap: 'wrap' }}>
          <div><p style={{ margin: 0, color: colors.blue, fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>GOLDMASTER MEMBER AREA</p><h1 style={{ margin: '6px 0', fontSize: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>Welcome back <CountryFlag code={(profile as typeof profile & { countryCode?: string }).countryCode} size={22} /></h1><p style={{ margin: 0, color: colors.muted }}>{contact || 'Loading account...'} · Last synced {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</p></div>
          <div style={{ display: 'flex', gap: '8px' }}><button type="button" onClick={() => router.push('/')} style={button()}>Public signal</button><button type="button" onClick={logout} style={button()}>Log out</button></div>
        </header>

        <nav style={{ display: 'flex', gap: '7px', overflowX: 'auto', marginBottom: '18px', paddingBottom: '3px' }}>{tabs.map((tab) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} style={button(activeTab === tab)}>{tab}</button>)}</nav>

        {activeTab === 'Overview' && <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '14px' }}>
            {[['Portfolio value', productRecords.length ? formatMoney(productSummary.balance) : userBalance === undefined ? '—' : formatMoney(userBalance), colors.blue], ['Net profit', productRecords.length ? formatMoney(productSummary.profitLoss) : '—', '#16a34a'], ['Return', productRecords.length ? formatMoney(productSummary.dailyBalance - productSummary.balance) : '—', '#16a34a'], ['Risk score', productRecords.length ? `${productSummary.trades} trades` : 'Awaiting activity', '#f59e0b']].map(([label, value, accent]) => <div key={label} style={card}><span style={{ color: colors.muted, fontSize: '13px' }}>{label}</span><strong style={{ display: 'block', marginTop: '12px', fontSize: '25px', color: accent }}>{value}</strong><small style={{ color: colors.muted }}>Your account data</small></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
            <section style={card}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><h2 style={{ margin: 0, fontSize: '18px' }}>Performance</h2><p style={{ margin: '6px 0 18px', color: colors.muted }}>Account growth since your first trade</p></div><span style={{ color: '#16a34a', fontWeight: 700 }}>LIVE</span></div><svg viewBox="0 0 700 210" style={{ width: '100%', height: '210px', background: colors.surfaceAlt, borderRadius: '6px' }}><path d="M30 178 C110 168 130 150 190 158 S270 120 330 132 S410 92 470 108 S570 55 670 65" fill="none" stroke="#16a34a" strokeWidth="4" /><path d="M30 178 C110 168 130 150 190 158 S270 120 330 132 S410 92 470 108 S570 55 670 65 L670 190 L30 190 Z" fill="#16a34a" opacity=".12" /><line x1="30" y1="190" x2="670" y2="190" stroke={colors.border} /></svg></section>
            <section style={card}><h2 style={{ margin: 0, fontSize: '18px' }}>Account allocation</h2><p style={{ color: colors.muted, margin: '6px 0 20px' }}>Where your capital is working</p>{[['Copy trading', '55%', '#0284c7'], ['EA rental', '30%', '#16a34a'], ['Available cash', '15%', '#f59e0b']].map(([name, percent, accent]) => <div key={name} style={{ marginBottom: '18px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}><span>{name}</span><strong>{percent}</strong></div><div style={{ height: '8px', background: colors.surfaceAlt, borderRadius: '8px' }}><div style={{ width: percent, height: '100%', background: accent, borderRadius: '8px' }} /></div></div>)}</section>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}><section style={card}><h2 style={{ margin: 0, fontSize: '18px' }}>Active services</h2><p style={{ color: colors.muted }}>Your current products and subscriptions</p><div style={{ display: 'grid', gap: '10px' }}>{(Object.keys(serviceProducts) as ServiceKind[]).filter((kind) => selectedServices[kind]).map((kind) => <div key={kind} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: colors.surfaceAlt, borderRadius: '6px' }}><span>{selectedServices[kind]}<small style={{ display: 'block', color: colors.muted, marginTop: '4px' }}>{kind} · {serviceData[kind]?.balance === undefined ? 'Setup pending' : 'Active'}</small></span><strong style={{ color: '#16a34a' }}>●</strong></div>)}{!Object.values(selectedServices).some(Boolean) && <p style={{ color: colors.muted }}>No products selected yet.</p>}</div></section><section style={card}><h2 style={{ margin: 0, fontSize: '18px' }}>Recent activity</h2><p style={{ color: colors.muted }}>Your account events</p><p style={{ color: colors.muted }}>{lastUpdated ? lastUpdated.toLocaleString() : '—'} · Data refreshed</p></section></div>
        </div>}

        {activeTab === 'Account' && <section style={{ display: 'grid', gap: '14px' }}>
          <section style={card}><h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>Profile <CountryFlag code={(profile as typeof profile & { countryCode?: string }).countryCode} size={22} /></h2><p style={{ color: colors.muted }}>Keep your personal and contact details current. Sensitive identity documents must be stored and verified by a secure backend.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>{[['Full legal name', 'fullName', 'Your name as shown on ID'], ['Phone number', 'phone', '+976...'], ['Country / region', 'country', 'Mongolia']].map(([label, key, placeholder]) => <label key={key} style={{ color: colors.muted, fontSize: '13px' }}>{label}<input value={profile[key as keyof typeof profile]} placeholder={placeholder} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '5px', background: colors.surfaceAlt, color: colors.text }} /></label>)}<label style={{ color: colors.muted, fontSize: '13px' }}>Email<input value={contact} readOnly style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '5px', background: colors.surfaceAlt, color: colors.muted }} /></label></div><button type="button" onClick={saveProfile} style={{ ...button(true), marginTop: '14px' }}>{profileSaved ? 'Saved securely' : 'Save profile'}</button></section>
          <section style={card}><h2 style={{ margin: 0 }}>Verification / KYC</h2><p style={{ color: colors.muted }}>Complete identity, contact, and suitability checks before withdrawals or regulated services are enabled.</p>{[['Contact verification', 'Email or mobile OTP', true], ['Identity verification', 'Government ID and liveness check', verificationStep >= 2], ['Address verification', 'Proof of address', verificationStep >= 3], ['Suitability review', 'Risk questionnaire and terms', verificationStep >= 4]].map(([label, detail, done], index) => <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}><strong style={{ color: done ? '#16a34a' : colors.muted }}>{done ? '✓' : index + 1}</strong><div style={{ flex: 1 }}><b>{label}</b><small style={{ display: 'block', color: colors.muted, marginTop: '3px' }}>{detail}</small></div>{!done && index === verificationStep - 1 && <button type="button" onClick={() => setVerificationStep((step) => Math.min(4, step + 1))} style={button(true)}>Continue</button>}</div>)}</section>
          <section style={card}><h2 style={{ margin: 0 }}>Security</h2><p style={{ color: colors.muted }}>Use strong authentication and review sessions regularly. Passwords and MFA secrets are never stored in this browser.</p><div style={{ display: 'grid', gap: '10px' }}><div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px', background: colors.surfaceAlt, borderRadius: '6px' }}><span><b>Multi-factor authentication</b><small style={{ display: 'block', color: colors.muted }}>Authenticator app or passkey recommended</small></span><button type="button" onClick={() => setMfaEnabled(!mfaEnabled)} style={button(mfaEnabled)}>{mfaEnabled ? 'Enabled' : 'Enable MFA'}</button></div><div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px', background: colors.surfaceAlt, borderRadius: '6px' }}><span><b>Active sessions</b><small style={{ display: 'block', color: colors.muted }}>Review and revoke unknown devices</small></span><button type="button" onClick={() => setLastUpdated(new Date())} style={button()}>Review sessions</button></div><div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px', background: colors.surfaceAlt, borderRadius: '6px' }}><span><b>Account recovery</b><small style={{ display: 'block', color: colors.muted }}>Verified email and phone recovery channels</small></span><span style={{ color: '#16a34a', fontWeight: 700 }}>Protected</span></div></div></section>
        </section>}
        {(activeTab === 'Copy trading' || activeTab === 'EA rental') && renderServiceWorkspace(activeTab)}
        {activeTab === 'Products' && renderProductRecords()}
        {activeTab === 'Activity' && <section style={card}><h2 style={{ marginTop: 0 }}>Activity</h2><p style={{ color: colors.muted }}>Your latest account events.</p><div style={{ padding: '12px 0' }}>{Object.values(selectedServices).some(Boolean) ? `Product data refreshed · ${lastUpdated ? lastUpdated.toLocaleString() : '—'}` : 'No product activity yet.'}</div></section>}
      </section>
    </main>
  );
}
