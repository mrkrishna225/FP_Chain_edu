/**
 * src/context/WalletContext.tsx
 *
 * Real MetaMask wallet connection using window.ethereum.
 *
 * Flow:
 *  1. User clicks "Connect Wallet"
 *  2. MetaMask popup → user approves
 *  3. We read the connected address
 *  4. We check RoleManager contract for role (if deployed)
 *  5. We check if address === ADMIN_ADDRESS (from .env) → force ADMIN role
 *  6. We expose role, address, chainId, isCorrectNetwork to all pages
 *
 * Chain: Ganache local (chainId 1337 / hex 0x539)
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { ENV, isAdminAddress } from '@/config/env';
import { TEST_MODE_ACTIVE, TEST_CREDENTIALS } from '../../test/testConfig';

// ─── Types ───────────────────────────────────────────────────

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'NONE' | null;

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  role: Role;
  did: string | null;
  isDemoMode: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToCorrectNetwork: () => Promise<void>;
  refreshRole: () => Promise<void>;
  selectRole: (role: Role) => void;
  enableDemoMode: (role: Role) => void;
}

// ─── Ganache chain config ────────────────────────────────────
const GANACHE_CHAIN_ID = ENV.CHAIN_ID; // 1337
const GANACHE_HEX = `0x${GANACHE_CHAIN_ID.toString(16)}`; // 0x539

// ─── Utility: get Ethereum provider ─────────────────────────
function getEthereum(): any {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
}

// ─── Utility: detect role from contract or env ───────────────
async function detectRole(address: string): Promise<Role> {
  const normalizedAddr = address.toLowerCase();

  // 1. TEST MODE Check: bypass contract entirely
  if (TEST_MODE_ACTIVE === 1) {
    if (normalizedAddr === TEST_CREDENTIALS.admin.toLowerCase()) return 'ADMIN';
    if (normalizedAddr === TEST_CREDENTIALS.teacher.toLowerCase()) return 'TEACHER';
    if (TEST_CREDENTIALS.students.map(s => s.toLowerCase()).includes(normalizedAddr)) return 'STUDENT';
    // If not found in test mode, fall through to default behavior, or just exit.
    // Given the prompt, if test mode is active, maybe we just return NONE if not listed.
  }

  // 2. Production mode check:
  if (TEST_MODE_ACTIVE === 0) {
    if (isAdminAddress(address)) return 'ADMIN';
    // If not admin and test mode is off, we still check the contract for students/teachers!
  }

  // 3. Admin env check
  if (isAdminAddress(address)) return 'ADMIN';

  // 4. Try to read from RoleManager smart contract
  try {
    const { default: addresses } = await import('@/contracts/addresses.json');
    const { default: RoleManagerABI } = await import('@/contracts/abis/RoleManager.json');

    const ethers_like = getEthereum();
    if (!ethers_like) return 'NONE';

    // Use eth_call directly without ethers to keep minimal deps
    const iface = {
      getRole: (addr: string) =>
        ({
          method: 'eth_call',
          params: [
            {
              to: (addresses as any).RoleManager,
              data:
                '0x' +
                // getRole(address) selector = keccak256("getRole(address)")[0:4]
                '96e76de5' +
                addr.replace('0x', '').toLowerCase().padStart(64, '0'),
            },
            'latest',
          ],
        }),
    };

    const payload = iface.getRole(address);
    const result: string = await ethers_like.request(payload);

    // Decode the ABI-encoded string result
    // result is 0x + offset(32) + length(32) + data(*)
    if (result && result.length > 2) {
      const hex = result.slice(2);
      // String offset at position 0 (always 0x20)
      const lengthHex = hex.slice(64, 128);
      const length = parseInt(lengthHex, 16);
      const strHex = hex.slice(128, 128 + length * 2);
      const decoded = strHex
        .match(/.{1,2}/g)!
        .map((b: string) => String.fromCharCode(parseInt(b, 16)))
        .join('');

      if (decoded === 'ADMIN') return 'ADMIN';
      if (decoded === 'TEACHER') return 'TEACHER';
      if (decoded === 'STUDENT') return 'STUDENT';
    }
  } catch {
    // Contract not deployed or read failed — fall through to NONE
  }

  return 'NONE';
}

// ─── Context ─────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    role: null,
    did: null,
    isDemoMode: false,
    chainId: null,
    isCorrectNetwork: false,
    isConnecting: false,
    error: null,
  });

  // ─── Refresh role ──────────────────────────────────────────
  const refreshRole = useCallback(async () => {
    if (!state.address) return;
    const role = await detectRole(state.address);
    setState((prev) => ({ ...prev, role }));
  }, [state.address]);

  // ─── Connect wallet ────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setState((prev) => ({
        ...prev,
        error: 'MetaMask not detected. Please install MetaMask extension.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts: string[] = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned by MetaMask');
      }

      const address = accounts[0].toLowerCase();
      const chainIdHex: string = await ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      const isCorrectNetwork = chainId === GANACHE_CHAIN_ID;

      const role = isCorrectNetwork ? await detectRole(address) : null;

      setState({
        isConnected: true,
        address,
        role,
        did: `did:ethr:${address}`,
        isDemoMode: false,
        chainId,
        isCorrectNetwork,
        isConnecting: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err?.message ?? 'Failed to connect wallet',
      }));
    }
  }, []);

  // ─── Disconnect wallet ─────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      role: null,
      did: null,
      isDemoMode: false,
      chainId: null,
      isCorrectNetwork: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  // ─── Select role ───────────────────────────────────────────
  const selectRole = useCallback((role: Role) => {
    setState((prev) => ({ ...prev, role }));
  }, []);

  // ─── Enable demo mode ──────────────────────────────────────
  const enableDemoMode = useCallback((role: Role) => {
    setState({
      isConnected: true,
      address: '0x000000000000000000000000000000000000demo',
      role: role,
      did: 'did:ethr:0x000000000000000000000000000000000000demo',
      isDemoMode: true,
      chainId: GANACHE_CHAIN_ID,
      isCorrectNetwork: true,
      isConnecting: false,
      error: null,
    });
  }, []);

  // ─── Switch to Ganache ─────────────────────────────────────
  const switchToCorrectNetwork = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) return;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: GANACHE_HEX }],
      });
    } catch (switchError: any) {
      // Chain not added — add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: GANACHE_HEX,
                chainName: 'Ganache Local',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://127.0.0.1:8545'],
              },
            ],
          });
        } catch {
          setState((prev) => ({
            ...prev,
            error: 'Could not add Ganache network to MetaMask',
          }));
        }
      }
    }
  }, []);

  // ─── Listen to MetaMask account/chain changes ─────────────
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const address = accounts[0].toLowerCase();
        const role = state.isCorrectNetwork ? await detectRole(address) : null;
        setState((prev) => ({ ...prev, address, role, did: `did:ethr:${address}`, isDemoMode: false }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const isCorrectNetwork = chainId === GANACHE_CHAIN_ID;
      setState((prev) => ({
        ...prev,
        chainId,
        isCorrectNetwork,
        role: isCorrectNetwork ? prev.role : null,
      }));
      // Refresh role when network changes
      if (isCorrectNetwork && state.address) {
        detectRole(state.address).then((role) =>
          setState((prev) => ({ ...prev, role })),
        );
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnectWallet, state.address, state.isCorrectNetwork]);

  // ─── Auto-reconnect if already authorised ─────────────────
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    ethereum
      .request({ method: 'eth_accounts' })
      .then(async (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const address = accounts[0].toLowerCase();
          const chainIdHex: string = await ethereum.request({ method: 'eth_chainId' });
          const chainId = parseInt(chainIdHex, 16);
          const isCorrectNetwork = chainId === GANACHE_CHAIN_ID;
          const role = isCorrectNetwork ? await detectRole(address) : null;
          setState({
            isConnected: true,
            address,
            role,
            did: `did:ethr:${address}`,
            isDemoMode: false,
            chainId,
            isCorrectNetwork,
            isConnecting: false,
            error: null,
          });
        }
      })
      .catch(() => {/* silently skip auto-reconnect failures */});
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connectWallet,
        disconnectWallet,
        switchToCorrectNetwork,
        refreshRole,
        selectRole,
        enableDemoMode,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
