/* API-free answers for Exiros. Keep these links official and in sync with lib/base-help.ts. */
(function () {
  const l = {
    website: 'https://base.org/', discord: 'https://base.org/discord', docs: 'https://docs.base.org/',
    ecosystem: 'https://base.org/ecosystem', status: 'https://status.base.org/', bridge: 'https://bridge.base.org/',
    bridgeTestnet: 'https://sepolia-bridge.base.org/', explorer: 'https://basescan.org/',
    testnetExplorer: 'https://sepolia.basescan.org/', faucet: 'https://app.optimism.io/faucet',
    wallet: 'https://wallet.coinbase.com/', guild: 'https://guild.xyz/base', github: 'https://github.com/base-org',
    build: 'https://base.org/build', farcaster: 'https://warpcast.com/base', telegram: 'https://t.me/base_announcements', x: 'https://x.com/base'
  };
  window.getBaseManualReply = function (question) {
    const q = String(question || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!q) return null;
    if (/^(\/|!)(help|base|links|commands)$/.test(q) || /official (base )?(links|resources)|base links/.test(q)) return `Official Base quick links\n• Website: ${l.website}\n• Discord: ${l.discord}\n• Docs: ${l.docs}\n• Ecosystem: ${l.ecosystem}\n• Status: ${l.status}\n• Bridge: ${l.bridge}\n• Explorer: ${l.explorer}\n\nAsk “how do I bridge?”, “check transaction”, “Guild issue”, or “Discord”.`;
    if (/discord|server|ban appeal|moderator/.test(q)) return `Base Discord: ${l.discord}\n\nUse this official invite rather than links sent in DMs. Read the server rules, never share your seed phrase or private key, and tag a Base Moderator if you are unsure whether a link is official. For a ban appeal, use the form linked in the official Discord.`;
    if (/bridge|deposit.*base|move.*base|send.*base.*(eth|usdc|fund)/.test(q)) return `How to bridge to Base Mainnet\n1. Open the official bridge: ${l.bridge}\n2. Connect your wallet and choose the source network and asset.\n3. Check the amount, fees, destination address, and network before approving.\n4. Approve only requests you understand, then wait for the bridge status to complete.\n\nTestnet bridge: ${l.bridgeTestnet}\nNever use a bridge link from a DM. Keep a small amount of ETH on Base for gas after bridging.`;
    if (/(transaction|tx|hash|receipt|pending|failed|confirm|explorer|basescan)/.test(q)) return `Check a Base transaction\n1. Copy the transaction hash (TX hash) from your wallet.\n2. Paste it into BaseScan: ${l.explorer}\n3. Check Status, From/To, Value, and the network.\n\nIf it is pending, do not send the same transfer again. If it failed, BaseScan's error/revert details may help; the network fee can still be spent. For testnet use ${l.testnetExplorer}. Never give support your seed phrase or private key.`;
    if (/guild|role|quest|verify.*role|membership/.test(q)) return `Official Base Guild: ${l.guild}\n\nCommon fixes: connect the same wallet/account used for the requirement, refresh Guild after an onchain action confirms, and check the required network. If a role still does not appear, read its requirement and contact community support—never pay a DM to “unlock” a role.`;
    if (/faucet|testnet.*eth|sepolia/.test(q)) return `For Base Sepolia testnet ETH, use the Optimism Superchain Faucet: ${l.faucet}\n\nTestnet assets have no real value. Confirm your wallet is on Base Sepolia, then check transactions at ${l.testnetExplorer}`;
    if (/wallet|seed phrase|private key|scam|drain|approve|signature/.test(q)) return `Wallet safety\n• Never share a seed phrase, private key, password, or recovery code.\n• Do not trust “support” DMs or urgent airdrop/verification links.\n• Read every signature, approval, and transaction.\n• Use official links, starting with ${l.website} or ${l.discord}.\n\nCoinbase Wallet: ${l.wallet}`;
    if (/build|developer|deploy|contract|rpc|github|documentation|docs/.test(q)) return `Build on Base\n• Developer documentation: ${l.docs}\n• Builder resources: ${l.build}\n• Base GitHub: ${l.github}\n• Ecosystem tools: ${l.ecosystem}\n\nTest on Base Sepolia before deploying to mainnet. Never put private keys in frontend code or a public repository.`;
    if (/base name|\.base\.eth|basename|ens/.test(q)) return `A .base.eth name is an onchain identity. Start from Base’s official resources: ${l.website}\n\nBefore registering, confirm the exact name, duration, price, wallet, and network. Treat names advertised through DMs as untrusted.`;
    if (/farcaster|warpcast|social/.test(q)) return `Base on Farcaster: ${l.farcaster}\n\nVerify profiles and links before signing a wallet request.`;
    if (/status|outage|down|network problem|network issue/.test(q)) return `Check Base network status first: ${l.status}\n\nIf there is no incident, confirm you selected Base Mainnet, refresh your wallet/app, and inspect the transaction on BaseScan: ${l.explorer}`;
    if (/telegram|twitter|\bx\b|social.*base/.test(q)) return `Official Base social links\n• X: ${l.x}\n• Telegram announcements: ${l.telegram}\n• Farcaster: ${l.farcaster}\n\nUse official profiles to avoid impersonators.`;
    return null;
  };
}());
