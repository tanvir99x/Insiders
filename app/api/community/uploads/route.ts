import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/session';
import { isSupabaseConfigured, supabaseConfig } from '@/lib/supabase';

export const runtime = 'nodejs';

const BUCKET = 'community-images';
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function storageHeaders(key: string, extra: HeadersInit = {}) {
  return { apikey: key, authorization: `Bearer ${key}`, ...extra };
}

async function ensureBucket(url: string, key: string) {
  const bucket = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers: storageHeaders(key) });
  if (bucket.ok) return;
  if (bucket.status !== 404) throw new Error(`Could not check storage bucket (${bucket.status}).`);
  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: storageHeaders(key, { 'content-type': 'application/json' }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: Object.keys(EXTENSIONS) }),
  });
  // Another concurrent upload can create it first.
  if (!created.ok && created.status !== 409) throw new Error(`Could not create storage bucket (${created.status}).`);
}

export async function POST(request: NextRequest) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Community database is not configured.' }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get('image');
    if (!(file instanceof File) || !EXTENSIONS[file.type] || file.size < 1 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Upload a JPG, PNG, WebP, or GIF image no larger than 5 MB.' }, { status: 400 });
    }
    const { url, key } = supabaseConfig();
    await ensureBucket(url, key);
    const objectPath = `${session.address}/${randomUUID()}.${EXTENSIONS[file.type]}`;
    const uploaded = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
      method: 'POST',
      headers: storageHeaders(key, { 'content-type': file.type, 'x-upsert': 'false' }),
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!uploaded.ok) throw new Error(`Could not upload image (${uploaded.status}).`);
    return NextResponse.json({ imageUrl: `${url}/storage/v1/object/public/${BUCKET}/${objectPath}` }, { status: 201 });
  } catch (error) {
    console.error('Could not upload community image.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not upload image. Please try again.' }, { status: 503 });
  }
}
