import { NextRequest, NextResponse } from 'next/server';
import { getBaseManualReply } from '../../../lib/base-help';

export const runtime = 'nodejs';

const APP_GUIDE = `You are InsiderBot, a helpful AI inside Base Insiders. Always answer in clear English, even if the user writes in another language. Answer any general question naturally and accurately. You can also explain this app's Feed, Following, Insiders news briefs, manually approved X sources, tasks/XP, profile, wallet sign-in, comments, reports, and safety. Be concise and practical unless the user asks for depth. For current news, prices, or live facts, say when you cannot verify them from current sources. Never request seed phrases, private keys, API keys, passwords, or wallet signatures. Never invent completed transactions, XP, news, or account verification.`;

type ChatMessage = { role?: unknown; content?: unknown };

function serverConfig() {
  const apiKey = process.env.AGENTROUTER_API_KEY?.trim();
  const model = process.env.AGENTROUTER_MODEL?.trim();
  const baseUrl = (process.env.AGENTROUTER_BASE_URL || 'https://agentrouter.org/v1').replace(/\/$/, '');
  return { apiKey, model, baseUrl };
}

export async function POST(request: NextRequest) {
  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const message = String(body.message || '').trim();
  if (!message || message.length > 1200) {
    return NextResponse.json({ error: 'Please send a message up to 1,200 characters.' }, { status: 400 });
  }

  // These answers are always available, including when no AI provider is set.
  const manualReply = getBaseManualReply(message);
  if (manualReply) return NextResponse.json({ reply: manualReply, source: 'base-manual' });

  const { apiKey, model, baseUrl } = serverConfig();
  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Exiros is available for Base help. Ask “Base links”, “Discord”, “how do I bridge?”, “check transaction”, or “Guild issue”.' }, { status: 503 });
  }
  const history = Array.isArray(body.history) ? body.history.slice(-8) as ChatMessage[] : [];
  const messages = [
    { role: 'system', content: APP_GUIDE },
    ...history
      .filter((item) => ['user', 'assistant'].includes(String(item?.role)) && typeof item?.content === 'string')
      .map((item) => ({ role: String(item.role), content: String(item.content).slice(0, 1200) })),
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        accept: 'application/json',
        // Keep a stable, descriptive server identity. The old local proxy sent
        // this too; it helps providers distinguish this server-side request
        // from an untrusted browser-origin request.
        'user-agent': 'Base-Insiders/1.0',
      },
      body: JSON.stringify({ model, temperature: 0.35, messages }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 1000);
      console.error(`AgentRouter rejected InsiderBot (${response.status}).`, detail);
      if (response.status === 401 || response.status === 403) {
        if (/unauthorized client/i.test(detail)) {
          return NextResponse.json({ error: 'AgentRouter blocked this server as an unauthorized client. Confirm the key and base URL with AgentRouter support, then restart or redeploy.' }, { status: 502 });
        }
        return NextResponse.json({ error: 'InsiderBot credentials were rejected. Set a current authorized AgentRouter key, then restart or redeploy.' }, { status: 502 });
      }
      if (response.status === 429) return NextResponse.json({ error: 'InsiderBot has reached its provider limit. Please try again later.' }, { status: 503 });
      return NextResponse.json({ error: 'InsiderBot is temporarily unavailable.' }, { status: 502 });
    }
    const payload = await response.json();
    const reply = String(payload.choices?.[0]?.message?.content || '').trim();
    if (!reply) throw new Error('AgentRouter returned an empty reply');
    return NextResponse.json({ reply: reply.slice(0, 3000) });
  } catch (error) {
    console.error('InsiderBot request failed.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'InsiderBot is temporarily unavailable.' }, { status: 502 });
  }
}
