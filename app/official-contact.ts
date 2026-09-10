export const officialContact = {
  legalName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || 'GoldenHODL legal entity not configured',
  address: process.env.NEXT_PUBLIC_OFFICIAL_ADDRESS || 'Official physical address not configured',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@goldenhodl.com',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || 'Not configured',
  website: 'www.goldenhodl.com',
};

export const officialAddressConfigured = Boolean(process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME && process.env.NEXT_PUBLIC_OFFICIAL_ADDRESS);
