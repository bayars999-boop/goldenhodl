# Data location and transfer register

This register is part of the privacy audit evidence. The values must match the provider dashboards and signed contracts before production launch.

| Provider / system | Processing role | Declared region | Evidence required | Transfer safeguard |
| --- | --- | --- | --- | --- |
| Supabase | Database, authentication, profile data | `NEXT_PUBLIC_SUPABASE_REGION` | Supabase project settings screenshot/export and DPA | Provider DPA; SCCs where required |
| Vercel or application host | Application runtime and request processing | `NEXT_PUBLIC_APP_HOSTING_REGION` | Deployment project region/settings | Provider DPA; SCCs where required |
| Lemon Squeezy | Payment checkout and transaction processing | Provider-confirmed location | Merchant agreement, DPA, and compliance documentation | Provider contractual safeguards |
| MetaApi Cloud | Trading account integration and technical data | Provider-confirmed location | Account/provider DPA and subprocessors list | Provider contractual safeguards |

## Release gate

Do not release production until all `NEXT_PUBLIC_*_REGION` values are set to verified provider-console values and the evidence files are attached to the audit record. A value in `.env.example` is only a placeholder and is not proof of physical server location.
