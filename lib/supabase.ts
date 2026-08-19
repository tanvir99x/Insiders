type Json = Record<string, unknown> | unknown[];

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return { url, key };
}

/** Minimal server-only PostgREST client. The service-role key never reaches the browser. */
export async function supabase<T = Json>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  if (response.status === 204) return undefined as T;
  // PostgREST returns 201 with an empty body unless return=representation is
  // requested. Treat that successful empty response as a valid mutation.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
