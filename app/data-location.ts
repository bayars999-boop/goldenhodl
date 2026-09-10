export type DataLocationConfig = {
  supabaseRegion: string;
  appHostingRegion: string;
  cloudProvider: string;
  paymentProvider: string;
  transferMechanism: string;
  securityStandards: string;
};

export const dataLocation: DataLocationConfig = {
  supabaseRegion: process.env.NEXT_PUBLIC_SUPABASE_REGION || 'Not configured',
  appHostingRegion: process.env.NEXT_PUBLIC_APP_HOSTING_REGION || 'Not configured',
  cloudProvider: process.env.NEXT_PUBLIC_CLOUD_PROVIDER || 'Supabase',
  paymentProvider: process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'Lemon Squeezy',
  transferMechanism: process.env.NEXT_PUBLIC_DATA_TRANSFER_MECHANISM || 'Not configured',
  securityStandards: process.env.NEXT_PUBLIC_DATA_SECURITY_STANDARDS || 'Not configured',
};
