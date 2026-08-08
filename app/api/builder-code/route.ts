import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BASE_RPC_URL = 'https://mainnet.base.org';
const ERC_8021_MARKER = '80218021802180218021802180218021';
const EXPECTED_BUILDER_CODE = 'bc_thovbfqm';

function parseAttribution(input: unknown) {
  const data = String(input || '').toLowerCase().replace(/^0x/, '');
  if (!data.endsWith(ERC_8021_MARKER)) return { detected: false, schemaId: null, codes: [] as string[] };

  // ERC-8021 is parsed backwards: schema ID sits immediately before the
  // 16-byte marker. Schema 0 then has one byte of code length before it.
  const schemaOffset = data.length - ERC_8021_MARKER.length - 2;
  if (schemaOffset < 0) return { detected: true, schemaId: null, codes: [] as string[] };
  const schemaId = Number.parseInt(data.slice(schemaOffset, schemaOffset + 2), 16);
  if (schemaId !== 0) return { detected: true, schemaId, codes: [] as string[] };
  const lengthOffset = schemaOffset - 2;
  if (lengthOffset < 0) return { detected: true, schemaId, codes: [] as string[] };
  const codeLength = Number.parseInt(data.slice(lengthOffset, schemaOffset), 16);
  const codeStart = lengthOffset - codeLength * 2;
  if (!Number.isFinite(codeLength) || codeLength < 1 || codeStart < 0) return { detected: true, schemaId, codes: [] as string[] };
  try {
    const text = Buffer.from(data.slice(codeStart, lengthOffset), 'hex').toString('utf8');
    const codes = text.split(',').filter((code) => /^bc_[a-z0-9_-]+$/i.test(code));
    return { detected: true, schemaId, codes };
  } catch {
    return { detected: true, schemaId, codes: [] as string[] };
  }
}

export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get('hash') || '';
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return NextResponse.json({ error: 'Enter a valid Base transaction hash.' }, { status: 400 });
  }
  try {
    const response = await fetch(BASE_RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionByHash', params: [hash] }),
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Base RPC returned ${response.status}`);
    const payload = await response.json();
    const transaction = payload?.result;
    if (!transaction) return NextResponse.json({ error: 'Transaction was not found on Base Mainnet. It may still be pending, be on another network, or be a UserOperation hash.' }, { status: 404 });
    const attribution = parseAttribution(transaction.input || transaction.data);
    return NextResponse.json({
      hash: transaction.hash,
      detected: attribution.detected,
      schemaId: attribution.schemaId,
      builderCodes: attribution.codes,
      expectedCode: EXPECTED_BUILDER_CODE,
      expectedCodeFound: attribution.codes.includes(EXPECTED_BUILDER_CODE),
      explorerUrl: `https://basescan.org/tx/${transaction.hash}`,
    }, { headers: { 'Cache-Control': 'private, max-age=30' } });
  } catch (error) {
    console.error('Builder code check failed.', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not check this transaction right now.' }, { status: 502 });
  }
}
