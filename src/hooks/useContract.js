import { useCallback } from 'react';
import addresses from '../contracts/addresses.json';

// Pre-import all ABI files statically so Vite/esbuild can resolve them.
// After `truffle migrate`, these files are overwritten with real ABIs.
const ABI_MODULES = import.meta.glob('../contracts/abis/*.json', { eager: true });

function getABI(contractName) {
  const key = `../contracts/abis/${contractName}.json`;
  const mod = ABI_MODULES[key];
  if (!mod) throw new Error(`ABI not found for ${contractName}. Run truffle migrate first.`);
  return mod.default ?? mod;
}

export const useContract = (web3) => {
  const getContract = useCallback(async (contractName) => {
    if (!web3) return null;
    try {
      const abi = getABI(contractName);
      const address = addresses[contractName];
      if (!address) throw new Error(`${contractName} address not found in addresses.json`);
      return new web3.eth.Contract(abi, address);
    } catch (err) {
      console.error(`Failed to load ${contractName} contract`, err);
      return null;
    }
  }, [web3]);

  const getRoleManager  = useCallback(() => getContract('RoleManager'),  [getContract]);
  const getExamManager  = useCallback(() => getContract('ExamManager'),   [getContract]);
  const getAuditLog     = useCallback(() => getContract('AuditLog'),      [getContract]);
  const getResultLedger = useCallback(() => getContract('ResultLedger'),  [getContract]);
  const getFeeVault     = useCallback(() => getContract('FeeVault'),      [getContract]);

  return { getContract, getRoleManager, getExamManager, getAuditLog, getResultLedger, getFeeVault };
};
