import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function cookieOptions(request: NextRequest) {
  return { httpOnly: true, sameSite: 'lax' as const, secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: 10 * 60 };
}

export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID?.trim();
  if (!clientId) return NextResponse.redirect(new URL('/?x_error=not_configured', request.url));

  const state = randomBytes(32).toString('hex');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const callback = new URL('/api/x/callback', request.url).toString();
  const authorize = new URL('https://twitter.com/i/oauth2/authorize');
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', callback);
  // The app only displays the authenticated account's public username. It
  // neither reads posts/followers nor keeps refresh access for later use.
  authorize.searchParams.set('scope', 'users.read');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorize);
  response.cookies.set('base_insiders_x_oauth', encodeURIComponent(JSON.stringify({ state, verifier })), cookieOptions(request));
  return response;
}
