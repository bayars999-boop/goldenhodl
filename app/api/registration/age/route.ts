import { NextResponse } from 'next/server';
import { calculateAge, isAdult, LEGAL_ADULT_AGE } from '../../../lib/age';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { dateOfBirth?: string };
    const dateOfBirth = body.dateOfBirth?.trim() || '';
    const age = calculateAge(dateOfBirth);

    if (age === null) {
      return NextResponse.json({ valid: false, error: 'Enter a valid date of birth.' }, { status: 400 });
    }
    if (!isAdult(dateOfBirth)) {
      return NextResponse.json({ valid: false, isMinor: true, error: `You must be at least ${LEGAL_ADULT_AGE} years old to use this service.` }, { status: 403 });
    }

    return NextResponse.json({ valid: true, isMinor: false, age, parentalConsentVerified: false });
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid age verification request.' }, { status: 400 });
  }
}
