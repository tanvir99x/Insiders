/* Replace these two values with Project Settings > API values from Supabase. */
window.BASE_INSIDERS_CONFIG = {
  supabaseUrl: 'PASTE_YOUR_SUPABASE_URL_HERE',
  supabaseAnonKey: 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE',

  // Production wallet-auth API. It issues one-time nonces and verifies SIWE
  // signatures server-side before setting an HttpOnly session cookie.
  // The API must issue a one-time nonce, verify the SIWE signature, and set an
  // HttpOnly session cookie. Expected endpoints: GET /auth/nonce?address=…
  // and POST /auth/verify.
  authApiUrl: '/api',

  // X OAuth is intentionally disabled for the free first launch.
  enableXSignIn: false,

  // Farcaster social-data proxy. Leave this as /api/farcaster when deploying to
  // Vercel with api/farcaster.js, or change it to your own authenticated API.
  // Never put a Neynar API key in this public file: the proxy reads
  // NEYNAR_API_KEY from its server environment instead.
  farcasterSocialApiUrl: '/api/farcaster',

  // AI-curated X updates. This URL deliberately contains no API credentials.
  insidersNewsApiUrl: '/api/insiders-news',

  // Public support address shown in the footer and used for report hand-off.
  // Set this to an inbox you actively monitor before launching.
  supportEmail: 'baseinsiders@gmail.com'
};
