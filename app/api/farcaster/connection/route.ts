import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

type ProfileRow = {
  farcaster_fid: number | null;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

function sessionFor(request: NextRequest) {
  const session = readSession(request);
  if (!session) return null;
  if (!isSupabaseConfigured()) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = sessionFor(request);
  if (!session) return NextResponse.json({ error: 'Sign in with your wallet first.' }, { status: 401 });
  try {
    const profiles = await supabase<ProfileRow[]>(`profiles?wallet_address=eq.${session.address}&select=farcaster_fid,display_name,handle,avatar_url&limit=1`);
    const profile = profiles[0];
    if (!profile?.farcaster_fid) return NextResponse.json({ profile: null }, { headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({
      profile: {
        fid: profile.farcaster_fid,
        username: profile.handle,
        displayName: profile.display_name,
        pfpUrl: profile.avatar_url,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Could not load Farcaster connection.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not load the Farcaster connection.' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = sessionFor(request);
  if (!session) return NextResponse.json({ error: 'Sign in with your wallet first.' }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const fid = Number(body.fid);
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const pfpUrl = typeof body.pfpUrl === 'string' ? body.pfpUrl.trim() : '';
    if (!Number.isSafeInteger(fid) || fid < 1 || fid > 999_999_999_999 || username.length > 80 || displayName.length > 120 || (pfpUrl && !/^https:\/\//i.test(pfpUrl))) {
      return NextResponse.json({ error: 'Invalid Farcaster profile.' }, { status: 400 });
    }
    // A user may authenticate successfully while profile sync is temporarily unavailable.
    // Upsert here so connecting Farcaster always creates the wallet's shared profile record.
    await supabase('profiles?on_conflict=wallet_address', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ wallet_address: session.address, farcaster_fid: fid, handle: username || null, display_name: displayName || username || null, avatar_url: pfpUrl || null }),
    });
    return NextResponse.json({ connected: true });
  } catch (error) {
    console.error('Could not save Farcaster connection.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not save the Farcaster connection.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = sessionFor(request);
  if (!session) return NextResponse.json({ error: 'Sign in with your wallet first.' }, { status: 401 });
  try {
    await supabase(`profiles?wallet_address=eq.${session.address}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ farcaster_fid: null, handle: null, display_name: null, avatar_url: null }),
    });
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error('Could not remove Farcaster connection.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not remove the Farcaster connection.' }, { status: 503 });
  }
}
