import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { setSession } from '@/lib/session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
const LOGIN_NONCE_COOKIE = 'base_insiders_login_nonce';

type Body = { address?: unknown; message?: unknown; signature?: unknown; nonce?: unknown; chainId?: unknown };
const baseClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org', { timeout: 15_000 }) });

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Wallet authentication is not configured.' }, { status: 503 });
  let body: Body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const address = String(body.address || '').toLowerCase();
  const message = String(body.message || '');
  const signature = String(body.signature || '');
  const nonce = String(body.nonce || '');
  if (!/^0x[a-f0-9]{40}$/.test(address) || !nonce || message.length > 2000 || !message.includes(`Nonce: ${nonce}`) || !message.includes(`Chain ID: 8453`)) return NextResponse.json({ error: 'Invalid login request.' }, { status: 400 });
  try {
    const cookieNonce = request.cookies.get(LOGIN_NONCE_COOKIE)?.value;
    let nonceId: string | null = null;
    if (cookieNonce !== nonce) {
      const nonces = await supabase<Array<{ id: string }>>(`auth_nonces?address=eq.${address}&nonce=eq.${encodeURIComponent(nonce)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&used_at=is.null&select=id&limit=1`);
      if (!nonces[0]) return NextResponse.json({ error: 'This login request has expired. Please try again.' }, { status: 401 });
      nonceId = nonces[0].id;
    }
    // Base Smart Wallet is a contract account. PublicClient.verifyMessage verifies
    // both regular EOA signatures and ERC-1271/ERC-6492 smart-account signatures.
    let valid: boolean;
    try {
      valid = await baseClient.verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
    } catch (error) {
      console.error('Wallet signature verification service failed.', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'Wallet signature verification is temporarily unavailable.' }, { status: 503 });
    }
    if (!valid) return NextResponse.json({ error: 'Wallet signature could not be verified.' }, { status: 401 });
    try {
      if (nonceId) await supabase(`auth_nonces?id=eq.${nonceId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ used_at: new Date().toISOString() }) });
    } catch (error) {
      console.error('Could not consume wallet login nonce.', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'This login request could not be completed. Please try again.' }, { status: 503 });
    }

    const response = NextResponse.json({ authenticated: true, address });
    try {
      setSession(response, address);
    } catch (error) {
      console.error('Could not create signed login session.', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'The login server is missing its SESSION_SECRET configuration.' }, { status: 503 });
    }
    response.cookies.set(LOGIN_NONCE_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });

    // Authentication has succeeded. A profile is convenience data and must not prevent a
    // valid Base Account from signing in if Supabase has a temporary permissions outage.
    try {
      await supabase('profiles?on_conflict=wallet_address', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ wallet_address: address }) });
    } catch (error) {
      console.error('Could not create wallet profile after login.', error instanceof Error ? error.message : error);
    }
    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('Could not verify wallet login.', detail);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? `Could not verify wallet login: ${detail}` : 'Could not verify wallet login.' }, { status: 503 });
  }
}
