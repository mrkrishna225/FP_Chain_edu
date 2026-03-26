import { useState, useCallback } from 'react';
import { useContract } from './useContract';

export const useAuth = (web3, account) => {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getRoleManager } = useContract(web3);

  const detectRole = useCallback(async (address) => {
    if (!address || !web3) return;
    setIsLoading(true);
    try {
      const RoleManager = await getRoleManager();
      if (RoleManager) {
         // Assuming a getRole method in the smart contract
         const activeRole = await RoleManager.methods.getRole(address).call();
         setRole(activeRole || 'NONE');
      } else {
         // Fallback mock role simulation for UI dev if contracts are absent
         // E.g. account 0 is ADMIN, accounts 1-3 are TEACHER, else STUDENT
         const adminAcc = await web3.eth.getAccounts().then(accs => accs[0] ? accs[0].toLowerCase() : null);
         if (address.toLowerCase() === adminAcc) {
           setRole('ADMIN');
         } else {
           setRole('TEACHER');
         }
      }
    } catch (err) {
      console.error("Role detection error", err);
      // Fallback for UI visualization based on prompt "Account 0 = ADMIN, Account 1-3 = TEACHERs"
      setRole('NONE');
    } finally {
      setIsLoading(false);
    }
  }, [web3, getRoleManager]);

  const isAuthenticated = role !== null && role !== 'NONE';

  return { role, isLoading, isAuthenticated, detectRole };
};
