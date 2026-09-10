// One-off diagnostic: does public.user_credentials exist, and does it contain a row for the given email?
// Usage: node scripts/check-credentials-table.mjs some@email.com
import { existsSync, readFileSync } from 'node:fs';

const envFile = ['.env.local', '.env'].find((f) => existsSync(f));
if (!envFile) { console.error('No .env.local or .env file found.'); process.exit(1); }
const env = Object.fromEntries(readFileSync(envFile, 'utf8').split(/\r?\n/).filter((line) => line.includes('=')).map((line) => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
console.log(`Project: ${url}`);

if (process.argv[2] === '--tables') {
  const probes = ['profiles', 'consents', 'security_audit_events', 'user_credentials', 'data_subject_requests'];
  for (const table of probes) {
    const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
    console.log(`  ${table}: ${r.ok ? 'EXISTS' : `MISSING (${r.status})`}`);
  }
  process.exit(0);
}

const contact = (process.argv[2] || '').trim().toLowerCase();
const res = await fetch(`${url}/rest/v1/user_credentials?select=id,contact,created_at`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
if (!res.ok) { console.error(`Table query failed (${res.status}):`, await res.text()); process.exit(1); }
const rows = await res.json();
console.log(`user_credentials reachable. Total rows: ${rows.length}`);
if (contact) {
  const match = rows.filter((r) => r.contact === contact);
  console.log(match.length ? `STALE ROW EXISTS for ${contact} (id=${match[0].id}, created ${match[0].created_at}) — registration now overwrites it, but you can also delete it in Table Editor.` : `No existing row for ${contact}.`);
}
