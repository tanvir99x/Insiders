import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function cookieOptions(request: NextRequest) {
  return { httpOnly: true, sameSite: 'lax' as const, secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: 60 * 60 * 24 * 30 };
}

export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID?.trim();
  const clientSecret = process.env.X_CLIENT_SECRET?.trim();
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const saved = request.cookies.get('base_insiders_x_oauth')?.value;
  let transaction: { state?: string; verifier?: string } = {};
  try { transaction = JSON.parse(decodeURIComponent(saved || '')); } catch { /* invalid OAuth cookie */ }
  const finish = (result: string) => {
    const response = NextResponse.redirect(new URL(`/?x_${result}=1`, request.url));
    response.cookies.delete('base_insiders_x_oauth');
    return response;
  };
  if (!clientId || !code || !state || state !== transaction.state || !transaction.verifier) return finish('error');

  const callback = new URL('/api/x/callback', request.url).toString();
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: callback, code_verifier: transaction.verifier, client_id: clientId });
  const headers: HeadersInit = { 'content-type': 'application/x-www-form-urlencoded' };
  if (clientSecret) headers.authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  try {
    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', { method: 'POST', headers, body, signal: AbortSignal.timeout(15_000) });
    if (!tokenResponse.ok) return finish('error');
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return finish('error');
    const profileResponse = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url', { headers: { authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(15_000) });
    if (!profileResponse.ok) return finish('error');
    const profile = await profileResponse.json() as { data?: { id?: string; username?: string; name?: string } };
    if (!profile.data?.id || !profile.data.username) return finish('error');
    const response = NextResponse.redirect(new URL('/?x_connected=1', request.url));
    response.cookies.delete('base_insiders_x_oauth');
    // Only the public X identity is retained. Access and refresh tokens are discarded.
    response.cookies.set('base_insiders_x_profile', encodeURIComponent(JSON.stringify(profile.data)), cookieOptions(request));
    return response;
  } catch {
    return finish('error');
  }
}
