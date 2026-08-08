import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function postId(value: string) { return /^[0-9a-f-]{36}$/i.test(value); }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!postId(id)) return NextResponse.json({ error: 'Invalid post.' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Community database is not configured.' }, { status: 503 });
  try {
    const comments = await supabase(`comments?post_id=eq.${id}&is_deleted=eq.false&select=id,parent_id,body,created_at,author_address,profiles(display_name,handle,avatar_url)&order=created_at.asc`);
    return NextResponse.json({ comments });
  } catch { return NextResponse.json({ error: 'Could not load comments.' }, { status: 503 }); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = readSession(request);
  const { id } = await params;
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!postId(id)) return NextResponse.json({ error: 'Invalid post.' }, { status: 400 });
  let body: { body?: unknown; parentId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid comment.' }, { status: 400 }); }
  const text = String(body.body || '').trim();
  const parentId = typeof body.parentId === 'string' && postId(body.parentId) ? body.parentId : null;
  if (!text || text.length > 2000) return NextResponse.json({ error: 'Comment must be between 1 and 2,000 characters.' }, { status: 400 });
  try {
    const created = await supabase('comments?select=id,parent_id,body,created_at,author_address', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ post_id: id, author_address: session.address, parent_id: parentId, body: text }) });
    return NextResponse.json({ comment: Array.isArray(created) ? created[0] : created }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not publish comment.' }, { status: 503 }); }
}
