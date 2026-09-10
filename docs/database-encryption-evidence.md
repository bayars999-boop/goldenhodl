# Database encryption evidence

The application never stores plaintext passwords. Server-side registration hashes passwords with bcrypt using 12 cost rounds in `app/lib/password.ts`; login uses bcrypt comparison and never returns the hash to the browser.

Production database encryption at rest is provider-managed and must be evidenced with:

- Supabase project security settings showing encryption at rest enabled.
- Supabase infrastructure/region and DPA records.
- TLS certificate/configuration evidence for client-to-Supabase REST traffic.
- Access log showing only the server service role can read `user_credentials`.
- A redacted schema/query check showing `password_hash` values are bcrypt hashes and no plaintext password column exists.

The service-role key must exist only in server-side deployment secrets. It must never be prefixed with `NEXT_PUBLIC_` or shipped to browser code.