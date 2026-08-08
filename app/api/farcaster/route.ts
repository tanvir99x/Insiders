import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster';
const ALLOWED_ACTIONS = new Set(['profile', 'followers', 'following']);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action') || 'profile';
  const fid = searchParams.get('fid') || '';
  if (!ALLOWED_ACTIONS.has(action) || !/^\d{1,12}$/.test(fid)) {
    return NextResponse.json({ error: 'A valid action and numeric fid are required.' }, { status: 400 });
  }
  const apiKey = process.env.NEYNAR_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: 'Farcaster social service is not configured.' }, { status: 503 });

  const endpoint = action === 'profile' ? 'user/bulk' : action;
  const url = new URL(`${NEYNAR_BASE_URL}/${endpoint}`);
  if (action === 'profile') url.searchParams.set('fids', fid);
  else {
    url.searchParams.set('fid', fid);
    const requestedLimit = Number(searchParams.get('limit')) || 25;
    url.searchParams.set('limit', String(Math.min(Math.max(requestedLimit, 1), 100)));
    const cursor = searchParams.get('cursor');
    if (cursor && cursor.length <= 1000) url.searchParams.set('cursor', cursor);
  }
  try {
    const response = await fetch(url, { headers: { accept: 'application/json', 'x-api-key': apiKey, 'x-neynar-experimental': 'false' }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) {
      console.error(`Neynar request failed (${response.status}).`);
      return NextResponse.json({ error: 'Neynar request failed.' }, { status: response.status });
    }
    const payload = await response.json();
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (error) {
    console.error('Neynar proxy error.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Farcaster social service is unavailable.' }, { status: 502 });
  }
}
