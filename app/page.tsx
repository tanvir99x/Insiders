import { redirect } from 'next/navigation';

/**
 * The existing browser application remains an unmodified static document so
 * its visual design and client-side wallet/Farcaster behaviour stay intact.
 * Its assets now live under public/ and are served by the Next.js application.
 */
export default function HomePage() {
  // The static client app is served from public/index.html.
  redirect('/index.html');
}
