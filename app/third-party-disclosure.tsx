'use client';

export default function ThirdPartyDisclosure({ colors, onClose }: { colors: { surface: string; text: string; muted: string; border: string }; onClose: () => void }) {
  return <div role="dialog" aria-modal="true" aria-labelledby="privacy-details-title" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(15, 23, 42, .6)' }}>
    <div style={{ maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '24px', borderRadius: '8px', background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, boxShadow: '0 20px 50px rgba(15, 23, 42, .3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}><h2 id="privacy-details-title" style={{ margin: 0, fontSize: '20px' }}>How we share your information</h2><button type="button" aria-label="Close privacy details" onClick={onClose} style={{ border: 0, background: 'none', color: colors.muted, fontSize: '22px', cursor: 'pointer' }}>X</button></div>
      <p style={{ color: colors.muted, lineHeight: 1.6 }}>Limited information may be transferred to these named providers:</p>
      <ul style={{ color: colors.muted, lineHeight: 1.7, paddingLeft: '20px' }}>
        <li><strong>Supabase:</strong> account, authentication, profile, and consent storage.</li>
        <li><strong>Vercel:</strong> application hosting, request processing, and security.</li>
        <li><strong>MetaApi Cloud:</strong> authorized MetaTrader trading data and technical integration.</li>
        <li><strong>Lemon Squeezy:</strong> checkout, billing, fraud checks, and transaction confirmation.</li>
      </ul>
      <p style={{ color: colors.muted, lineHeight: 1.6, marginBottom: 0 }}>Transfers are limited to contract performance, security, payment, or legal obligations. Providers may process information only for the stated service and must apply appropriate confidentiality and security controls. See the full <a href="/legal-documents?document=privacy" target="_blank" rel="noreferrer">Privacy Policy</a> for more information.</p>
    </div>
  </div>;
}
