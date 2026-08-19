import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'base_insiders_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type Session = { address: string; exp: number };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');
  return value;
}

function signature(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function encode(session: Session) {
  const value = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${value}.${signature(value)}`;
}

export function createSessionToken(address: string) {
  return encode({ address: address.toLowerCase(), exp: Date.now() + MAX_AGE_SECONDS * 1000 });
}

export function readSession(request: NextRequest): Session | null {
  try {
    const authorization = request.headers.get('authorization');
    const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const raw = request.cookies.get(COOKIE)?.value || bearer;
    if (!raw) return null;
    const [value, received] = raw.split('.');
    if (!value || !received) return null;
    const expected = signature(value);
    if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return null;
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString()) as Session;
    if (!/^0x[a-fA-F0-9]{40}$/.test(parsed.address) || !Number.isFinite(parsed.exp) || parsed.exp <= Date.now()) return null;
    return { address: parsed.address.toLowerCase(), exp: parsed.exp };
  } catch { return null; }
}

export function setSession(response: NextResponse, address: string) {
  response.cookies.set(COOKIE, createSessionToken(address), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}
