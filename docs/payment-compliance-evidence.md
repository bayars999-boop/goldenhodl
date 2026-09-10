# Payment provider compliance evidence (Lemon Squeezy)

## Merchant of Record and PCI-DSS

- Lemon Squeezy acts as the Merchant of Record (MoR) for all Copy Trading and EA Rental purchases: it is the seller on the customer's card statement, collects payment, and is responsible for card-network compliance.
- Lemon Squeezy's hosted checkout is PCI-DSS certified; evidence (current attestation level and certificate/report reference) must be obtained from Lemon Squeezy's compliance/trust page or merchant agreement and attached to this file before an audit.
- Required evidence to attach: Lemon Squeezy PCI-DSS attestation of compliance (AOC) or compliance summary, the signed merchant/DPA agreement, and the subprocessor list.

## Architecture: no cardholder data touches our servers

- Card entry only ever happens on Lemon Squeezy's hosted checkout page (`checkoutJson.data.attributes.url`, opened via `window.LemonSqueezy.Url.Open` or a redirect in `app/dashboard/page.tsx`). The application never renders a card form and never receives PAN, CVV, or expiry data.
- `app/api/lemon-checkout/route.ts` only sends the buyer's email and a computed price to Lemon Squeezy's Checkout API; it never sends or stores card data.
- `app/api/webhooks/lemon-squeezy/route.ts` receives order events (amount, tax, email) after payment has already been processed by Lemon Squeezy — again, no card data.
- This confirms the PCI-DSS SAQ-A scope: the merchant (GoldenHODL) fully outsources cardholder data handling to a certified provider and stores/transmits no cardholder data.

## VAT / tax transparency

- `app/api/lemon-checkout/route.ts` requests `preview: true` on checkout creation, returning Lemon Squeezy's computed `subtotal`, `tax`, and `total` for the order.
- `app/dashboard/page.tsx` shows this breakdown in a "Price preview" step before the user is redirected to the Lemon Squeezy hosted checkout, so no fee is hidden from the buyer before payment.
- Final VAT/tax is determined by Lemon Squeezy from the buyer's billing country entered on the hosted checkout page; the preview may show `0` tax until that country is known.

## Mongolian e-Barimt VAT receipts

- Lemon Squeezy does not integrate with the Mongolian General Department of Taxation, so `app/api/webhooks/lemon-squeezy/route.ts` listens for the `order_created` webhook and calls `app/lib/ebarimt.ts` to request a VAT receipt from a configured e-Barimt gateway (`EBARIMT_API_URL` / `EBARIMT_API_KEY`).
- The webhook verifies the `X-Signature` HMAC-SHA256 header against `LEMON_SQUEEZY_WEBHOOK_SECRET` before processing any payload.
- Every receipt attempt (success or failure) is written to `security_audit_events` (`event_type: 'ebarimt_receipt_issued'` / `'ebarimt_receipt_failed'`) for audit evidence.
- Before production launch: replace the placeholder env vars with the real e-Barimt gateway/POS integration credentials and attach that provider's own compliance documentation here.
