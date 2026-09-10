import { privacyDataMatrix, retentionSchedule } from '../privacy-data-matrix';

export type RetentionRecord = {
  id: string;
  field: string;
  value: string;
  retainedUntil: string;
  legalHold?: boolean;
};

export type RetentionAction = 'delete' | 'anonymize';

export type RetentionRunResult = {
  scanned: number;
  deleted: number;
  anonymized: number;
  skippedLegalHold: number;
  matrixVersion: string;
};

const anonymizedValue = '[anonymized]';

export function applyRetentionPolicy(records: RetentionRecord[], now = new Date()): { records: RetentionRecord[]; result: RetentionRunResult } {
  let deleted = 0;
  let anonymized = 0;
  let skippedLegalHold = 0;
  const activeFields = new Map(privacyDataMatrix.map((item) => [item.field, item.action]));
  const remaining = records.flatMap((record) => {
    if (record.legalHold) {
      skippedLegalHold += 1;
      return [record];
    }
    if (new Date(record.retainedUntil).getTime() > now.getTime()) return [record];
    const action = activeFields.get(record.field);
    if (action === 'delete') {
      deleted += 1;
      return [];
    }
    if (action === 'anonymize') {
      anonymized += 1;
      return [{ ...record, value: anonymizedValue }];
    }
    return [record];
  });

  return {
    records: remaining,
    result: {
      scanned: records.length,
      deleted,
      anonymized,
      skippedLegalHold,
      matrixVersion: '2026-09',
    },
  };
}

export const retentionConfiguration = {
  schedule: '0 3 * * *',
  inactiveAccountGraceDays: retentionSchedule.inactiveAccountGraceDays,
  erasureRequestBusinessDays: retentionSchedule.erasureRequestBusinessDays,
  ipAddressRetentionDays: retentionSchedule.ipAddressRetentionDays,
  transactionHistoryRetentionYears: retentionSchedule.transactionHistoryRetentionYears,
};
