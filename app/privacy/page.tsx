import styles from '../legal.module.css';

export const metadata = { title: 'Privacy Policy | Base Insiders' };

export default function PrivacyPage() {
  return <main className={styles.page}><article className={styles.content}>
    <span className={styles.eyebrow}>BASE INSIDERS · PRIVACY</span>
    <h1>Privacy Policy</h1><p>Last updated: August 7, 2026</p>
    <p className={styles.note}>This policy describes the current app behaviour. It should be reviewed by a qualified lawyer before a public commercial launch.</p>
    <h2>Information used</h2><p>Base Insiders may process a wallet address, a connected Farcaster or X public profile, content you enter, and basic browser storage needed to keep your local profile, posts, tasks, comments and preferences on your device.</p>
    <h2>Third-party services</h2><p>Wallet connection is provided by Coinbase Wallet. Farcaster data may be provided through Neynar. Optional X sign-in is provided by X. AI chat and curated briefs are processed by the configured server-side AI provider. Each service has its own privacy policy.</p>
    <h2>Storage and sharing</h2><p>Most community activity in the current version is stored locally in your browser. Server APIs process requests to provide the requested feature; secrets are not sent to the browser. Do not submit seed phrases, private keys, passwords, or sensitive personal information.</p>
    <h2>Your choices</h2><p>You can disconnect social accounts, clear browser storage, or stop using the app at any time. X access tokens are discarded after identity retrieval; only the public X identity is retained in a secure session cookie. The X connection does not read posts, followers, or messages.</p>
    <h2>Contact</h2><p>For privacy questions, use the support contact published in the app’s Safety &amp; support panel.</p>
  </article></main>;
}
