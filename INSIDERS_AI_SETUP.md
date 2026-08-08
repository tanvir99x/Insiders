# AI-curated Insiders updates

The app now uses a safe, free server flow:

`moderator-approved X post -> AgentRouter writes an attributed brief -> Insiders tab`

AgentRouter is the optional editor, not the source of truth. It does not discover or verify live X posts. This design preserves a link back to every original post and leaves account verification to the moderator who selected it. If its key or model is unavailable, the app still shows a compact excerpt of each moderator-approved source post.

## Configure secrets

Never put keys in `public/config.js`, `public/insiders-news.js`, HTML, or a git commit. Add these to Vercel Project Settings → Environment Variables (and to an untracked `.env.local` for `npm run dev`):

| Variable | Value |
| --- | --- |
| `AGENTROUTER_API_KEY` | A newly rotated AgentRouter key. |
| `AGENTROUTER_BASE_URL` | `https://agentrouter.org/v1` |
| `AGENTROUTER_MODEL` | Your enabled model, e.g. `gpt-5.6` (use the exact model name available in your AgentRouter account). |

## Add a selected X post

Edit `public/data/insiders-sources.json` and replace the included example with your source objects. Before adding one, open the source link yourself and check that the account is verified and is one you have selected. Paste the source text exactly, then deploy. The API accepts only `x.com`/`twitter.com` source links, ranks by your optional `priority`, and caches the AI brief for five minutes. Add `author.avatar` for the source profile picture and `image` for an optional post image. For reliable free local testing, save the two images inside `public/data/` and use paths such as `/data/base-avatar.png` and `/data/base-post.jpg`.

## Test

For a local test, run `npm install` once, then `npm run dev`; open `http://localhost:3000`, then open the Insiders tab and press Refresh. Next.js reads `.env.local` and provides `/api/insiders-news`. A successful response has `posts`, and each post includes the original `https://x.com/.../status/...` URL.

There is no reliable, authorized way to continuously discover the latest posts from arbitrary X accounts for free. Do not use browser scraping or an unofficial scraper for this app. The UI will keep showing the existing editorial fallback if the news editor is unavailable.

## Security action

A key was pasted into this chat. Revoke it in AgentRouter immediately, create a new one, and store only the replacement as `AGENTROUTER_API_KEY` in Vercel or `.env.local`.
