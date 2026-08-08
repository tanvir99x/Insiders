import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type SourcePost = { id: string; url: string; text: string; author: { handle: string }; priority?: number; [key: string]: unknown };
let cached: { expiresAt: number; posts: SourcePost[] } | undefined;

function validSource(post: SourcePost) {
  try {
    const host = new URL(post.url).hostname.replace(/^www\./, '');
    return (host === 'x.com' || host === 'twitter.com') && post.id && post.text && post.author?.handle;
  } catch { return false; }
}

function fallbackBrief(post: SourcePost) {
  const compact = post.text.replace(/\s+/g, ' ').trim();
  return compact.length > 280 ? `${compact.slice(0, 277)}…` : compact;
}

async function loadSources() {
  const raw = await readFile(path.join(process.cwd(), 'public', 'data', 'insiders-sources.json'), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed as SourcePost[] : [];
}

async function curate(posts: SourcePost[], apiKey: string, model: string, baseUrl: string) {
  const source = posts.map(({ id, author, text, createdAt, url }) => ({ id, author, text, createdAt, url }));
  const instructions = 'You are the careful editor for Base Insiders. Write one concise factual brief for every supplied post. Only use facts in that exact source. Do not add claims, predictions, prices, or urgency. Do not call a post verified, official, breaking, or confirmed unless its text says so. Return strict JSON only: {"posts":[{"id":"source id","brief":"max 280 chars"}]}. Include every source id exactly once and no markdown.';
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'Base-Insiders/1.0',
      },
      body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: 'system', content: instructions }, { role: 'user', content: JSON.stringify(source) }] }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`AgentRouter returned ${response.status}`);
    const output = (await response.json()).choices?.[0]?.message?.content || '';
    const match = String(output).match(/\{[\s\S]*\}/);
    const generated = JSON.parse(match ? match[0] : output).posts;
    const briefs = new Map((Array.isArray(generated) ? generated : []).map((item) => [String(item.id), String(item.brief || '')]));
    return posts.map((post) => ({ ...post, brief: briefs.get(post.id) || fallbackBrief(post) }));
  } catch (error) {
    console.error('AI news curation failed; serving source excerpts.', error instanceof Error ? error.message : error);
    return posts.map((post) => ({ ...post, brief: fallbackBrief(post) }));
  }
}

export async function GET() {
  const apiKey = process.env.AGENTROUTER_API_KEY?.trim();
  const model = process.env.AGENTROUTER_MODEL?.trim();
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json({ posts: cached.posts, cached: true });
  try {
    const posts = (await loadSources()).filter(validSource).sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 10);
    if (!posts.length) return NextResponse.json({ posts: [], cached: false });
    const baseUrl = (process.env.AGENTROUTER_BASE_URL || 'https://agentrouter.org/v1').replace(/\/$/, '');
    // Source excerpts remain useful when the optional AI editor is unavailable.
    // They are safer than inventing a summary and preserve the source attribution.
    const curated = apiKey && model
      ? await curate(posts, apiKey, model, baseUrl)
      : posts.map((post) => ({ ...post, brief: fallbackBrief(post) }));
    cached = { posts: curated, expiresAt: Date.now() + 5 * 60_000 };
    return NextResponse.json({ posts: curated, cached: false, aiCurated: Boolean(apiKey && model) }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' } });
  } catch (error) {
    console.error('Could not prepare Insiders news.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Insiders news is temporarily unavailable.' }, { status: 500 });
  }
}
