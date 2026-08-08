import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(request: NextRequest) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Community database is not configured.' }, { status: 503 });
  let body: { postId?: unknown; commentId?: unknown; reason?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid report.' }, { status: 400 }); }
  const postId = typeof body.postId === 'string' && UUID.test(body.postId) ? body.postId : null;
  const commentId = typeof body.commentId === 'string' && UUID.test(body.commentId) ? body.commentId : null;
  const reason = String(body.reason || '').trim();
  if ((!postId && !commentId) || !reason || reason.length > 1000) return NextResponse.json({ error: 'A valid target and report reason are required.' }, { status: 400 });
  try {
    await supabase('reports', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ reporter_address: session.address, post_id: postId, comment_id: commentId, reason }) });
    return NextResponse.json({ submitted: true }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not submit report.' }, { status: 503 }); }
}
