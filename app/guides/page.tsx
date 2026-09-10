'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type GuideId = 'backtests' | 'copy-trading' | 'ea-rental' | 'freedom-algorithm';

type Guide = {
  id: GuideId;
  title: string;
  eyebrow: string;
  intro: string;
  sections: Array<{ title: string; items: string[] }>;
};

const guides: Guide[] = [
  {
    id: 'backtests',
    title: 'Instructions for Downloading the Demo Version and Running Backtests',
    eyebrow: 'DEMO & BACKTESTS',
    intro: 'Use MetaTrader 5 Strategy Tester to install the demo Expert Advisor and evaluate it under realistic historical conditions.',
    sections: [
      { title: 'Step 1: Download the Demo Version', items: ['Log in to your account dashboard at www.goldenhodl.com using your registered credentials.', 'Navigate to the Products or EA Rental section from the top menu bar.', 'Select the desired Expert Advisor (EA) and click the Download Demo button to save the file to your computer.'] },
      { title: 'Step 2: Install the EA on MetaTrader 5 (MT5)', items: ['Open MetaTrader 5 and select File -> Open Data Folder from the top menu.', 'Locate and open the MQL5 folder, then open the Experts directory.', 'Copy the downloaded EA demo file into the Experts folder.', 'Restart MT5 to refresh the Navigator panel and display the new EA.'] },
      { title: 'Step 3: Set Up Strategy Tester for Backtesting', items: ['Press Ctrl + R in MT5 to open Strategy Tester.', 'In Settings, select the downloaded EA from the drop-down menu.', 'Choose the trading asset pair, such as Gold / XAUUSD, and specify a timeframe such as M15 or H1.', 'Select Every tick based on real ticks for an accurate historical simulation.'] },
      { title: 'Step 4: Configure Realistic Testing Conditions', items: ['Data quality: use Every tick based on real ticks for high-resolution historical data and precise entry, exit, and spread simulation.', 'Spread settings: use Current or a fixed low spread that reflects real market conditions, such as low XAUUSD spreads.', 'Delay and slippage: include realistic network latency or execution delays when testing scalping strategies.', 'Account currency and leverage: match the planned live environment, such as 1:100 or 1:500 leverage in USD.'] },
      { title: 'Step 5: Configure Parameters and Run the Test', items: ['Open the Inputs tab to adjust risk parameters, lot sizes, and strategy settings.', 'Set the initial testing balance to match your planned trading capital.', 'Click the green Start button in the top right corner.', 'Review the performance graphs, results, and report after the simulation completes.'] },
    ],
  },
  {
    id: 'copy-trading',
    title: 'Guide on How to Copy Trade by Following BJ',
    eyebrow: 'COPY TRADING GUIDE',
    intro: 'Follow these steps to review the strategy and configure your copy trading service.',
    sections: [
      { title: 'Step 1: Review the Strategy', items: ['Open the public signal page and review the strategy statistics, drawdown, trading activity, and risk disclosure.', 'Read the service terms and confirm that you understand past performance does not guarantee future results.'] },
      { title: 'Step 2: Select Copy Trading', items: ['Open your dashboard and select Products.', 'Choose Copy Trading, enter your planned balance and contract duration, then review the fee and profit split shown before checkout.'] },
      { title: 'Step 3: Connect and Monitor', items: ['Complete the secure payment and account provisioning process.', 'Do not manually open or close trades on the connected account while the copy strategy is operating.', 'Monitor balance, history, statistics, and risk information from your dashboard.'] },
    ],
  },
  {
    id: 'ea-rental',
    title: 'Instructions for Renting and Operating the GoldMaster Robot',
    eyebrow: 'EA RENTAL GUIDE',
    intro: 'Rent the GoldMaster Expert Advisor, connect it to your MT5 account, and operate it according to the agreement.',
    sections: [
      { title: 'Step 1: Rent the EA', items: ['Open Dashboard > Products and choose EA Rental.', 'Enter a starting balance of at least $1,000, choose a duration, and review the rental agreement.', 'Complete checkout and wait for broker account provisioning confirmation.'] },
      { title: 'Step 2: Install and Attach the EA', items: ['Install the EA file in the MT5 MQL5/Experts folder and restart MT5.', 'Open the desired XAUUSD chart, choose the intended timeframe, and attach the GoldMaster EA.', 'Enable Algo Trading and verify that the EA is running on the correct account.'] },
      { title: 'Step 3: Operating Rules', items: ['Do not manually open or close trades on the account where the robot is operating.', 'Do not arbitrarily change Stop Loss, Take Profit, or risk parameters after activation.', 'Review the rental agreement, risk disclosure, and broker margin requirements before operation.'] },
    ],
  },
  {
    id: 'freedom-algorithm',
    title: 'Purchasing the Book "Freedom Algorithm" Written by Mr. BJ',
    eyebrow: 'BOOK & RESOURCES',
    intro: 'Learn more about the ideas, discipline, and systematic approach behind the GoldMaster ecosystem.',
    sections: [
      { title: 'About the Book', items: ['Freedom Algorithm presents a structured view of quantitative thinking, trading discipline, and risk management.', 'The book is educational material and does not constitute investment advice or a promise of future returns.'] },
      { title: 'How to Purchase', items: ['Open the book purchase option from this guide page or the official GoldenHODL channels.', 'Review the displayed price, delivery format, and applicable terms before confirming payment.', 'Keep your order confirmation for support and delivery questions.'] },
      { title: 'Important Notice', items: ['Trading involves substantial risk. Educational content cannot remove market risk or guarantee profitable results.', 'Contact info@goldenhodl.com for questions about availability or an order.'] },
    ],
  },
];

const isGuideId = (value: string | null): value is GuideId => guides.some((guide) => guide.id === value);

export default function GuidesPage() {
  const [selectedId, setSelectedId] = useState<GuideId>('backtests');
  const selected = guides.find((guide) => guide.id === selectedId) || guides[0];

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('guide');
    if (isGuideId(requested)) window.setTimeout(() => setSelectedId(requested), 0);
  }, []);

  return (
    <main className="guides-page">
      <section className="guides-shell">
        <header className="guides-header">
          <div><p className="legal-eyebrow">GOLDENHODL LEARNING CENTER</p><h1>Guides & Resources</h1><p>Use the tabs to review installation, copy trading, rental, and book information without leaving this page.</p></div>
          <Link className="legal-back-link" href="/">Back to platform</Link>
        </header>
        <nav className="guides-tabs" aria-label="Guides navigation">
          {guides.map((guide) => <button type="button" key={guide.id} className={selectedId === guide.id ? 'guide-tab active' : 'guide-tab'} onClick={() => setSelectedId(guide.id)}>{guide.title}</button>)}
        </nav>
        <article className="guide-document" aria-live="polite">
          <p className="legal-eyebrow">{selected.eyebrow}</p>
          <h2>{selected.title}</h2>
          <p className="guide-intro">{selected.intro}</p>
          <div className="guide-sections">{selected.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</div>
          <div className="legal-document-note">Please review the applicable Terms and Conditions and Risk Disclosure before using any trading service.</div>
        </article>
      </section>
    </main>
  );
}
