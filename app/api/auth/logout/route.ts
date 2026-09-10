import { NextResponse } from 'next/server';
import { clearedSessionCookieHeader } from '../../../lib/session';

export async function POST() {
  const result = NextResponse.json({ loggedOut: true });
  result.headers.append('Set-Cookie', clearedSessionCookieHeader);
  return result;
}
