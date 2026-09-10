export const LEGAL_ADULT_AGE = 18;

export function calculateAge(dateOfBirth: string, today = new Date()) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Number.isNaN(birthDate.getTime())) return null;
  if (birthDate > today) return null;

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const month = today.getUTCMonth() - birthDate.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < birthDate.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function isAdult(dateOfBirth: string, today = new Date()) {
  const age = calculateAge(dateOfBirth, today);
  return age !== null && age >= LEGAL_ADULT_AGE;
}
