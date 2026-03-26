/**
 * src/config/env.ts
 * Typed, validated accessor for all Vite environment variables.
 * Import from here — never use import.meta.env directly.
 */

function required(key: string): string {
  const val = import.meta.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val as string;
}

export const ENV = {
  /** The permanent admin wallet address (set in .env) */
  ADMIN_ADDRESS: (import.meta.env.REACT_APP_ADMIN_WALLET as string ?? '').toLowerCase(),

  /** IPFS HTTP API base URL */
  IPFS_API: (import.meta.env.REACT_APP_IPFS_API_URL as string) ?? 'http://127.0.0.1:5001',

  /** IPFS Gateway for fetching by CID */
  IPFS_GATEWAY: (import.meta.env.REACT_APP_IPFS_GATEWAY as string) ?? 'http://127.0.0.1:8082',

  /** Smart Contract Address */
  CONTRACT_ADDRESS: (import.meta.env.REACT_APP_CONTRACT_ADDRESS as string) ?? '',

  /** Expected blockchain chain ID (Ganache = 1337) */
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID ?? 1337),

  /** Salt for AES key derivation */
  AES_SALT: (import.meta.env.VITE_AES_SALT as string) ?? 'chainedu-v1-salt-2025',

  /** App metadata */
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) ?? 'ChainEdu',
  APP_URL:  (import.meta.env.VITE_APP_URL as string)  ?? 'http://localhost:8081',
} as const;

/**
 * Returns true if the given wallet address matches the admin address from .env
 */
export function isAdminAddress(address: string): boolean {
  return address.toLowerCase() === ENV.ADMIN_ADDRESS.toLowerCase();
}
