import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

type PostRow = { id: string; author_address: string; body: string; image_url: string | null; created_at: string; profiles: { display_name: string | null; handle: string | null; avatar_url: string | null } | null };

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Community database is not configured.' }, { status: 503 });
  try {
    // `posts` also connects to `profiles` through reactions, so PostgREST needs
    // the direct author foreign-key relationship spelled out for this embed.
    const posts = await supabase<PostRow[]>('posts?is_deleted=eq.false&select=id,author_address,body,image_url,created_at,profiles!posts_author_address_fkey(display_name,handle,avatar_url)&order=created_at.desc&limit=50');
    return NextResponse.json({ posts }, { headers: { 'Cache-Control': 'private, max-age=30' } });
  } catch { return NextResponse.json({ error: 'Could not load the feed.' }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Community database is not configured.' }, { status: 503 });
  let body: { body?: unknown; imageUrl?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid post.' }, { status: 400 }); }
  const text = String(body.body || '').trim();
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  if ((!text && !imageUrl) || text.length > 5000 || imageUrl.length > 2000) return NextResponse.json({ error: 'Post must contain text or an image.' }, { status: 400 });
  try {
    const created = await supabase<Array<Omit<PostRow, 'profiles'>>>('posts?select=id,author_address,body,image_url,created_at', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ author_address: session.address, body: text, image_url: imageUrl || null }) });
    return NextResponse.json({ post: created[0] }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not publish post.' }, { status: 503 }); }
}
