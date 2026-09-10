'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type CookiePreferences = { functional: true; analytics: boolean; marketing: boolean };
const CONSENT_KEY = 'cookie_preferences';
const defaultPreferences: CookiePreferences = { functional: true, analytics: false, marketing: false };
const readPreferences = (): CookiePreferences => {
  const saved = document.cookie.match(/(?:^|;\s*)cookie_preferences=([^;]+)/)?.[1];
  if (!saved) return defaultPreferences;
  try { const parsed = JSON.parse(decodeURIComponent(saved)) as Partial<CookiePreferences>; return { functional: true, analytics: parsed.analytics === true, marketing: parsed.marketing === true }; } catch { return defaultPreferences; }
};
export const hasAnalyticsConsent = () => typeof document !== 'undefined' && readPreferences().analytics;

function syncTrackerScripts(preferences: CookiePreferences) {
  document.documentElement.dataset.cookieAnalytics = String(preferences.analytics);
  document.documentElement.dataset.cookieMarketing = String(preferences.marketing);
  document.documentElement.dataset.googleAnalyticsLoaded = String(Boolean(document.getElementById('google-analytics-script')));
  document.documentElement.dataset.metaPixelLoaded = String(Boolean(document.getElementById('meta-pixel-script')));
  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  if (preferences.analytics && analyticsId && !document.getElementById('google-analytics-script')) {
    const script = document.createElement('script'); script.id = 'google-analytics-script'; script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`; document.head.appendChild(script);
  } else if (!preferences.analytics) document.getElementById('google-analytics-script')?.remove();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (preferences.marketing && pixelId && !document.getElementById('meta-pixel-script')) {
    const script = document.createElement('script'); script.id = 'meta-pixel-script'; script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script);
  } else if (!preferences.marketing) document.getElementById('meta-pixel-script')?.remove();
  document.documentElement.dataset.googleAnalyticsLoaded = String(Boolean(document.getElementById('google-analytics-script')));
  document.documentElement.dataset.metaPixelLoaded = String(Boolean(document.getElementById('meta-pixel-script')));
}

export function ConsentTrackers() { useEffect(() => { const sync = () => syncTrackerScripts(readPreferences()); sync(); window.addEventListener('goldenhodl-cookie-preferences-updated', sync); return () => window.removeEventListener('goldenhodl-cookie-preferences-updated', sync); }, []); return null; }

export default function CookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasDecision, setHasDecision] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (saved) { const current = readPreferences(); setPreferences(current); setHasDecision(true); syncTrackerScripts(current); }
  }, []);

  const updateConsent = async (next: CookiePreferences) => {
    const encoded = encodeURIComponent(JSON.stringify(next));
    const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CONSENT_KEY}=${encoded}; Max-Age=31536000; Path=/; SameSite=Lax${secureAttribute}`;
    window.localStorage.setItem(CONSENT_KEY, encoded);
    setPreferences(next); setHasDecision(true); syncTrackerScripts(next);
    setShowSettings(false);
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: 'cookies', version: '2026-09', action: 'accepted', preferences: next }),
    }).catch(() => undefined);
  };

  if (hasDecision && !showSettings) return <button type="button" className="cookie-preferences-button" onClick={() => setShowSettings(true)}>Cookie preferences</button>;

  return (
    <aside className="cookie-consent" role="dialog" aria-label="Cookie preferences" aria-live="polite">
      <div>
        <strong>Cookie preferences</strong>
        <p>We use essential storage for security and optional technologies for preferences and analytics. Read the <Link href="/legal-documents?document=cookies">Cookie Policy</Link>.</p>
        {showSettings && <div className="cookie-consent-settings"><label className="cookie-switch-row"><span><strong>Functional cookies</strong><small>Required for security, authentication, and preferences.</small></span><input type="checkbox" checked readOnly aria-label="Functional cookies always active" /></label><label className="cookie-switch-row"><span><strong>Analytics cookies</strong><small>Google Analytics measures visits, device data, and site usage.</small></span><input type="checkbox" checked={preferences.analytics} onChange={(event) => setPreferences((current) => ({ ...current, analytics: event.target.checked }))} /></label><label className="cookie-switch-row"><span><strong>Marketing cookies</strong><small>Meta Pixel measures campaign performance and advertising interactions.</small></span><input type="checkbox" checked={preferences.marketing} onChange={(event) => setPreferences((current) => ({ ...current, marketing: event.target.checked }))} /></label></div>}
      </div>
      <div className="cookie-consent-actions">
        <button type="button" onClick={() => updateConsent({ functional: true, analytics: false, marketing: false })}>Reject optional</button>
        <button type="button" onClick={() => setShowSettings((current) => !current)}>{showSettings ? 'Hide settings' : 'Configure'}</button>
        {showSettings ? <button type="button" onClick={() => updateConsent(preferences)}>Save choices</button> : <button type="button" onClick={() => updateConsent({ functional: true, analytics: true, marketing: true })}>Accept optional</button>}
      </div>
    </aside>
  );
}
