import fs from 'node:fs';

const files = {
  proxy: fs.readFileSync('proxy.ts', 'utf8'),
  config: fs.readFileSync('next.config.ts', 'utf8'),
  password: fs.readFileSync('app/lib/password.ts', 'utf8'),
  schema: fs.readFileSync('database/schema.sql', 'utf8'),
  docs: fs.readFileSync('docs/database-encryption-evidence.md', 'utf8'),
  register: fs.readFileSync('app/api/auth/register/route.ts', 'utf8'),
};
const required = [
  ['proxy', "httpsUrl.protocol = 'https:'"],
  ['config', 'Strict-Transport-Security'],
  ['config', 'preload'],
  ['password', 'bcrypt.hash'],
  ['password', 'BCRYPT_ROUNDS = 12'],
  ['schema', 'user_credentials'],
  ['schema', 'password_hash TEXT NOT NULL'],
  ['schema', 'ENABLE ROW LEVEL SECURITY'],
  ['docs', 'encryption at rest'],
  ['register', '/auth/v1/signup'],
  ['register', 'Required consents are missing'],
  ['register', 'rest/v1/consents'],
];
const missing = required.filter(([file, text]) => !files[file].includes(text));
if (missing.length) { console.error(`Security control check failed: ${missing.map(([file, text]) => `${file}:${text}`).join(', ')}`); process.exit(1); }
console.log('Security control check passed: HTTPS redirect, HSTS, bcrypt hashing, encrypted-at-rest evidence, and credentials RLS found.');
