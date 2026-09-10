export type PrivacyField = {
  field: string;
  necessity: string;
  legalBasis: string;
  retention: string;
  action: 'delete' | 'anonymize';
};

export const privacyDataMatrix: PrivacyField[] = [
  { field: 'Full name', necessity: 'Identify the user and enter into a contract', legalBasis: 'Performance of a contract', retention: 'Active account duration plus 1 year', action: 'anonymize' },
  { field: 'Email address', necessity: 'Service notifications and verification', legalBasis: 'Performance of a contract', retention: 'Active account duration plus 1 year', action: 'anonymize' },
  { field: 'Phone number', necessity: 'Two-factor authentication and urgent contact', legalBasis: 'Security and fraud prevention', retention: 'Active account duration', action: 'anonymize' },
  { field: 'Active account and service data', necessity: 'Provide the selected service and maintain the account', legalBasis: 'Performance of a contract', retention: 'For the duration of the active service relationship', action: 'anonymize' },
  { field: 'Financial transaction history', necessity: 'Payment reconciliation, tax reporting, and legal recordkeeping', legalBasis: 'Legal obligation', retention: 'Up to 5 years after the transaction or as otherwise required by law', action: 'anonymize' },
  { field: 'IP address and security logs', necessity: 'System security, fraud prevention, and incident investigation', legalBasis: 'Legitimate interest', retention: '90 days, then automatically deleted', action: 'delete' },
  { field: 'Cookies and technical usage data', necessity: 'Security, preferences, and consent management', legalBasis: 'Consent for optional cookies; legitimate interest for essential security', retention: '90 days, then automatically deleted unless a shorter consent period applies', action: 'delete' },
];

export const privacyMatrixVersion = '2026-09';

export const retentionSchedule = {
  inactiveAccountGraceDays: 365,
  erasureRequestBusinessDays: 7,
  ipAddressRetentionDays: 90,
  transactionHistoryRetentionYears: 5,
} as const;
