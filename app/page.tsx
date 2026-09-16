'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from './theme-provider';

const formatMoney = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export default function Mql5SignalDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredCountry, setRegisteredCountry] = useState('');
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

  if (loading) return <div className={`p-10 text-center font-sans ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>Loading Signal Data...</div>;
  if (errorMsg) return <div className={`p-10 text-center font-sans ${isDark ? 'bg-slate-950 text-rose-400' : 'bg-slate-100 text-red-600'}`}><h2 className="text-lg font-bold">API Error</h2><p>{errorMsg}</p></div>;

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

  const countryCenters: Record<string, { latitude: number; longitude: number }> = {
    mongolia: { latitude: 46.8625, longitude: 103.8467 },
    'united states': { latitude: 39.8283, longitude: -98.5795 },
    usa: { latitude: 39.8283, longitude: -98.5795 },
    'u.s.': { latitude: 39.8283, longitude: -98.5795 },
    germany: { latitude: 51.1657, longitude: 10.4515 },
    japan: { latitude: 36.2048, longitude: 138.2529 },
    brazil: { latitude: -14.235, longitude: -51.9253 },
    'south africa': { latitude: -30.5595, longitude: 22.9375 },
    canada: { latitude: 56.1304, longitude: -106.3468 },
    australia: { latitude: -25.2744, longitude: 133.7751 },
    uk: { latitude: 55.3781, longitude: -3.436 },
    'united kingdom': { latitude: 55.3781, longitude: -3.436 },
    france: { latitude: 46.2276, longitude: 2.2137 },
  };

  const normalizeGeoKey = (value: string) => value
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const resolveGeoPoint = (countryName: string) => {
    const normalized = normalizeGeoKey(countryName || 'Mongolia');
    const aliases: Record<string, string> = {
      us: 'united states',
      'united states of america': 'united states',
      'southafrica': 'south africa',
      mongolian: 'mongolia',
      'монгол': 'mongolia',
      'монгол улс': 'mongolia',
    };

    const key = aliases[normalized] || normalized;
    return countryCenters[key] || countryCenters.mongolia;
  };

  const mapMarkers = [
    { label: 'Richard', country: 'United States' },
    { label: 'Hans', country: 'Germany' },
    { label: 'Kenji', country: 'Japan' },
    { label: 'Lucas', country: 'Brazil' },
    { label: 'Liam', country: 'South Africa' },
  ].map((marker) => ({ ...marker, ...resolveGeoPoint(marker.country) }));

  const MAP_WIDTH = 950;
  const MAP_HEIGHT = 620;
  const toMapPoint = (latitude: number, longitude: number) => ({
    x: Math.min(Math.max(((longitude + 180) / 360) * MAP_WIDTH, 0), MAP_WIDTH),
    y: Math.min(Math.max(((90 - latitude) / 180) * MAP_HEIGHT, 0), MAP_HEIGHT),
  });

  const registeredCenter = resolveGeoPoint(registeredCountry || 'Mongolia');
  const registeredMapPoint = toMapPoint(registeredCenter.latitude, registeredCenter.longitude);

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
    <div className={`min-h-screen font-sans p-2 sm:p-4 transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <div className={`max-w-7xl mx-auto p-3 sm:p-5 rounded-md border shadow-sm transition-colors duration-200 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        
        {/* Header Section */}
        <div className={`border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full md:w-auto">
              <img src={isDark ? '/goldmaster-logo-dark.png' : '/goldmaster-logo.png'} alt="GoldMaster logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
              <span className={`text-base sm:text-xl font-semibold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>IF YOU WANT LONG TERM STABLE PROFITS, JOIN US.</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button type="button" onClick={() => { window.location.href = '/signin'; }} className="flex-1 sm:flex-none bg-transparent border border-green-500 text-green-500 px-4 py-2 rounded font-semibold text-sm hover:bg-green-500/10 transition">Sign in</button>
              <button type="button" onClick={() => { window.location.href = '/login'; }} className="flex-1 sm:flex-none bg-green-600 border border-green-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-green-700 transition">Log in</button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-4 text-xs sm:text-sm">
            <strong className={`w-full text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{data?.name || 'Result of GoldMaster Expert Advisor'}</strong>                        
            <img src="/mongolia-flag.png" alt="Mongolian flag" className="w-7 h-4 object-contain rounded-sm" />
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Owner: {data?.author || 'BJ Janchiv'}</span>
            <span className="text-yellow-500 text-base">★★★★★</span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{data?.reviewsCount ?? 0} reviews</span>
            <span className="text-green-500 font-medium">■■■ Reliability</span>
            <span className="text-green-500 font-medium">{data?.reliability || '1 week'}</span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>👥 {data?.subscribersCount || '0 / 0 USD'}</span>
          </div>
        </div>

        {/* Financial Overview & Weekly Account Change Layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-[1.2fr_260px_280px] gap-5 items-start border-b pb-5 mb-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <div className="flex items-baseline gap-3 mb-3 flex-wrap">
              <div className={`text-sm capitalize ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{growthLabel}</div>
              <div className="text-2xl font-bold text-green-500">
                +{growthPercent.toFixed(2)}%
              </div>
            </div>
            
            <div className={`border rounded p-3 w-full min-h-[110px] flex flex-col justify-between shadow-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'}`}>
              <div className={`text-xs font-medium mb-2 text-left ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                Weekly Account Change
              </div>
              
              <div className="flex items-center gap-1 h-[65px] overflow-x-auto w-full pb-1">
                {weeklyData.map((w: any, idx: number) => {
                  const hasData = w.change !== null && w.change !== 0;
                  const maxWeeklyVal = Math.max(...weeklyData.map((d: any) => Math.abs(d.change || 0)), 1);
                  const barHeight = hasData ? Math.min(Math.max((Math.abs(w.change) / maxWeeklyVal) * 26, 3), 26) : 0;
                  const isPositive = (w.change || 0) >= 0;
                  
                  return (
                    <div 
                      key={idx} 
                      title={hasData ? `Week ${w.week}: $${w.change}` : `Week ${w.week}: No data`} 
                      className="flex flex-col justify-center h-full w-2 flex-shrink-0 cursor-pointer"
                    >
                      <div className="h-[30px] flex items-end">
                        {isPositive && hasData && (
                          <div className="w-2 bg-green-500 rounded-2xs" style={{ height: `${barHeight}px` }} />
                        )}
                      </div>
                      <div className={`h-px w-full ${isDark ? 'bg-slate-700' : 'bg-slate-400'}`} />
                      <div className="h-[30px] flex items-start">
                        {!isPositive && hasData && (
                          <div className="w-2 bg-rose-500 rounded-2xs" style={{ height: `${barHeight}px` }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 items-center mt-3 text-xs">
              <span className={`font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{data?.broker}</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{data?.leverage}</span>
            </div>
          </div>

          <div className={`border rounded p-3 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <div className={`text-xs text-center font-medium mb-2 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
              Algo trading: {algoTrading}%
            </div>
            <table className={`w-full text-xs border-collapse ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <tbody>
                <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}><td className="py-1">Maximum drawdown:</td><td className={`py-1 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{maxDrawdown}%</td></tr>
                <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}><td className="py-1">Profit Trades:</td><td className="py-1 text-right font-medium text-green-500">{profitTrades}%</td></tr>
                <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}><td className="py-1">Max deposit load:</td><td className={`py-1 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{maxDepositLoad}%</td></tr>
                <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}><td className="py-1">Loss Trades:</td><td className="py-1 text-right font-medium text-rose-500">{lossTrades}%</td></tr>
                <tr><td colSpan={2} className={`py-1.5 text-center font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Trading activity: {tradingActivity}%</td></tr>
              </tbody>
            </table>
          </div>

          {(() => {
            const maxVal = Math.max(equity, initialDeposit, Math.abs(profit));
            const equityWidth = maxVal > 0 ? `${(equity / maxVal) * 100}%` : '0%';
            const profitWidth = maxVal > 0 ? `${(Math.abs(profit) / maxVal) * 100}%` : '0%';
            const depositWidth = maxVal > 0 ? `${(initialDeposit / maxVal) * 100}%` : '0%';

            return (
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Equity</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="h-full bg-sky-500" style={{ width: equityWidth }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>Profit</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-green-500' : 'text-rose-500'}`}>${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className={`h-full ${profit >= 0 ? 'bg-green-500' : 'bg-rose-500'}`} style={{ width: profitWidth }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Initial Deposit</span>
                    <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>${initialDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="h-full bg-sky-500" style={{ width: depositWidth }}></div>
                  </div>
                </div>

                <div className={`flex justify-between pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Withdrawals</span><span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatMoney(withdrawals)} USD</span>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Deposits</span><span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatMoney(deposits)} USD</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Navigation Tabs */}
        <div className={`flex gap-4 sm:gap-6 border-b mb-4 text-xs sm:text-sm overflow-x-auto whitespace-nowrap ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          {['Balance', 'History', 'Statistics', 'Risks', 'Users', 'Description', 'Reviews'].map((tab) => (
            <span
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 cursor-pointer font-medium transition ${
                activeTab === tab 
                  ? `${isDark ? 'text-sky-400 border-b-2 border-sky-400' : 'text-sky-600 border-b-2 border-sky-600'}` 
                  : `${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`
              }`}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'Balance' && (
          <div>
            <div className="mb-5 overflow-x-auto">
              <table className={`w-full border-collapse text-xs text-left min-w-[650px] ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="p-2">Symbol</th>
                    <th className="p-2">Time</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Volume</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">S/L</th>
                    <th className="p-2">T/P</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Swap</th>
                    <th className="p-2 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.positions?.map((pos: any, idx: number) => (
                    <tr key={idx} className={`border-b ${isDark ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className="p-2 font-medium">{pos.symbol}</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pos.time}</td>
                      <td className={`p-2 font-medium ${pos.type === 'Buy' ? 'text-sky-400' : 'text-rose-400'}`}>{pos.type}</td>
                      <td className="p-2">{pos.volume}</td>
                      <td className="p-2">{pos.openPrice}</td>
                      <td className="p-2">{pos.stopLoss}</td>
                      <td className="p-2">{pos.takeProfit}</td>
                      <td className="p-2">{pos.currentPrice}</td>
                      <td className="p-2">{formatMoney(pos.swap)}</td>
                      <td className={`p-2 text-right font-medium ${pos.profit >= 0 ? 'text-green-500' : 'text-rose-500'}`}>
                        {formatMoney(pos.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-5">
              <div className="flex justify-end gap-2 mb-2">
                <button onClick={() => setChartType('Growth')} className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${chartType === 'Growth' ? 'bg-sky-600 text-white' : `${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}`}>Growth</button>
                <button onClick={() => setChartType('Balance')} className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${chartType === 'Balance' ? 'bg-sky-600 text-white' : `${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}`}>Balance</button>
              </div>

              <div className={`border p-3 rounded relative overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <svg 
                  ref={svgRef}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                  className="w-full h-[180px] min-w-[500px] overflow-visible cursor-crosshair"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {[0, 0.5, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * (svgHeight - paddingY * 2);
                    const val = maxVal - ratio * (maxVal - minVal);
                    return (
                      <g key={idx}>
                        <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
                        <text x={paddingX - 8} y={y + 4} fill={isDark ? '#94a3b8' : '#94a3b8'} fontSize="10" textAnchor="end">
                          {chartType === 'Growth' ? `${val.toFixed(2)}%` : formatMoney(val)}
                        </text>
                      </g>
                    );
                  })}
                  <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points={points} />
                </svg>
                <div className={`flex justify-between text-[10px] mt-1 px-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'History' && (
          <div className="overflow-x-auto mb-4">
            <table className={`w-full border-collapse text-xs text-left min-w-[700px] ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="p-2">Time</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Volume</th>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Commission</th>
                  <th className="p-2">Swap</th>
                  <th className="p-2 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data?.history?.map((h: any, i: number) => {
                  const isDeal = h.type === 'Buy' || h.type === 'Sell';
                  return (
                    <tr key={i} className={`border-b ${isDark ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h.openTime}</td>
                      <td className={`p-2 font-medium ${h.type === 'Buy' ? 'text-sky-400' : h.type === 'Sell' ? 'text-rose-400' : `${isDark ? 'text-slate-300' : 'text-slate-600'}`}`}>{h.type}</td>
                      <td className="p-2">{h.volume || ''}</td>
                      <td className="p-2">{h.symbol || ''}</td>
                      <td className="p-2">{h.openPrice || ''}</td>
                      <td className={`p-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h.closeTime}</td>
                      <td className="p-2">{isDeal ? h.closePrice : ''}</td>
                      <td className="p-2">{h.commission ? formatMoney(h.commission) : ''}</td>
                      <td className="p-2">{h.swap ? formatMoney(h.swap) : ''}</td>
                      <td className={`p-2 text-right font-medium ${h.profit >= 0 ? 'text-green-500' : 'text-rose-500'}`}>
                        {h.profit !== undefined && h.profit !== null ? formatMoney(h.profit) : ''}
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
          <div className="text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trades</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.trades ?? 0}</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Profit trades (%):</td><td className="py-1.5 text-right font-medium text-green-500">{stats?.profitTradesCount ?? 0} ({stats?.profitTradesPercent ?? 0}%)</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loss trades (%):</td><td className="py-1.5 text-right font-medium text-rose-500">{stats?.lossTradesCount ?? 0} ({stats?.lossTradesPercent ?? 0}%)</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Best trade:</td><td className="py-1.5 text-right font-medium text-green-500">{stats?.bestTrade ?? 0} USD</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Worst trade:</td><td className="py-1.5 text-right font-medium text-rose-500">{stats?.worstTrade ?? 0} USD</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross profit:</td><td className="py-1.5 text-right font-medium text-green-500">{stats?.grossProfit ?? 0} ({stats?.grossProfitPips ?? 0} pips)</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross loss:</td><td className="py-1.5 text-right font-medium text-rose-500">{stats?.grossLoss ?? 0} ({stats?.grossLossPips ?? 0} pips)</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Max consecutive wins:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.maxConsecutiveWins ?? 0} ({stats?.maxConsecutiveWinsUsd ?? 0} USD)</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Max consecutive losses:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.maxConsecutiveLosses ?? 0} ({stats?.maxConsecutiveLossesUsd ?? 0} USD)</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recovery factor:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.recoveryFactor ?? 0}</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sharpe ratio:</td><td className="py-1.5 text-right font-bold text-sky-400">{stats?.sharpeRatio ?? 0}</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Profit factor:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.profitFactor ?? 0}</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Expected payoff:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.expectedPayoff ?? 0}</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Monthly growth:</td><td className="py-1.5 text-right font-medium text-green-500">{stats?.monthlyGrowth ?? 0}%</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trading activity:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.tradingActivity ?? 0}%</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Algo trading:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.algoTrading ?? 0}%</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Max deposit load:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.maxDepositLoad ?? 0}%</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Latest trade:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.latestTrade ?? '-'}</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trades per week:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.tradesPerWeek ?? 0}</td></tr>
                    <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><td className={`py-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Average holding time:</td><td className={`py-1.5 text-right font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stats?.avgHoldingTime ?? '-'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RISKS TAB */}
        {activeTab === 'Risks' && (
          <div className="text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <div>
                <span className={`text-base font-bold mr-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {riskChartMode === 'Deposit load' ? `${maxDepositLoad.toFixed(2)}%` : `${maxDrawdown.toFixed(2)}%`}
                </span>
                <span className={`text-xs mr-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ● {riskChartMode === 'Deposit load' ? 'Deposit load' : 'Drawdown'}
                </span>
                <span className="text-base font-bold text-sky-400 mr-2">
                  ${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>● Balance</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setRiskChartMode('Deposit load')} 
                  className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${riskChartMode === 'Deposit load' ? 'bg-sky-600 text-white' : `${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}`}
                >
                  Deposit load
                </button>
                <button 
                  onClick={() => setRiskChartMode('Drawdown')} 
                  className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${riskChartMode === 'Drawdown' ? 'bg-sky-600 text-white' : `${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}`}
                >
                  Drawdown
                </button>
              </div>
            </div>

            <div className={`border p-3 rounded mb-6 relative overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              {(() => {
                const historyList = (riskChartMode === 'Deposit load' ? risks?.depositLoadHistory : risks?.drawdownHistory) || [];
                const metricKey = riskChartMode === 'Deposit load' ? 'load' : 'drawdown';
                const maxMetric = historyList.length > 0 ? Math.max(...historyList.map((item: any) => item?.[metricKey] ?? 0), 10) : 10;
                const minBalance = historyList.length > 0 ? Math.min(...historyList.map((item: any) => item?.balance ?? initialDeposit), initialDeposit * 0.9) : initialDeposit * 0.9;
                const maxBalance = historyList.length > 0 ? Math.max(...historyList.map((item: any) => item?.balance ?? initialDeposit), initialDeposit * 1.1) : initialDeposit * 1.1;

                return (
                  <svg ref={riskSvgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-[180px] min-w-[500px] overflow-visible">
                    {[0, 0.5, 1].map((ratio, idx) => {
                      const y = paddingY + ratio * (svgHeight - paddingY * 2);
                      const balVal = maxBalance - ratio * (maxBalance - minBalance);
                      const metricVal = maxMetric - ratio * maxMetric;
                      return (
                        <g key={idx}>
                          <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
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
                      stroke="#38bdf8" 
                      strokeWidth="1.5" 
                      points={historyList.map((item: any, idx: number) => `${getX(idx, historyList.length, svgWidth)},${getY(item?.balance ?? 0, minBalance, maxBalance, svgHeight)}`).join(' ')} 
                    />
                    <polyline 
                      fill="none" 
                      stroke={isDark ? '#94a3b8' : '#334155'} 
                      strokeWidth="1.5" 
                      points={historyList.map((item: any, idx: number) => `${getX(idx, historyList.length, svgWidth)},${getY(item?.[metricKey] ?? 0, 0, maxMetric, svgHeight)}`).join(' ')} 
                    />
                  </svg>
                );
              })()}
              <div className={`flex justify-between text-[10px] mt-1 px-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Aug 2026</span><span>Aug 2026</span><span>Sep 2026</span><span>Sep 2026</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Best trade: +{(risks?.bestTrade ?? 0).toFixed(2)} USD</div>
                <div className={`flex h-2 rounded-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div className="w-[65%] bg-green-500"></div>
                  <div className="w-[35%] bg-amber-400"></div>
                </div>
              </div>
              <div>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Maximum consecutive wins: {risks?.maxConsecutiveWins ?? 0}</div>
                <div className={`flex h-2 rounded-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div className="w-[70%] bg-green-500"></div>
                  <div className="w-[30%] bg-amber-400"></div>
                </div>
              </div>
              <div>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Maximal consecutive profit: +{(risks?.maximalConsecutiveProfit ?? 0).toFixed(2)} USD</div>
                <div className={`flex h-2 rounded-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div className="w-[75%] bg-green-500"></div>
                  <div className="w-[25%] bg-amber-400"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-[11px]">
              <div className="sm:text-right"><span className="text-rose-500 font-medium">Worst trade: {(risks?.worstTrade ?? 0).toFixed(2)} USD</span></div>
              <div className="sm:text-right"><span className="text-rose-500 font-medium">Maximum consecutive losses: {risks?.maxConsecutiveLosses ?? 0}</span></div>
              <div className="sm:text-right"><span className="text-rose-500 font-medium">Maximal consecutive loss: {(risks?.maximalConsecutiveLoss ?? 0).toFixed(2)} USD</span></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className={`text-sm font-bold mb-0.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{(risks?.mfeMaxProfit ?? 0).toFixed(2)} USD</div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>● MFE (Max. Profit)</div>
              </div>
              <div>
                <div className={`text-sm font-bold mb-0.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{(risks?.avgProfit ?? 0).toFixed(2)} USD</div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>● Avg. Profit</div>
              </div>
              <div>
                <div className="text-sm font-bold text-rose-500 mb-0.5">{(risks?.avgLoss ?? 0).toFixed(2)} USD</div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>● Avg. Loss</div>
              </div>
              <div>
                <div className="text-sm font-bold text-rose-500 mb-0.5">{(risks?.maeMaxDd ?? 0).toFixed(2)} USD</div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>● MAE (Max. DD)</div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'Users' && (
          <div className="text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Users statistics</span>
                <div className={`flex items-center gap-1.5 border px-2 py-0.5 rounded ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-600'}`}>
                  <span className="w-2 h-2 bg-rose-500 inline-block"></span>
                  <span className="text-[11px]">- Users</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span>Show data period:</span>
                <select 
                  value={subscriptionsPeriod} 
                  onChange={(e) => setSubscriptionsPeriod(e.target.value)}
                  className={`border px-2 py-1 rounded text-xs ${isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                >
                  <option value="Last year">Last year</option>
                  <option value="All time">All time</option>
                </select>
              </div>
            </div>

            <div className={`border p-3 rounded mb-6 relative overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-[10px] text-slate-400 absolute top-2 left-3">Count</div>
              <div className="text-[10px] text-slate-400 absolute bottom-6 right-3">Date</div>
              
              <svg viewBox={`0 0 ${svgWidth} 140`} className="w-full h-[140px] min-w-[500px] overflow-visible mt-2">
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = 15 + ratio * 100;
                  return (
                    <line key={idx} x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
                  );
                })}
                {(() => {
                  const periods = (subscriptions?.periods && subscriptions.periods.length > 0) ? subscriptions.periods : [
                    { month: "Sep 2025", count: 0, income: 0 },
                    { month: "Oct 2025", count: 0, income: 0 },
                    { month: "Nov 2025", count: 0, income: 0 },
                    { month: "Dec 2025", count: 0, income: 0 },
                    { month: "Jan 2026", count: 0, income: 0 },
                    { month: "Feb 2026", count: 0, income: 0 },
                    { month: "Mar 2026", count: 0, income: 0 },
                    { month: "Apr 2026", count: 0, income: 0 },
                    { month: "May 2026", count: 0, income: 0 },
                    { month: "Jun 2026", count: 0, income: 0 },
                    { month: "Jul 2026", count: 0, income: 0 },
                    { month: "Aug 2026", count: 0, income: 0 },
                    { month: "Sep 2026", count: 0, income: 0 }
                  ];

                  const subCounts = periods.map((p: any) => p?.count ?? 0);
                  const maxSub = Math.max(...subCounts, 1);
                  const currentCount = subCounts[subCounts.length - 1] ?? 0;
                  const pts = subCounts.map((val: number, i: number) => {
                    const x = paddingX + (i / (subCounts.length - 1 || 1)) * (svgWidth - paddingX * 2);
                    const y = 115 - (val / maxSub) * 100;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline fill="none" stroke="#f43f5e" strokeWidth="2" points={pts} />
                      {subCounts.map((val: number, i: number) => {
                        const x = paddingX + (i / (subCounts.length - 1 || 1)) * (svgWidth - paddingX * 2);
                        const y = 115 - (val / maxSub) * 100;
                        return <circle key={i} cx={x} cy={y} r="3" fill="#f43f5e" />;
                      })}
                      <g transform="translate(350, 25)">
                        <rect x="0" y="0" width="115" height="18" fill={isDark ? '#0f172a' : '#fff'} stroke={isDark ? '#334155' : '#cbd5e1'} rx="2" />
                        <rect x="5" y="6" width="6" height="6" fill="#f43f5e" />
                        <text x="16" y="12" fill={isDark ? '#f1f5f9' : '#1e293b'} fontSize="9">Current - {currentCount} Users</text>
                      </g>
                    </>
                  );
                })()}
              </svg>
              
              <div className={`flex justify-between text-[9px] mt-1 px-10 overflow-x-auto gap-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {((subscriptions?.periods && subscriptions.periods.length > 0) ? subscriptions.periods : [
                  { month: "Sep 2025" }, { month: "Oct 2025" }, { month: "Nov 2025" }, { month: "Dec 2025" },
                  { month: "Jan 2026" }, { month: "Feb 2026" }, { month: "Mar 2026" }, { month: "Apr 2026" },
                  { month: "May 2026" }, { month: "Jun 2026" }, { month: "Jul 2026" }, { month: "Aug 2026" }, { month: "Sep 2026" }
                ]).map((p: any, i: number) => (
                  <span key={i} className="flex-shrink-0">{p?.month || ''}</span>
                ))}
              </div>
            </div>

            <div className={`text-center text-sm font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Income
            </div>

            <div className={`border p-3 rounded mb-6 relative overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-[10px] text-slate-400 absolute top-2 left-3">USD</div>
              <div className="text-[10px] text-slate-400 absolute bottom-6 right-3">Date</div>
              
              <svg viewBox={`0 0 ${svgWidth} 140`} className="w-full h-[140px] min-w-[500px] overflow-visible mt-2">
                {[0, 0.5, 1].map((ratio, idx) => {
                  const y = 15 + ratio * 100;
                  return (
                    <line key={idx} x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
                  );
                })}
                {(() => {
                  const periods = (subscriptions?.periods && subscriptions.periods.length > 0) ? subscriptions.periods : [
                    { month: "Sep 2025", count: 0, income: 0 },
                    { month: "Oct 2025", count: 0, income: 0 },
                    { month: "Nov 2025", count: 0, income: 0 },
                    { month: "Dec 2025", count: 0, income: 0 },
                    { month: "Jan 2026", count: 0, income: 0 },
                    { month: "Feb 2026", count: 0, income: 0 },
                    { month: "Mar 2026", count: 0, income: 0 },
                    { month: "Apr 2026", count: 0, income: 0 },
                    { month: "May 2026", count: 0, income: 0 },
                    { month: "Jun 2026", count: 0, income: 0 },
                    { month: "Jul 2026", count: 0, income: 0 },
                    { month: "Aug 2026", count: 0, income: 0 },
                    { month: "Sep 2026", count: 0, income: 0 }
                  ];

                  const incomeVals = periods.map((p: any) => p?.income ?? 0);
                  const maxInc = Math.max(...incomeVals, 100);
                  const totalIncome = incomeVals.reduce((acc: number, val: number) => acc + val, 0);
                  const pts = incomeVals.map((val: number, i: number) => {
                    const x = paddingX + (i / (incomeVals.length - 1 || 1)) * (svgWidth - paddingX * 2);
                    const y = 115 - (val / maxInc) * 100;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" points={pts} />
                      {incomeVals.map((val: number, i: number) => {
                        const x = paddingX + (i / (incomeVals.length - 1 || 1)) * (svgWidth - paddingX * 2);
                        const y = 115 - (val / maxInc) * 100;
                        return <circle key={i} cx={x} cy={y} r="3.5" fill="#22c55e" />;
                      })}
                      <g transform="translate(330, 25)">
                        <rect x="0" y="0" width="135" height="18" fill={isDark ? '#0f172a' : '#fff'} stroke={isDark ? '#334155' : '#cbd5e1'} rx="2" />
                        <rect x="5" y="6" width="6" height="6" fill="#22c55e" />
                        <text x="16" y="12" fill={isDark ? '#f1f5f9' : '#1e293b'} fontSize="9">Total - ${totalIncome.toLocaleString()} USD</text>
                      </g>
                    </>
                  );
                })()}
              </svg>

              <div className={`flex justify-between text-[9px] mt-1 px-10 overflow-x-auto gap-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {((subscriptions?.periods && subscriptions.periods.length > 0) ? subscriptions.periods : [
                  { month: "Sep 2025" }, { month: "Oct 2025" }, { month: "Nov 2025" }, { month: "Dec 2025" },
                  { month: "Jan 2026" }, { month: "Feb 2026" }, { month: "Mar 2026" }, { month: "Apr 2026" },
                  { month: "May 2026" }, { month: "Jun 2026" }, { month: "Jul 2026" }, { month: "Aug 2026" }, { month: "Sep 2026" }
                ]).map((p: any, i: number) => (
                  <span key={i} className="flex-shrink-0">{p?.month || ''}</span>
                ))}
              </div>
            </div>

            <div className={`text-center text-sm font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Geography of our users
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              <input type="radio" checked readOnly className="accent-sky-500" />
              <span className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Users</span>
            </div>

            <div className={`border p-4 rounded text-center min-h-[380px] flex flex-col items-center justify-center relative overflow-hidden ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <svg
                viewBox="0 0 950 620"
                preserveAspectRatio="xMidYMid meet"
                className="block w-full max-w-[850px] h-auto"
              >
                <image
                  href="/world-map.svg"
                  x="0"
                  y="0"
                  width="950"
                  height="620"
                  preserveAspectRatio="xMidYMid meet"
                  opacity={isDark ? '0.45' : '0.75'}
                  style={{ filter: isDark ? 'invert(92%) sepia(8%) saturate(300%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'invert(90%) sepia(12%) saturate(260%) hue-rotate(75deg) brightness(108%) contrast(82%)' }}
                />
                <g transform={`translate(${registeredMapPoint.x}, ${registeredMapPoint.y})`} opacity="0.175" fill="none" stroke={isDark ? '#38bdf8' : '#86efac'} strokeWidth="3">
                  <circle r="7" fill={isDark ? '#0284c7' : '#dcfce7'} stroke={isDark ? '#38bdf8' : '#86efac'} strokeWidth="2">
                    <animate attributeName="r" from="7" to="900" dur="7s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="7s" repeatCount="indefinite" />
                  </circle>
                  <circle r="7" opacity="0">
                    <animate attributeName="r" from="7" to="900" dur="7s" begin="2.3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="7s" begin="2.3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                </g>
                <g transform={`translate(${registeredMapPoint.x}, ${registeredMapPoint.y})`}>
                  <circle r="10" fill="#38bdf8" opacity="0.35" />
                  <circle r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
                  <text x="0" y="-8" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle">You</text>
                </g>
                {mapMarkers.map(({ label, latitude, longitude }) => {
                  const { x, y } = toMapPoint(latitude, longitude);
                  return (
                  <g key={label} transform={`translate(${x}, ${y})`}>
                    <circle cx="0" cy="0" r="10" fill="#38bdf8" opacity="0.35" />
                    <circle cx="0" cy="0" r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
                    <text x="0" y="-8" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle">{label}</text>
                  </g>
                  );
                })}
              </svg>
              <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                📍 Pins indicate active review locations and subscriber distribution across realistic world political regions.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Description' && (
          <div className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p className="mb-3 text-base font-bold text-sky-400">About GoldMaster Expert Advisor</p>
            
            <p className="mb-1 font-bold text-sky-400 flex items-center gap-1.5">
              <span>⚙️</span> Architecture & Value
            </p>
            <p className="mb-2">
              <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>Operational Principle:</strong> The algorithm functions as an automated trading system on the MetaTrader 5 (MT5) platform, executing market operations based on precise, pre-programmed technical rules without manual emotional interference. It processes high-volatility asset price action smoothly, maintaining low drawdown metrics and stable execution even during sudden market spikes.
            </p>
            <p className="mb-2">
              <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>Theoretical Foundation:</strong> The strategy is built upon structured risk management principles, prioritizing predefined Stop Loss (SL) and Take Profit (TP) levels for every position. By combining mathematically rigorous backtesting models with live execution precision, the algorithm minimizes human cognitive bias and relies on systematic quantitative parameters.
            </p>
            <p className="mb-4">
              <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>Core Value Proposition for Traders:</strong> Users select this solution for its robust code architecture, low historical drawdown, and reliable performance on demanding instruments like XAUUSD. Furthermore, active developer engagement through community channels ensures rapid troubleshooting, seamless setup guidance, and continuous maintenance.
            </p>

            <p className={`mb-2 font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>For more detailed information, please check the following links:</p>
            <ul className="list-none pl-0 flex flex-col gap-1.5">
              <li className="flex items-center gap-1.5">
                <span>📥</span>
                <a href="/guides?guide=backtests" className="text-sky-400 underline hover:text-sky-300">
                  Instructions for downloading the demo version and running backtests.
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <span>👥</span>
                <a href="/guides?guide=copy-trading" className="text-sky-400 underline hover:text-sky-300">
                  Guide on how to copy trade by following BJ.
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <span>🤖</span>
                <a href="/guides?guide=ea-rental" className="text-sky-400 underline hover:text-sky-300">
                  Instructions for renting and operating the Gold Master robot.
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <span>📖</span>
                <a href="/guides?guide=freedom-algorithm" className="text-sky-400 underline hover:text-sky-300">
                  Purchasing the book &quot;Freedom Algorithm&quot; written by Mr. BJ.
                </a>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <div className="flex flex-col gap-5">
              
              {/* Review 1 */}
              <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-300 text-white'}`}>
                    RT
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sky-400">Richard Thibodeau</span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2026.09.04 02:28</span>
                        <span className="text-yellow-500 text-xs">★ 5.0</span>
                      </div>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>North America (USA)</span>
                    </div>
                    <p className={`my-1 leading-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Purchased GoldMaster on the very first day as I trust BJ&apos;s skills 100% Very good so far, will be back in a few weeks to edit my review if it was wrong. Thanks, Sir BJ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-300 text-white'}`}>
                    HM
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sky-400">Hans Mueller</span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2026.09.03 19:45</span>
                        <span className="text-yellow-500 text-xs">★ 5.0</span>
                      </div>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Europe (Germany)</span>
                    </div>
                    <p className={`my-1 leading-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Excellent First Impression - GoldMaster EA. I purchased this EA just yesterday, and today it already delivered its first profitable trade. I really like the way it approaches trading, especially the use of clearly defined Stop Loss and Take Profit levels, which gives me confidence in its structured risk management. Outstanding performance!
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 3 */}
              <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-300 text-white'}`}>
                    KT
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sky-400">Kenji Takahashi</span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2026.09.02 12:10</span>
                        <span className="text-yellow-500 text-xs">★ 5.0</span>
                      </div>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Asia (Japan)</span>
                    </div>
                    <p className={`my-1 leading-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Very stable execution on XAUUSD. Gold trading is notoriously difficult due to high volatility, but this algorithm handles market spikes smoothly. Low drawdown and consistent gains over the past week. Highly recommended for serious traders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 4 */}
              <div className={`border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-300 text-white'}`}>
                    LS
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sky-400">Lucas Silva</span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2026.09.01 08:30</span>
                        <span className="text-yellow-500 text-xs">★ 5.0</span>
                      </div>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>South America (Brazil)</span>
                    </div>
                    <p className={`my-1 leading-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Amazing support and robust code architecture. Tested it on a demo account first and now running live. The developer is very active and answers questions promptly. Great addition to my portfolio!
                    </p>
                  </div>
                </div>
              </div>

              {/* Review 5 */}
              <div className="pb-1">
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-300 text-white'}`}>
                    LN
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sky-400">Liam Ndlovu</span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2026.08.30 15:20</span>
                        <span className="text-yellow-500 text-xs">★ 5.0</span>
                      </div>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Africa (South Africa)</span>
                    </div>
                    <p className={`my-1 leading-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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