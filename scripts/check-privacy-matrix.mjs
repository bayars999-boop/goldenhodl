import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const matrixPath = path.join(root, 'app', 'privacy-data-matrix.ts');
const legalPath = path.join(root, 'app', 'legal-documents.ts');
const matrixSource = fs.readFileSync(matrixPath, 'utf8');
const legalSource = fs.readFileSync(legalPath, 'utf8');

const fields = [...matrixSource.matchAll(/field: '([^']+)'/g)].map((match) => match[1]);
const requiredHeaders = ['Data Field', 'Necessity', 'Legal Basis', 'Retention Period'];
const errors = [];

if (fields.length === 0) errors.push('Privacy data matrix must contain at least one field.');
if (new Set(fields).size !== fields.length) errors.push('Privacy data matrix contains duplicate fields.');
for (const header of requiredHeaders) {
  if (!legalSource.includes(`'${header}'`)) errors.push(`Privacy Policy is missing the required matrix header: ${header}.`);
}
if (!legalSource.includes('privacyDataMatrix.map')) errors.push('Privacy Policy must render rows from privacyDataMatrix.');
if (!matrixSource.includes("privacyMatrixVersion = '2026-09'")) errors.push('Privacy matrix must declare a version.');
for (const requiredText of ['Financial transaction history', 'IP address and security logs', 'Cookies and technical usage data', '5 years', '90 days']) {
  if (!matrixSource.includes(requiredText)) errors.push(`Privacy matrix is missing: ${requiredText}.`);
}
if (!legalSource.includes('7 business days')) errors.push('Privacy Policy must state the seven-business-day erasure deadline.');

if (errors.length > 0) {
  console.error(['Privacy matrix check failed:', ...errors.map((error) => `- ${error}`)].join('\n'));
  process.exit(1);
}

console.log(`Privacy matrix check passed: ${fields.length} fields, version 2026-09.`);
