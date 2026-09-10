# Technical and Organizational Measures

## Encryption

- Production traffic must use HTTPS with TLS 1.2+; TLS 1.3 is required where supported by the hosting and CDN provider.
- `proxy.ts` returns a permanent 308 redirect from forwarded HTTP to HTTPS in production; HSTS includes `preload` and subdomains.
- HSTS, CSP, frame protection, MIME sniffing protection, referrer policy, and permissions policy are emitted by `next.config.ts`.
- Supabase-managed database encryption at rest must be confirmed in the project security settings and provider contract. The application does not store payment card data; Lemon Squeezy handles checkout card processing.
- Secrets must be stored in the deployment secret manager, never committed or exposed to the client. Rotate any credential that has appeared in logs, screenshots, or shared files.

## Access control and authentication

- Supabase Auth validates bearer/session tokens in server routes.
- `profiles` and security audit tables use RLS. The `app_role` field is protected by a database trigger; users cannot promote themselves to admin.
- Administrative operations must use a separate service-role backend path and must never expose the service-role key to browser code.
- MFA must be enabled for Supabase administrator accounts and required for privileged production access. The dashboard must not describe a client-side toggle as MFA until Supabase Auth MFA enrollment/challenge verification is connected.

## Logging and monitoring

- Security-sensitive actions are written to `security_audit_events`: erasure completion, authentication/security changes, profile changes, and administrative actions.
- Logs must be retained for at least 90 days, protected from end-user update/delete, monitored for failures, and exported to an access-controlled operational log sink.
- Scheduled retention removes or anonymizes data after the declared period, subject to legal hold.

## Organizational controls

- Apply least privilege: developers use non-production data, support users have read-only access where possible, and production database/service-role access is approval-based and MFA-protected.
- Review access quarterly and revoke access on role change or departure.
- Password policy: use a password manager, unique passwords, MFA for privileged accounts, and immediate rotation after suspected exposure.
- Incident response: detect, contain, preserve evidence, assess affected data, notify management/legal, notify regulators and users where required, remediate, and record lessons learned.
- Review this document and provider DPA/SCC evidence at least annually and after material architecture or provider changes.
