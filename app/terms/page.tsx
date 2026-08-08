import styles from '../legal.module.css';

export const metadata = { title: 'Terms of Use | Base Insiders' };

export default function TermsPage() {
  return <main className={styles.page}><article className={styles.content}>
    <span className={styles.eyebrow}>BASE INSIDERS · TERMS</span>
    <h1>Terms of Use</h1><p>Last updated: August 7, 2026</p>
    <p className={styles.note}>These are a product baseline, not legal advice. Obtain legal review before launching publicly or processing personal data at scale.</p>
    <h2>Community conduct</h2><p>Use Base Insiders lawfully and respectfully. Do not impersonate others, publish harmful or illegal content, manipulate engagement, or attempt to disrupt the app or its users.</p>
    <h2>Wallet safety</h2><p>You control your wallet and transactions. Base Insiders never asks for a seed phrase, private key, password, or recovery code. Review every wallet prompt and transaction in your wallet before approving it.</p>
    <h2>Content and moderation</h2><p>You remain responsible for content you submit. Reported content may be reviewed by the operator when a moderation contact is configured. The operator may remove access or content to protect users and the service.</p>
    <h2>Availability</h2><p>The app and third-party integrations are provided as available and may change, pause, or stop. Community data in the current version may be local to the device and should not be treated as a permanent backup.</p>
    <h2>Contact</h2><p>For support or moderation questions, use the contact in the app’s Safety &amp; support panel.</p>
  </article></main>;
}
