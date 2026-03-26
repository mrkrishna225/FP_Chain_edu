/**
 * src/utils/aes.ts
 *
 * Real AES-256-CBC encryption/decryption using the Web Crypto API.
 * NO external library — runs natively in any modern browser.
 *
 * Key derivation:
 *   PBKDF2( password + walletPrefix, ENV.AES_SALT, 100000 iter, SHA-256 ) → 256-bit key
 *
 * Wallet padding convention:
 *   Output format: <walletPrefix>_<base64(iv+ciphertext)>_<walletSuffix>
 *   where walletPrefix = walletAddr.slice(0,4).toLowerCase()
 *         walletSuffix = walletAddr.slice(-4).toLowerCase()
 *
 * This means every encrypted blob is identifiable by wallet address
 * but the content is fully encrypted.
 */

import { ENV } from '@/config/env';

// ─── Key derivation ──────────────────────────────────────────

async function deriveKey(password: string, walletAddr: string): Promise<CryptoKey> {
  const prefix = walletAddr.slice(0, 4).toLowerCase();
  const suffix = walletAddr.slice(-4).toLowerCase();
  const rawPassword = `${password}_${prefix}${suffix}_${ENV.AES_SALT}`;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(rawPassword),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(ENV.AES_SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ─── Base64 helpers ──────────────────────────────────────────

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Encrypt plaintext with AES-256-CBC.
 *
 * @param plaintext   The string to encrypt (e.g. JSON.stringify(paper))
 * @param password    A secret password/passphrase (e.g. teacher's wallet address)
 * @param walletAddr  The wallet address used for key derivation & padding
 * @returns           Encrypted string with wallet prefix/suffix padding
 */
export async function encryptAES(
  plaintext: string,
  password: string,
  walletAddr: string,
): Promise<string> {
  const key = await deriveKey(password, walletAddr);
  const iv  = crypto.getRandomValues(new Uint8Array(16));

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  // Combine IV + ciphertext into a single buffer, then base64 encode
  const combined = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.byteLength);

  const b64 = toBase64(combined.buffer);
  const prefix = walletAddr.slice(0, 4).toLowerCase();
  const suffix = walletAddr.slice(-4).toLowerCase();

  // Format: PREFIX_BASE64PAYLOAD_SUFFIX
  return `${prefix}_${b64}_${suffix}`;
}

/**
 * Decrypt a string produced by encryptAES.
 *
 * @param ciphertext  The padded encrypted string
 * @param password    The same password used during encryption
 * @param walletAddr  The same wallet address used during encryption
 * @returns           Decrypted plaintext string
 */
export async function decryptAES(
  ciphertext: string,
  password: string,
  walletAddr: string,
): Promise<string> {
  // Strip wallet prefix/suffix padding
  const parts = ciphertext.split('_');
  if (parts.length < 3) throw new Error('Invalid ciphertext format');
  // The middle part(s) are the base64 payload (re-join in case base64 had underscores — it won't, but defensive)
  const b64 = parts.slice(1, -1).join('_');

  const combined = fromBase64(b64);
  const iv         = combined.slice(0, 16);
  const encrypted  = combined.slice(16);

  const key = await deriveKey(password, walletAddr);

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    encrypted,
  );

  return new TextDecoder().decode(plainBuf);
}

/**
 * Compute a SHA-256 hash and return it as a hex string.
 * Used for result hashing before anchoring to blockchain.
 */
export async function sha256Hex(data: string): Promise<string> {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derive a deterministic exam encryption password from the teacher's wallet.
 * Used when the teacher's wallet IS the password (exam paper key).
 */
export function examPassword(teacherWalletAddr: string): string {
  const prefix = teacherWalletAddr.slice(0, 4).toLowerCase();
  const suffix = teacherWalletAddr.slice(-4).toLowerCase();
  return `exam_${prefix}${suffix}_${ENV.AES_SALT}`;
}

/**
 * Derive a deterministic result encryption password from the student's wallet.
 */
export function resultPassword(studentWalletAddr: string): string {
  const prefix = studentWalletAddr.slice(0, 4).toLowerCase();
  const suffix = studentWalletAddr.slice(-4).toLowerCase();
  return `result_${prefix}${suffix}_${ENV.AES_SALT}`;
}
