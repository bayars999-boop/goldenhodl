import { NextRequest, NextResponse } from 'next/server';
import { readSessionCookie, verifySessionToken } from './app/lib/session';

export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'http') {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 308);
  }
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await verifySessionToken(readSessionCookie(request.headers.get('cookie')));
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
