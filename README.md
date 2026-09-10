# Privacy data governance

Every new personal-data field must be added to `app/privacy-data-matrix.ts` before it is used in a form, API, database migration, or integration. The entry must document its necessity, legal basis, retention period, and deletion/anonymization action. The Privacy Policy renders its retention table from that matrix.

Run `npm run check:privacy-matrix` locally and in CI. The scheduled `/api/cron/retention` route runs daily through `vercel.json`; configure `CRON_SECRET`, `RETENTION_CLEANUP_URL`, and `RETENTION_CLEANUP_SECRET` to connect it to the production database cleanup function. The route fails closed with HTTP 503 when the adapter is not configured.
## Profile storage

Profile fields are loaded and saved through `/api/profile`; no profile data is read from or written to browser `localStorage`. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, run the `profiles` migration in `database/schema.sql`, and provide the Supabase access token through the authenticated session cookie (`sb-access-token`) or an `Authorization: Bearer` header. Supabase RLS enforces `auth.uid() = id` for reads, inserts, and updates.

Verification checklist:

1. Inspect browser Application/Local Storage and confirm there is no `goldmaster-profile` key.
2. Save a profile and verify the authenticated user's `profiles` row changes in Supabase.
3. Attempt to update a different profile ID and confirm RLS rejects it.
4. Without Supabase configuration or an authenticated token, confirm `/api/profile` fails closed instead of writing locally.

## Authenticated erasure requests

`POST /api/data-request` accepts only `{ "type": "erasure" }` from an authenticated Supabase session. It derives the user ID from the verified access token, anonymizes that user's profile, writes a completed record to `data_subject_requests`, calls Supabase logout, and expires the session cookie. It never trusts a client-supplied email/contact or writes a console-only audit event. Financial, tax, AML, payment, fraud, and legal-hold records must be handled by the approved retention/legal-hold process rather than deleted blindly.

## Data portability

Authenticated users can download their own profile, account email, export timestamp, and data-subject request history from `GET /api/data-export?format=json` or `GET /api/data-export?format=csv`. The dashboard exposes `Download JSON` and `Download CSV` controls. The endpoint derives the user ID from the verified session, applies RLS-backed queries, returns attachment headers, and rejects unauthenticated requests with HTTP 401. Verify both formats, inspect `Content-Disposition`, and confirm that a second user's ID cannot be supplied to change the exported scope.

## Server location and cross-border transfers

Set the infrastructure declarations in `.env.example` to the values verified in the Supabase, hosting, payment, and MetaApi provider consoles. Maintain the evidence and provider DPA/SCC records in `docs/data-location-register.md`. Set `CI_DATA_LOCATION_REQUIRED=true` in the production CI environment; then `npm run ci` fails if any declared region or transfer safeguard is missing. Never treat the example Frankfurt/EU-style values as proof until they match the deployed provider settings.

Security controls, least-privilege rules, MFA requirements, audit logging, retention, password handling, and incident response are documented in `docs/security-toms.md`. Apply the database migration in `database/schema.sql` before enabling production profile, erasure, or audit workflows.

Cookie blocking and tracker evidence procedures are documented in `docs/cookie-consent-evidence.md`. Consent is globally coordinated by the root `ConsentTrackers` component, optional scripts are fail-closed, and root HTML data attributes expose the effective consent and script-loaded state for audit verification.

The legal entity name, official physical address, email, and phone are centralized in `app/official-contact.ts` and displayed in the footer and legal documents. Configure `NEXT_PUBLIC_LEGAL_ENTITY_NAME` and `NEXT_PUBLIC_OFFICIAL_ADDRESS` with the registered corporate details; production CI rejects missing values when `CI_DATA_LOCATION_REQUIRED=true`.

## Unified form consent

`app/consent-field.tsx` is the shared controlled consent component. Registration uses it for Privacy Policy, Terms and Risk/marketing disclosures with unchecked initial state, inline summaries, and submit blocking until required consent is manually selected. The current application has no separate contact or newsletter subscription form; any future personal-data collection form must use `ConsentField`, include an explicit Privacy Policy link, default to `false`, and block submission until required consent is checked. Checkout uses an order-specific agreement control and must be kept aligned with the same policy/version requirements.

Audit evidence: verify `input[type="checkbox"]` values after a hard refresh, confirm the submit control is disabled before manual selection, and record the DOM label/summary plus the `/api/consent` request for each required consent.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
