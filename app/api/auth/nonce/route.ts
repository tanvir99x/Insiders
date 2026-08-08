import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.toLowerCase() || '';
  if (!/^0x[a-f0-9]{40}$/.test(address)) return NextResponse.json({ error: 'A valid wallet address is required.' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Wallet authentication is not configured.' }, { status: 503 });
  const nonce = randomBytes(24).toString('base64url');
  try {
    await supabase('auth_nonces', { method: 'POST', body: JSON.stringify({ address, nonce, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() }) });
    return NextResponse.json({ nonce }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('Could not create wallet login nonce.', detail);
    return NextResponse.json({ error: process.env.NODE_ENV === 'development' ? `Could not create a login request: ${detail}` : 'Could not create a login request.' }, { status: 503 });
  }
}
