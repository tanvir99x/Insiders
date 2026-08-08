import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const profile = JSON.parse(decodeURIComponent(request.cookies.get('base_insiders_x_profile')?.value || ''));
    if (typeof profile?.username !== 'string') throw new Error('Invalid profile');
    return NextResponse.json({ id: String(profile.id || ''), username: profile.username, name: String(profile.name || '') });
  } catch {
    return NextResponse.json({ connected: false }, { status: 404 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ disconnected: true });
  response.cookies.set('base_insiders_x_profile', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
