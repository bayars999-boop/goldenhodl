const required = [
  'NEXT_PUBLIC_SUPABASE_REGION',
  'NEXT_PUBLIC_APP_HOSTING_REGION',
  'NEXT_PUBLIC_CLOUD_PROVIDER',
  'NEXT_PUBLIC_PAYMENT_PROVIDER',
  'NEXT_PUBLIC_DATA_TRANSFER_MECHANISM',
  'NEXT_PUBLIC_DATA_SECURITY_STANDARDS',
  'NEXT_PUBLIC_LEGAL_ENTITY_NAME',
  'NEXT_PUBLIC_OFFICIAL_ADDRESS',
];

const missing = required.filter((key) => !process.env[key]?.trim() || process.env[key].trim() === 'Not configured');
if (process.env.CI_DATA_LOCATION_REQUIRED === 'true' && missing.length > 0) {
  console.error(`Data location release gate failed. Missing verified configuration: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(missing.length === 0 ? 'Data location configuration is present.' : 'Data location check passed in local advisory mode; production CI gate is disabled.');
