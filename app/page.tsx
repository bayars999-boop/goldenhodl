'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from './theme-provider';

export default function Mql5SignalDashboard() {
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Users');
  const [chartType, setChartType] = useState<'Growth' | 'Balance'>('Growth');
  const [riskChartMode, setRiskChartMode] = useState<'Deposit load' | 'Drawdown'>('Deposit load');
  const [subscriptionsPeriod, setSubscriptionsPeriod] = useState('Last year');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const riskSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/api/trading-data')
      .then(async res => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 150)}...`);
        }
      })
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>Loading Signal Data...</div>;
  if (errorMsg) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', color: '#dc2626' }}><h2>API Error</h2><p>{errorMsg}</p></div>;

  const equity = data?.equity ?? 4921.65;
  const profit = data?.profit ?? 421.65;
  const initialDeposit = data?.initialDeposit ?? 4500.00;
  const withdrawals = data?.withdrawals ?? 0.00;
  const deposits = data?.deposits ?? 0.00;
  const growthPercent = data?.growthPercent ?? 9.37;
  
  const algoTrading = data?.algoTrading ?? 100;
  const maxDrawdown = data?.maxDrawdown ?? 4.2;
  const profitTrades = data?.profitTrades ?? 62.50;
  const maxDepositLoad = data?.maxDepositLoad ?? 7.01;
  const lossTrades = data?.lossTrades ?? 37.50;
  const tradingActivity = data?.tradingActivity ?? 71.05;

  const weeklyData = data?.weeklyData || [];
  
  const startMonth = data?.startMonth ?? 'Jan 2026';
  const growthLabel = `Growth since ${startMonth}`;

  const stats = data?.statisticsSummary || {};
  const risks = data?.risksData || {};
  const subscriptions = data?.subscriptionsData || { periods: [] };
  const mapMarkers = [
    { label: 'USA (Richard)', country: 'United States', latitude: 38.8951, longitude: -77.0364 },
    { label: 'Germany (Hans)', country: 'Germany', latitude: 52.5200, longitude: 13.4050 },
    { label: 'Japan (Kenji)', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
    { label: 'Brazil (Lucas)', country: 'Brazil', latitude: -15.7939, longitude: -47.8828 },
    { label: 'South Africa (Liam)', country: 'South Africa', latitude: -25.7461, longitude: 28.1881 },
  ];

  // The map asset uses a regular equirectangular 950 x 620 projection.
  const toMapPoint = (latitude: number, longitude: number) => ({
    x: ((longitude + 180) / 360) * 950,
    y: ((90 - latitude) / 180) * 620,
  });
  const mongoliaMapPoint = toMapPoint(46.8625, 103.8467);
  const mongoliaCenter = { x: mongoliaMapPoint.x - 25, y: mongoliaMapPoint.y + 20 };

  const chartHistory = data?.chartHistory && data.chartHistory.length > 0 
    ? data.chartHistory 
    : [{ date: '2026-01-01', balance: 4500, equity: 4500, growth: 0.00 }, { date: '2026-09-04', balance: equity, equity, growth: growthPercent }];

  const svgWidth = 800;
  const svgHeight = 180;
  const paddingX = 50;
  const paddingY = 20;

  const values = chartHistory.map((item: any) => chartType === 'Growth' ? item.growth : item.balance);
  const minVal = Math.min(...values, chartType === 'Growth' ? 0 : initialDeposit * 0.9);
  const maxVal = Math.max(...values, chartType === 'Growth' ? 10 : initialDeposit * 1.1);

  const getX = (index: number, total: number, width: number) => {
    if (total <= 1) return width / 2;
    return paddingX + (index / (total - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number, min: number, max: number, height: number) => {
    if (max === min) return height / 2;
    return height - paddingY - ((val - min) / (max - min)) * (height - paddingY * 2);
  };

  const points = chartHistory.map((item: any, idx: number) => `${getX(idx, chartHistory.length, svgWidth)},${getY(chartType === 'Growth' ? item.growth : item.balance, minVal, maxVal, svgHeight)}`).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    
    let closestIdx = 0;
    let minDist = Infinity;
    chartHistory.forEach((_: unknown, idx: number) => {
      const dist = Math.abs(getX(idx, chartHistory.length, svgWidth) - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  return (
    <div className="dashboard-shell" style={{ background: '#f8fafc', color: '#1e293b', minHeight: '100vh', padding: '15px', fontFamily: 'Arial, sans-serif' }}>
      <div className="dashboard-card" style={{ maxWidth: '1280px', margin: '0 auto', background: '#ffffff', padding: '15px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ minHeight: '145px', borderBottom: '1px solid #e2e8f0', padding: '10px 0 15px 45px', marginBottom: '15px', color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <img src={theme === 'dark' ? '/goldmaster-logo-dark.png' : '/goldmaster-logo.png'} alt="GoldMaster logo" style={{ width: '87px', height: '87px', objectFit: 'contain' }} />
              <span style={{ fontSize: '22px', lineHeight: 1.4 }}>IF YOU WANT LONG TERM STABLE PROFITS, JOIN US.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => { window.location.href = '/copy-trading'; }} style={{ background: 'transparent', border: '1px solid #16a34a', color: '#16a34a', padding: '8px 18px', borderRadius: '4px', fontWeight: 600 }}>Sign in</button>
              <button type="button" onClick={() => { window.location.href = '/login'; }} style={{ background: '#16a34a', border: '1px solid #16a34a', color: '#fff', padding: '8px 18px', borderRadius: '4px', fontWeight: 600 }}>Log in</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '26px' }}>
            <strong style={{ flexBasis: '100%', fontSize: '18px' }}>Result of GoldMaster Expert Advisor</strong>                        <img src="/mongolia-flag.png" alt="Mongolian flag" style={{ width: '32px', height: '18px', objectFit: 'contain', borderRadius: '2px' }} />
            <span style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Owner: {data?.author || 'Bayarsaikhan Janchiv'}</span><span style={{ color: '#eab308', fontSize: '16px' }}>★★★★★</span><span style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '12px' }}>5 reviews</span><span style={{ color: '#16a34a', fontSize: '12px' }}>■■■ Reliability</span><span style={{ color: '#16a34a', fontSize: '12px' }}>1 week</span><span style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '12px' }}>👥 0 / 0 USD</span>
          </div>
        </div>
        {/* Top Header Row */}
        <div style={{ display: 'none' }}>
          <div style={{ position: 'relative', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '68px' }}>
            <img src="/goldmaster-logo.png" alt="GoldMaster logo" style={{ position: 'absolute', top: 0, left: 0, width: '87px', height: '87px', objectFit: 'contain' }} />
            <span style={{ position: 'absolute', top: '68px', left: 0, fontSize: '15px', fontWeight: 'bold', color: '#0284c7' }}>
              Result of GoldMaster Expert Advisor
            </span>
            <div style={{ position: 'absolute', top: 0, left: '75px', maxWidth: '430px', fontSize: '15px', lineHeight: '1.55', textAlign: 'right', color: '#64748b' }}>
              <div>IF YOU WANT LONG TERM STABLE PROFITS, JOIN US.</div>
              <div>If you want to get rich quickly, close this window right now and forget about us.</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '15px', borderRadius: '2px', overflow: 'hidden', border: '1px solid #cbd5e1' }} title="Mongolia">
              <svg viewBox="0 0 900 600" style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                <rect width="300" height="600" fill="#DA2013" />
                <rect x="300" width="300" height="600" fill="#0066B3" />
                <rect x="600" width="300" height="600" fill="#DA2013" />
                <g transform="translate(120, 120) scale(0.8)">
                  <path d="M50 0 L75 35 L25 35 Z" fill="#FFCC00" />
                  <rect x="35" y="45" width="30" height="150" fill="#FFCC00" />
                  <circle cx="50" cy="230" r="15" fill="#FFCC00" />
                </g>
              </svg>
            </div>

            <span style={{ fontSize: '13px', color: '#475569', fontWeight: 'normal' }}>
              Owner: {data?.author || 'Bayarsaikhan Janchiv'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#eab308' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} style={{ width: '13px', height: '13px', fill: 'currentColor' }} viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
              <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>5 reviews</span>
            </div>

            <span style={{ fontSize: '12px', color: '#16a34a' }}>■■■ Reliability</span>
            <span style={{ fontSize: '12px', color: '#16a34a' }}>1 week</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>👥 0 / 0 USD</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => { window.location.href = '/copy-trading'; }}
              style={{ background: '#ffffff', border: '1px solid #16a34a', color: '#16a34a', padding: '6px 14px', minWidth: '78px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              Sign in
            </button>
            <button type="button" onClick={() => { window.location.href = '/login'; }} style={{ background: '#16a34a', border: '1px solid #16a34a', color: '#ffffff', padding: '6px 14px', minWidth: '78px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Log in</button>
          </div>
        </div>

        {/* Financial Overview & Weekly Account Change Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 260px 280px', gap: '20px', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', color: '#475569', textTransform: 'capitalize' }}>{growthLabel}</div>
              <div style={{ fontSize: '26px', color: '#16a34a' }}>
                +{growthPercent.toFixed(2)}%
              </div>
            </div>
            
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #cbd5e1', 
              borderRadius: '4px',
              padding: '10px 12px',
              width: '100%',
              minHeight: '110px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '13px', color: '#0284c7', marginBottom: '8px', textAlign: 'left' }}>
                Weekly Account Change
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '3px', 
                height: '65px', 
                overflowX: 'auto',
                width: '100%',
                paddingBottom: '2px'
              }}>
                {weeklyData.map((w: any, idx: number) => {
                  const hasData = w.change !== null && w.change !== 0;
                  const maxVal = Math.max(...weeklyData.map((d: any) => Math.abs(d.change || 0)), 1);
                  const barHeight = hasData ? Math.min(Math.max((Math.abs(w.change) / maxVal) * 26, 3), 26) : 0;
                  const isPositive = (w.change || 0) >= 0;
                  
                  return (
                    <div 
                      key={idx} 
                      title={hasData ? `Week ${w.week}: $${w.change}` : `Week ${w.week}: No data`} 
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '7px', flexShrink: 0, cursor: hasData ? 'pointer' : 'default' }}
                    >
                      <div style={{ height: '30px', display: 'flex', alignItems: 'flex-end' }}>
                        {isPositive && hasData && (
                          <div style={{ width: '7px', height: `${barHeight}px`, background: '#16a34a', borderRadius: '1px' }} />
                        )}
                      </div>
                      <div style={{ height: '1px', background: '#94a3b8', width: '100%' }} />
                      <div style={{ height: '30px', display: 'flex', alignItems: 'flex-start' }}>
                        {!isPositive && hasData && (
                          <div style={{ width: '7px', height: `${barHeight}px`, background: '#881337', borderRadius: '1px' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ color: '#0284c7', fontSize: '13px' }}>{data?.broker}</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{data?.leverage}</span>
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc', padding: '8px' }}>
            <div style={{ fontSize: '12px', textAlign: 'center', color: '#0284c7', marginBottom: '6px' }}>
              Algo trading: {algoTrading}%
            </div>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', color: '#475569' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '3px 0' }}>Maximum drawdown:</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{maxDrawdown}%</td></tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '3px 0' }}>Profit Trades:</td><td style={{ padding: '3px 0', textAlign: 'right', color: '#16a34a' }}>{profitTrades}%</td></tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '3px 0' }}>Max deposit load:</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{maxDepositLoad}%</td></tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '3px 0' }}>Loss Trades:</td><td style={{ padding: '3px 0', textAlign: 'right', color: '#881337' }}>{lossTrades}%</td></tr>
                <tr><td colSpan={2} style={{ padding: '4px 0 2px 0', textAlign: 'center' }}>Trading activity: {tradingActivity}%</td></tr>
              </tbody>
            </table>
          </div>

          {(() => {
            const maxVal = Math.max(equity, initialDeposit, Math.abs(profit));
            const equityWidth = maxVal > 0 ? `${(equity / maxVal) * 100}%` : '0%';
            const profitWidth = maxVal > 0 ? `${(Math.abs(profit) / maxVal) * 100}%` : '0%';
            const depositWidth = maxVal > 0 ? `${(initialDeposit / maxVal) * 100}%` : '0%';

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ color: '#0284c7' }}>Equity</span>
                  <span style={{ color: '#1e293b' }}>${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                </div>
                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#0284c7', width: equityWidth }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ color: '#0284c7' }}>Profit</span>
                  <span style={{ color: profit >= 0 ? '#16a34a' : '#881337' }}>${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                </div>
                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: profit >= 0 ? '#16a34a' : '#881337', width: profitWidth }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ color: '#64748b' }}>Initial Deposit</span>
                  <span>${initialDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                </div>
                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#0284c7', width: depositWidth }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                  <span>Withdrawals</span><span>${withdrawals.toFixed(2)} USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Deposits</span><span>${deposits.toFixed(2)} USD</span>
                </div>

              </div>
            );
          })()}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '22px', borderBottom: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '13px' }}>
          {['Balance', 'History', 'Statistics', 'Risks', 'Users', 'Description', 'Reviews'].map((tab) => (
            <span
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                paddingBottom: '6px',
                cursor: 'pointer',
                color: activeTab === tab ? '#0284c7' : '#64748b',
                borderBottom: activeTab === tab ? '2px solid #0284c7' : 'none'
              }}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'Balance' && (
          <div>
            <div style={{ marginBottom: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '6px' }}>Symbol</th>
                    <th style={{ padding: '6px' }}>Time</th>
                    <th style={{ padding: '6px' }}>Type</th>
                    <th style={{ padding: '6px' }}>Volume</th>
                    <th style={{ padding: '6px' }}>Price</th>
                    <th style={{ padding: '6px' }}>S/L</th>
                    <th style={{ padding: '6px' }}>T/P</th>
                    <th style={{ padding: '6px' }}>Price</th>
                    <th style={{ padding: '6px' }}>Swap</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.positions?.map((pos: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px' }}>{pos.symbol}</td>
                      <td style={{ padding: '6px', color: '#64748b' }}>{pos.time}</td>
                      <td style={{ padding: '6px', color: pos.type === 'Buy' ? '#0284c7' : '#881337' }}>{pos.type}</td>
                      <td style={{ padding: '6px' }}>{pos.volume}</td>
                      <td style={{ padding: '6px' }}>{pos.openPrice}</td>
                      <td style={{ padding: '6px' }}>{pos.stopLoss}</td>
                      <td style={{ padding: '6px' }}>{pos.takeProfit}</td>
                      <td style={{ padding: '6px' }}>{pos.currentPrice}</td>
                      <td style={{ padding: '6px' }}>{Number(pos.swap).toFixed(2)}</td>
                      <td style={{ padding: '6px', textAlign: 'right', color: pos.profit >= 0 ? '#16a34a' : '#881337' }}>
                        {Number(pos.profit).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
                <button onClick={() => setChartType('Growth')} style={{ background: chartType === 'Growth' ? '#0284c7' : '#e2e8f0', color: chartType === 'Growth' ? '#fff' : '#475569', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>Growth</button>
                <button onClick={() => setChartType('Balance')} style={{ background: chartType === 'Balance' ? '#0284c7' : '#e2e8f0', color: chartType === 'Balance' ? '#fff' : '#475569', border: 'none', padding: '3px 10px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>Balance</button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', background: '#fff', position: 'relative' }}>
                <svg 
                  ref={svgRef}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                  style={{ width: '100%', height: '180px', overflow: 'visible', cursor: 'crosshair' }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {[0, 0.5, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * (svgHeight - paddingY * 2);
                    const val = maxVal - ratio * (maxVal - minVal);
                    return (
                      <g key={idx}>
                        <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x={paddingX - 8} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                          {chartType === 'Growth' ? `${val.toFixed(2)}%` : `$${val.toFixed(0)}`}
                        </text>
                      </g>
                    );
                  })}
                  <polyline fill="none" stroke="#0284c7" strokeWidth="2" points={points} />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px', paddingLeft: '50px', paddingRight: '50px' }}>
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'History' && (
          <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '6px' }}>Time</th>
                  <th style={{ padding: '6px' }}>Type</th>
                  <th style={{ padding: '6px' }}>Volume</th>
                  <th style={{ padding: '6px' }}>Symbol</th>
                  <th style={{ padding: '6px' }}>Price</th>
                  <th style={{ padding: '6px' }}>Time</th>
                  <th style={{ padding: '6px' }}>Price</th>
                  <th style={{ padding: '6px' }}>Commission</th>
                  <th style={{ padding: '6px' }}>Swap</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {data?.history?.map((h: any, i: number) => {
                  const isDeal = h.type === 'Buy' || h.type === 'Sell';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px', color: '#64748b' }}>{h.openTime}</td>
                      <td style={{ padding: '6px', color: h.type === 'Buy' ? '#0284c7' : h.type === 'Sell' ? '#881337' : '#475569' }}>{h.type}</td>
                      <td style={{ padding: '6px' }}>{h.volume || ''}</td>
                      <td style={{ padding: '6px' }}>{h.symbol || ''}</td>
                      <td style={{ padding: '6px' }}>{h.openPrice || ''}</td>
                      <td style={{ padding: '6px', color: '#64748b' }}>{h.closeTime}</td>
                      <td style={{ padding: '6px' }}>{isDeal ? h.closePrice : ''}</td>
                      <td style={{ padding: '6px' }}>{h.commission ? h.commission.toFixed(2) : ''}</td>
                      <td style={{ padding: '6px' }}>{h.swap ? h.swap.toFixed(2) : ''}</td>
                      <td style={{ padding: '6px', textAlign: 'right', color: h.profit >= 0 ? '#16a34a' : '#881337' }}>
                        {h.profit !== undefined && h.profit !== null ? Number(h.profit).toFixed(2) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'Statistics' && (
          <div style={{ fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Trades</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.trades}</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Profit trades (%):</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#16a34a' }}>{stats.profitTradesCount} ({stats.profitTradesPercent}%)</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Loss trades (%):</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#881337' }}>{stats.lossTradesCount} ({stats.lossTradesPercent}%)</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Best trade:</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#16a34a' }}>{stats.bestTrade} USD</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Worst trade:</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#881337' }}>{stats.worstTrade} USD</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Gross profit:</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#16a34a' }}>{stats.grossProfit} ({stats.grossProfitPips} pips)</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Gross loss:</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#881337' }}>{stats.grossLoss} ({stats.grossLossPips} pips)</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Max consecutive wins:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.maxConsecutiveWins} ({stats.maxConsecutiveWinsUsd} USD)</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Max consecutive losses:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.maxConsecutiveLosses} ({stats.maxConsecutiveLossesUsd} USD)</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Recovery factor:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.recoveryFactor}</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Sharpe ratio:</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#0284c7', fontWeight: 'bold' }}>{stats.sharpeRatio}</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Profit factor:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.profitFactor}</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Expected payoff:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.expectedPayoff}</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Monthly growth:</td><td style={{ padding: '5px 0', textAlign: 'right', color: '#16a34a' }}>{stats.monthlyGrowth}%</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Trading activity:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.tradingActivity}%</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Algo trading:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.algoTrading}%</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Max deposit load:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.maxDepositLoad}%</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Latest trade:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.latestTrade}</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Trades per week:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.tradesPerWeek}</td></tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '5px 0', color: '#64748b' }}>Average holding time:</td><td style={{ padding: '5px 0', textAlign: 'right' }}>{stats.avgHoldingTime}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RISKS TAB */}
        {activeTab === 'Risks' && (
          <div style={{ fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '16px', color: '#1e293b', marginRight: '15px' }}>
                  {riskChartMode === 'Deposit load' ? `${maxDepositLoad.toFixed(2)}%` : `${maxDrawdown.toFixed(2)}%`}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  ● {riskChartMode === 'Deposit load' ? 'Deposit load' : 'Drawdown'}
                </span>
                <span style={{ fontSize: '16px', color: '#0284c7', marginLeft: '25px', marginRight: '10px' }}>
                  ${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>● Balance</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => setRiskChartMode('Deposit load')} 
                  style={{ 
                    background: riskChartMode === 'Deposit load' ? '#0284c7' : '#e2e8f0', 
                    color: riskChartMode === 'Deposit load' ? '#fff' : '#475569', 
                    border: 'none', padding: '4px 12px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' 
                  }}
                >
                  Deposit load
                </button>
                <button 
                  onClick={() => setRiskChartMode('Drawdown')} 
                  style={{ 
                    background: riskChartMode === 'Drawdown' ? '#0284c7' : '#e2e8f0', 
                    color: riskChartMode === 'Drawdown' ? '#fff' : '#475569', 
                    border: 'none', padding: '4px 12px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' 
                  }}
                >
                  Drawdown
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', background: '#fff', marginBottom: '25px', position: 'relative' }}>
              {(() => {
                const historyList = riskChartMode === 'Deposit load' ? risks.depositLoadHistory : risks.drawdownHistory;
                const metricKey = riskChartMode === 'Deposit load' ? 'load' : 'drawdown';
                const maxMetric = Math.max(...historyList.map((item: any) => item[metricKey]), 10);
                const minBalance = Math.min(...historyList.map((item: any) => item.balance), initialDeposit * 0.9);
                const maxBalance = Math.max(...historyList.map((item: any) => item.balance), initialDeposit * 1.1);

                return (
                  <svg ref={riskSvgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '180px', overflow: 'visible' }}>
                    {[0, 0.5, 1].map((ratio, idx) => {
                      const y = paddingY + ratio * (svgHeight - paddingY * 2);
                      const balVal = maxBalance - ratio * (maxBalance - minBalance);
                      const metricVal = maxMetric - ratio * maxMetric;
                      return (
                        <g key={idx}>
                          <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                          <text x={paddingX - 8} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                            ${balVal.toFixed(0)}
                          </text>
                          <text x={svgWidth - paddingX + 8} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="start">
                            {metricVal.toFixed(0)}%
                          </text>
                        </g>
                      );
                    })}
                    <polyline 
                      fill="none" 
                      stroke="#0284c7" 
                      strokeWidth="1.5" 
                      points={historyList.map((item: any, idx: number) => `${getX(idx, historyList.length, svgWidth)},${getY(item.balance, minBalance, maxBalance, svgHeight)}`).join(' ')} 
                    />
                    <polyline 
                      fill="none" 
                      stroke="#334155" 
                      strokeWidth="1.5" 
                      points={historyList.map((item: any, idx: number) => `${getX(idx, historyList.length, svgWidth)},${getY(item[metricKey], 0, maxMetric, svgHeight)}`).join(' ')} 
                    />
                  </svg>
                );
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px', paddingLeft: '50px', paddingRight: '50px' }}>
                <span>Aug 2026</span><span>Aug 2026</span><span>Sep 2026</span><span>Sep 2026</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#1e293b', marginBottom: '4px' }}>Best trade: +{risks.bestTrade.toFixed(2)} USD</div>
                <div style={{ display: 'flex', height: '8px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '65%', background: '#16a34a' }}></div>
                  <div style={{ width: '35%', background: '#fdba74' }}></div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#1e293b', marginBottom: '4px' }}>Maximum consecutive wins: {risks.maxConsecutiveWins}</div>
                <div style={{ display: 'flex', height: '8px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '70%', background: '#16a34a' }}></div>
                  <div style={{ width: '30%', background: '#fdba74' }}></div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#1e293b', marginBottom: '4px' }}>Maximal consecutive profit: +{risks.maximalConsecutiveProfit.toFixed(2)} USD</div>
                <div style={{ display: 'flex', height: '8px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '75%', background: '#16a34a' }}></div>
                  <div style={{ width: '25%', background: '#fdba74' }}></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px', fontSize: '11px', color: '#64748b' }}>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#881337' }}>Worst trade: {risks.worstTrade.toFixed(2)} USD</span></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#881337' }}>Maximum consecutive losses: {risks.maxConsecutiveLosses}</span></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#881337' }}>Maximal consecutive loss: {risks.maximalConsecutiveLoss.toFixed(2)} USD</span></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>{risks.mfeMaxProfit.toFixed(2)} USD</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>● MFE (Max. Profit)</div>
              </div>
              <div>
                <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>{risks.avgProfit.toFixed(2)} USD</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>● Avg. Profit</div>
              </div>
              <div>
                <div style={{ fontSize: '15px', color: '#881337', marginBottom: '2px' }}>{risks.avgLoss.toFixed(2)} USD</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>● Avg. Loss</div>
              </div>
              <div>
                <div style={{ fontSize: '15px', color: '#881337', marginBottom: '2px' }}>{risks.maeMaxDd.toFixed(2)} USD</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>● MAE (Max. DD)</div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'Users' && (
          <div style={{ fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Users statistics</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '3px', background: '#fff' }}>
                  <span style={{ width: '8px', height: '8px', background: '#a32a2a', display: 'inline-block' }}></span>
                  <span style={{ color: '#475569', fontSize: '11px' }}>- Users</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '11px' }}>
                <span>Show data period:</span>
                <select 
                  value={subscriptionsPeriod} 
                  onChange={(e) => setSubscriptionsPeriod(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', padding: '3px 6px', borderRadius: '3px', background: '#fff', fontSize: '11px' }}
                >
                  <option value="Last year">Last year</option>
                  <option value="All time">All time</option>
                </select>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', background: '#fff', marginBottom: '25px', position: 'relative' }}>
              <div style={{ fontSize: '10px', color: '#64748b', position: 'absolute', top: '8px', left: '12px' }}>Count</div>
              <div style={{ fontSize: '10px', color: '#64748b', position: 'absolute', bottom: '24px', right: '12px' }}>Date</div>
              
              <svg viewBox={`0 0 ${svgWidth} 140`} style={{ width: '100%', height: '140px', overflow: 'visible', marginTop: '10px' }}>
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = 15 + ratio * 100;
                  return (
                    <line key={idx} x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  );
                })}
                {/* Dynamic/Mock Subscriptions Count Line Graph & Tooltip */}
                {(() => {
                  const subCounts = [0, 0, 0, 0, 0, 0, 0, 1, 3, 5, 8, 12];
                  const maxSub = 15;
                  const pts = subCounts.map((val, i) => {
                    const x = paddingX + (i / (subCounts.length - 1)) * (svgWidth - paddingX * 2);
                    const y = 115 - (val / maxSub) * 100;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline fill="none" stroke="#a32a2a" strokeWidth="2" points={pts} />
                      {subCounts.map((val, i) => {
                        const x = paddingX + (i / (subCounts.length - 1)) * (svgWidth - paddingX * 2);
                        const y = 115 - (val / maxSub) * 100;
                        return <circle key={i} cx={x} cy={y} r="3" fill="#a32a2a" />;
                      })}
                      <g transform="translate(360, 25)">
                        <rect x="0" y="0" width="105" height="18" fill="#fff" stroke="#cbd5e1" rx="2" />
                        <rect x="5" y="6" width="6" height="6" fill="#a32a2a" />
                        <text x="16" y="12" fill="#1e293b" fontSize="9">Current - 12 Users</text>
                      </g>
                    </>
                  );
                })()}
              </svg>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '4px', paddingLeft: '40px', paddingRight: '40px' }}>
                {['Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'].map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
              Income
            </div>

            <div style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', background: '#fff', marginBottom: '25px', position: 'relative' }}>
              <div style={{ fontSize: '10px', color: '#64748b', position: 'absolute', top: '8px', left: '12px' }}>USD</div>
              <div style={{ fontSize: '10px', color: '#64748b', position: 'absolute', bottom: '24px', right: '12px' }}>Date</div>
              
              <svg viewBox={`0 0 ${svgWidth} 140`} style={{ width: '100%', height: '140px', overflow: 'visible', marginTop: '10px' }}>
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = 15 + ratio * 100;
                  return (
                    <line key={idx} x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  );
                })}
                {/* 10x Increased Income Line Graph with Sharp Upward Growth & Volatility */}
                {(() => {
                  const incomeVals = [0, 0, 0, 500, 1800, 1200, 3500, 7500, 11000, 14200, 17500, 18500];
                  const maxInc = 20000;
                  const pts = incomeVals.map((val, i) => {
                    const x = paddingX + (i / (incomeVals.length - 1)) * (svgWidth - paddingX * 2);
                    const y = 115 - (val / maxInc) * 100;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline fill="none" stroke="#16a34a" strokeWidth="2.5" points={pts} />
                      {incomeVals.map((val, i) => {
                        const x = paddingX + (i / (incomeVals.length - 1)) * (svgWidth - paddingX * 2);
                        const y = 115 - (val / maxInc) * 100;
                        return <circle key={i} cx={x} cy={y} r="3.5" fill="#16a34a" />;
                      })}
                      <g transform="translate(340, 25)">
                        <rect x="0" y="0" width="125" height="18" fill="#fff" stroke="#cbd5e1" rx="2" />
                        <rect x="5" y="6" width="6" height="6" fill="#16a34a" />
                        <text x="16" y="12" fill="#1e293b" fontSize="9">Total - $18,500 USD</text>
                      </g>
                    </>
                  );
                })()}
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '4px', paddingLeft: '40px', paddingRight: '40px' }}>
                {['Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'].map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
              Geography of our users
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
              <input type="radio" checked readOnly style={{ accentColor: '#0284c7' }} />
              <span style={{ fontSize: '11px', color: '#1e293b' }}>Users</span>
            </div>

            {/* Realistic Political World Map with Accurate Continental / Country Outlines & Reviewer Locations Marked */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '4px', background: '#fff', textAlign: 'center', minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg
                viewBox="0 0 950 620"
                preserveAspectRatio="xMidYMid meet"
                style={{ display: 'block', width: '100%', maxWidth: '850px', height: 'auto' }}
              >
                <image
                  href="/world-map.svg"
                  x="0"
                  y="0"
                  width="950"
                  height="620"
                  preserveAspectRatio="none"
                  opacity="0.75"
                  style={{ filter: 'invert(90%) sepia(12%) saturate(260%) hue-rotate(75deg) brightness(108%) contrast(82%)' }}
                />
                <g transform={`translate(${mongoliaCenter.x}, ${mongoliaCenter.y})`} opacity="0.175" fill="none" stroke="#bbf7d0" strokeWidth="3">
                  <circle r="7" fill="#dcfce7" stroke="#86efac" strokeWidth="2">
                    <animate attributeName="r" from="7" to="900" dur="7s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="7s" repeatCount="indefinite" />
                  </circle>
                  <circle r="7" opacity="0">
                    <animate attributeName="r" from="7" to="900" dur="7s" begin="2.3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="7s" begin="2.3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="5" fill="#86efac" stroke="#f0fdf4" strokeWidth="2" />
                </g>
                {mapMarkers.map(({ label, latitude, longitude }) => {
                  const { x, y } = toMapPoint(latitude, longitude);
                  return (
                  <g key={label} transform={`translate(${x}, ${y})`}>
                    <circle cx="0" cy="0" r="14" fill="#0284c7" opacity="0.25" />
                    <circle cx="0" cy="0" r="6" fill="#0284c7" stroke="#fff" strokeWidth="2" />
                    <text x="0" y="-12" fill="#0284c7" fontSize="10" fontWeight="bold" textAnchor="middle">{label}</text>
                  </g>
                  );
                })}
              </svg>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
                📍 Pins indicate active review locations and subscriber distribution across realistic world political regions.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Description' && (
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold', color: '#0284c7' }}>About GoldMaster Expert Advisor</p>
            
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚙️</span> Architecture & Value
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Operational Principle:</strong> The algorithm functions as an automated trading system on the MetaTrader 5 (MT5) platform, executing market operations based on precise, pre-programmed technical rules without manual emotional interference. It processes high-volatility asset price action smoothly, maintaining low drawdown metrics and stable execution even during sudden market spikes.
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Theoretical Foundation:</strong> The strategy is built upon structured risk management principles, prioritizing predefined Stop Loss (SL) and Take Profit (TP) levels for every position. By combining mathematically rigorous backtesting models with live execution precision, the algorithm minimizes human cognitive bias and relies on systematic quantitative parameters.
            </p>
            <p style={{ margin: '0 0 16px 0' }}>
              <strong>Core Value Proposition for Traders:</strong> Users select this solution for its robust code architecture, low historical drawdown, and reliable performance on demanding instruments like XAUUSD. Furthermore, active developer engagement through community channels ensures rapid troubleshooting, seamless setup guidance, and continuous maintenance.
            </p>

            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#0284c7' }}>For more detailed information, please check the following links:</p>
            <ul style={{ margin: '0 0 0 20px', padding: '0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📥</span>
                <a href="https://www.mql5.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                  Instructions for downloading the demo version and running backtests.
                </a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👥</span>
                <a href="https://www.mql5.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                  Guide on how to copy trade by following Bayarsaikhan.
                </a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖</span>
                <a href="https://www.mql5.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                  Instructions for renting and operating the Gold Master robot.
                </a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📖</span>
                <a href="https://www.mql5.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                  Purchasing the book &quot;Freedom Algorithm&quot; written by Mr. Bayarsaikhan.
                </a>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div style={{ fontSize: '13px', color: '#1e293b' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Review 1 */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                    RT
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Richard Thibodeau</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>2026.09.04 02:28</span>
                        <span style={{ color: '#eab308', fontSize: '12px' }}>★ 5.0</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>North America (USA)</span>
                    </div>
                    <p style={{ margin: '4px 0', color: '#334155', lineHeight: '1.5' }}>
                      Purchased GoldMaster on the very first day as I trust BJ&apos;s skills 100% Very good so far, will be back in a few weeks to edit my review if it was wrong. Thanks, Sir BJ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                    HM
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Hans Mueller</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>2026.09.03 19:45</span>
                        <span style={{ color: '#eab308', fontSize: '12px' }}>★ 5.0</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Europe (Germany)</span>
                    </div>
                    <p style={{ margin: '4px 0', color: '#334155', lineHeight: '1.5' }}>
                      Excellent First Impression - GoldMaster EA. I purchased this EA just yesterday, and today it already delivered its first profitable trade. I really like the way it approaches trading, especially the use of clearly defined Stop Loss and Take Profit levels, which gives me confidence in its structured risk management. Outstanding performance!
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 3 */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                    KT
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Kenji Takahashi</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>2026.09.02 12:10</span>
                        <span style={{ color: '#eab308', fontSize: '12px' }}>★ 5.0</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Asia (Japan)</span>
                    </div>
                    <p style={{ margin: '4px 0', color: '#334155', lineHeight: '1.5' }}>
                      Very stable execution on XAUUSD. Gold trading is notoriously difficult due to high volatility, but this algorithm handles market spikes smoothly. Low drawdown and consistent gains over the past week. Highly recommended for serious traders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 4 */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                    LS
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Lucas Silva</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>2026.09.01 08:30</span>
                        <span style={{ color: '#eab308', fontSize: '12px' }}>★ 5.0</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>South America (Brazil)</span>
                    </div>
                    <p style={{ margin: '4px 0', color: '#334155', lineHeight: '1.5' }}>
                      Amazing support and robust code architecture. Tested it on a demo account first and now running live. The developer is very active and answers questions promptly. Great addition to my portfolio!
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 5 */}
              <div style={{ paddingBottom: '5px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                    LN
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0284c7' }}>Liam Ndlovu</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>2026.08.30 15:20</span>
                        <span style={{ color: '#eab308', fontSize: '12px' }}>★ 5.0</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Africa (South Africa)</span>
                    </div>
                    <p style={{ margin: '4px 0', color: '#334155', lineHeight: '1.5' }}>
                      Clean setup instructions and excellent performance on MT5. The backtests matched the initial live results closely. Truly impressed by the precision of this automated strategy.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}