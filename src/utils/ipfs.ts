/**
 * src/utils/ipfs.ts
 *
 * IPFS HTTP client singleton — uses kubo-rpc-client (compatible with Kubo v0.40.1).
 *
 * Your IPFS Desktop shows:
 *   GATEWAY  http://127.0.0.1:8082
 *   KUBO RPC /ip4/127.0.0.1/tcp/5001
 *
 * Vite proxies /ipfs-api → http://127.0.0.1:5001 (see vite.config.ts)
 * so VITE_IPFS_API=http://localhost:8080/ipfs-api
 *
 * CORS setup (do once in IPFS Desktop → Settings → JSON):
 *   "API": {
 *     "HTTPHeaders": {
 *       "Access-Control-Allow-Origin": ["http://localhost:8080","http://127.0.0.1:8080"],
 *       "Access-Control-Allow-Methods": ["PUT","POST","GET","DELETE","OPTIONS"],
 *       "Access-Control-Allow-Headers": ["Authorization","Content-Type"]
 *     }
 *   }
 * Then restart IPFS Desktop.
 */

import { create, type KuboRPCClient } from 'kubo-rpc-client';
import { ENV } from '@/config/env';

// ─── Singleton client ────────────────────────────────────────
let _client: KuboRPCClient | null = null;

export function getIPFSClient(): KuboRPCClient {
  if (!_client) {
    // During development the Vite proxy forwards /ipfs-api → 127.0.0.1:5001
    // so we get zero CORS issues. In production point directly to your node.
    _client = create({ url: ENV.IPFS_API });
  }
  return _client;
}

// ─── Health check ────────────────────────────────────────────
export async function checkIPFSConnection(): Promise<{
  ok: boolean;
  peerId?: string;
  version?: string;
  error?: string;
}> {
  try {
    const client = getIPFSClient();
    const id = await client.id();
    const ver = await client.version();
    return {
      ok: true,
      peerId: id.id.toString(),
      version: ver.version,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'IPFS unreachable' };
  }
}

// ─── Add content (returns CID string) ─────────────────────────
export async function ipfsAdd(
  content: string | Uint8Array,
  pin = true,
): Promise<string> {
  const client = getIPFSClient();
  const result = await client.add(content, { pin });
  return result.cid.toString();
}

// ─── Fetch content by CID ─────────────────────────────────────
export async function ipfsCat(cid: string): Promise<string> {
  const client = getIPFSClient();
  const chunks: Uint8Array[] = [];
  for await (const chunk of client.cat(cid)) {
    chunks.push(chunk as Uint8Array);
  }
  const total = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    total.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(total);
}

// ─── Pin a CID so it survives GC ──────────────────────────────
export async function ipfsPin(cid: string): Promise<void> {
  const client = getIPFSClient();
  await client.pin.add(cid);
}
