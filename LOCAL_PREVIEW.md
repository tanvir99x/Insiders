# Local preview before deployment

1. Copy `.env.example` to a new file named `.env.local`.
2. Add your server-only keys and enabled AgentRouter model:

   ```env
   NEYNAR_API_KEY=your_key_here
   AGENTROUTER_API_KEY=your_key_here
   AGENTROUTER_BASE_URL=https://agentrouter.org/v1
   AGENTROUTER_MODEL=your_enabled_model_name
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SESSION_SECRET=a_long_random_secret
   ```

3. Install the app dependencies, then start Next.js:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), not the static HTML file directly. The home route opens the existing app UI with no visual redesign. Connect the wallet and Farcaster, then refresh the profile. Follower count, following count and Neynar score will use real data. InsiderBot is served at `/api/chat`.

`python3 -m http.server` only serves static files and cannot run the secure API routes. Use the command above for the complete preview.

For Vercel, set `AGENTROUTER_API_KEY`, `AGENTROUTER_BASE_URL`, `AGENTROUTER_MODEL`, and `NEYNAR_API_KEY` in Project Settings → Environment Variables for Production, Preview, and Development as needed. Redeploy after any environment-variable change. A 401/403 from AgentRouter means the key is invalid, revoked, expired, or not permitted for the configured base URL—not a browser or Next.js route failure.

## Community database and wallet auth

Run [`supabase/migrations/001_community.sql`](supabase/migrations/001_community.sql) in the Supabase SQL editor before enabling production traffic. Then set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a freshly generated `SESSION_SECRET` in Vercel. The service-role key is server-only: do not put it in `public/config.js` or any `NEXT_PUBLIC_` variable.

## X sign-in and support

To enable real X OAuth sign-in, create an OAuth 2.0 application in the X Developer Portal and add this callback URL exactly:

```text
https://YOUR_DOMAIN/api/x/callback
```

Then set `X_CLIENT_ID` and `X_CLIENT_SECRET` in Vercel. The app uses PKCE and requests only the `users.read` scope to display the connected public username; it does not read posts, followers, or messages, and it discards the access token immediately.

Before launch, set a monitored public `supportEmail` value in `public/config.js`. Reports open the user’s mail app addressed to this inbox, so they can reach the moderation team without a report being falsely represented as server-submitted.
