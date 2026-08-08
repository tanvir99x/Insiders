/**
 * Deterministic, API-free answers for the most common Base community questions.
 * Keep links here limited to Base's official resources or the official services
 * named by Base. This is intentionally separate from the AI fallback.
 */
const LINKS = {
  website: 'https://base.org/',
  discord: 'https://base.org/discord',
  docs: 'https://docs.base.org/',
  ecosystem: 'https://base.org/ecosystem',
  status: 'https://status.base.org/',
  bridge: 'https://bridge.base.org/',
  bridgeTestnet: 'https://sepolia-bridge.base.org/',
  explorer: 'https://basescan.org/',
  testnetExplorer: 'https://sepolia.basescan.org/',
  faucet: 'https://app.optimism.io/faucet',
  wallet: 'https://wallet.coinbase.com/',
  guild: 'https://guild.xyz/base',
  github: 'https://github.com/base-org',
  build: 'https://base.org/build',
  farcaster: 'https://warpcast.com/base',
  telegram: 'https://t.me/base_announcements',
  x: 'https://x.com/base',
} as const;

const reply = (text: string) => text;

export function getBaseManualReply(question: string): string | null {
  const text = question.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) return null;

  if (/^(\/|!)(help|base|links|commands)$/.test(text) || /official (base )?(links|resources)|base links/.test(text)) {
    return reply(`Official Base quick links\n• Website: ${LINKS.website}\n• Discord: ${LINKS.discord}\n• Docs: ${LINKS.docs}\n• Ecosystem: ${LINKS.ecosystem}\n• Status: ${LINKS.status}\n• Bridge: ${LINKS.bridge}\n• Explorer: ${LINKS.explorer}\n\nAsk “how do I bridge?”, “check transaction”, “Guild issue”, or “Discord”.`);
  }
  if (/discord|server|ban appeal|moderator/.test(text)) {
    return reply(`Base Discord: ${LINKS.discord}\n\nUse this official invite rather than links sent in DMs. Read the server rules, never share your seed phrase or private key, and tag a Base Moderator if you are unsure whether a link is official. For a ban appeal, use the form linked in the official Discord.`);
  }
  if (/bridge|deposit.*base|move.*base|send.*base.*(eth|usdc|fund)/.test(text)) {
    return reply(`How to bridge to Base Mainnet\n1. Open the official bridge: ${LINKS.bridge}\n2. Connect your wallet and choose the source network and asset.\n3. Check the amount, fees, destination address, and network before approving.\n4. Approve only the requests you understand, then wait for the bridge status to complete.\n\nTestnet bridge: ${LINKS.bridgeTestnet}\nNever use a bridge link from a DM. Keep a small amount of ETH on Base for gas after bridging.`);
  }
  if (/(transaction|tx|hash|receipt|pending|failed|confirm|explorer|basescan)/.test(text)) {
    return reply(`Check a Base transaction\n1. Copy the transaction hash (TX hash) from your wallet.\n2. Paste it into BaseScan: ${LINKS.explorer}\n3. Check Status, From/To, Value, and the network.\n\nIf it is pending, do not send the same transfer again until you understand its status. If it failed, BaseScan's error/revert details may help; the network fee can still be spent. For testnet transactions use ${LINKS.testnetExplorer}. Never give a support person your seed phrase or private key.`);
  }
  if (/guild|role|quest|verify.*role|membership/.test(text)) {
    return reply(`Official Base Guild: ${LINKS.guild}\n\nCommon fixes: connect the same wallet/account used for the requirement, refresh the Guild page after an onchain action confirms, and check that you are on the required network. If a role still does not appear, read that Guild requirement carefully and contact the Guild/Base community support channel—do not pay anyone in DMs to “unlock” a role.`);
  }
  if (/faucet|testnet.*eth|sepolia/.test(text)) {
    return reply(`For Base Sepolia testnet ETH, use the Optimism Superchain Faucet: ${LINKS.faucet}\n\nTestnet assets have no real value. Confirm that your wallet is on Base Sepolia before testing, and use the testnet explorer to inspect transactions: ${LINKS.testnetExplorer}`);
  }
  if (/wallet|seed phrase|private key|scam|drain|approve|signature/.test(text)) {
    return reply(`Wallet safety\n• Never share a seed phrase, private key, password, or recovery code.\n• Do not trust “support” DMs or urgent airdrop/verification links.\n• Read every signature, approval, and transaction; a sign-in message should not transfer funds.\n• Use only official links, starting with ${LINKS.website} or ${LINKS.discord}.\n\nCoinbase Wallet: ${LINKS.wallet}`);
  }
  if (/build|developer|deploy|contract|rpc|github|documentation|docs/.test(text)) {
    return reply(`Build on Base\n• Developer documentation: ${LINKS.docs}\n• Builder resources: ${LINKS.build}\n• Base GitHub: ${LINKS.github}\n• Find ecosystem tools: ${LINKS.ecosystem}\n\nStart with the official docs and test on Base Sepolia before deploying to mainnet. Never put private keys in frontend code or a public repository.`);
  }
  if (/base name|\.base\.eth|basename|ens/.test(text)) {
    return reply(`A .base.eth name is an onchain identity. Use Base's official website and wallet resources to begin: ${LINKS.website}\n\nBefore registering, confirm the exact name, registration period, price, and the wallet/network shown in your wallet. Treat names advertised through DMs as untrusted.`);
  }
  if (/farcaster|warpcast|social/.test(text)) {
    return reply(`Base on Farcaster: ${LINKS.farcaster}\n\nYou can also find Base community and builder conversations through the official Base channels. Verify profiles and links before signing any wallet request.`);
  }
  if (/status|outage|down|network problem|network issue/.test(text)) {
    return reply(`Check Base network status first: ${LINKS.status}\n\nIf there is no incident, confirm you selected Base Mainnet in your wallet, refresh your wallet/app, and inspect the transaction on BaseScan: ${LINKS.explorer}`);
  }
  if (/telegram|twitter|\bx\b|social.*base/.test(text)) {
    return reply(`Official Base social links\n• X: ${LINKS.x}\n• Telegram announcements: ${LINKS.telegram}\n• Farcaster: ${LINKS.farcaster}\n\nUse official profiles to avoid impersonators.`);
  }
  return null;
}
