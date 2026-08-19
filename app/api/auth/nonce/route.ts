import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
const LOGIN_NONCE_COOKIE = 'base_insiders_login_nonce';
const NONCE_MAX_AGE_SECONDS = 10 * 60;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.toLowerCase() || '';
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Wallet authentication is not configured.' }, { status: 503 });
  // EIP-4361 / Base Account accepts an alphanumeric nonce. Base64URL can include
  // "-" and "_", which Base rejects as an invalid SIWE capability parameter.
  const nonce = randomBytes(24).toString('hex');

  // Base App authentication obtains the wallet address inside wallet_connect. Bind the
  // one-time nonce to this browser first, so login can stay a single wallet interaction.
  if (!address) {
    const response = NextResponse.json({ nonce }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(LOGIN_NONCE_COOKIE, nonce, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: NONCE_MAX_AGE_SECONDS,
    });
    return response;
  }
  if (!/^0x[a-f0-9]{40}$/.test(address)) return NextResponse.json({ error: 'A valid wallet address is required.' }, { status: 400 });
  try {
    await supabase('auth_nonces', { method: 'POST', body: JSON.stringify({ address, nonce, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() }) });
    return NextResponse.json({ nonce }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('Could not create wallet login nonce.', detail);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? `Could not create a login request: ${detail}` : 'Could not create a login request.' }, { status: 503 });
  }
}
