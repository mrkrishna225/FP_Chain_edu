import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

export const useWeb3 = () => {
  const [web3Instance, setWeb3Instance] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        setWeb3Instance(web3);
        setAccount(accounts[0]);
        setChainId(currentChainId);
        
        // Use modern `window.ethereum.on` events instead of web3 events
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0] || null);
        });
        
        window.ethereum.on('chainChanged', (chainId) => {
          setChainId(chainId);
          window.location.reload();
        });
        
      } else {
        throw new Error('MetaMask not detected');
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const getTargetChainId = () => {
    const defaultChainIdHex = '0x539'; // 1337 in hex
    const envChainId = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CHAIN_ID) || 
                       (typeof process !== 'undefined' && process.env && process.env.REACT_APP_CHAIN_ID);
    if (!envChainId) return defaultChainIdHex;
    return `0x${Number(envChainId).toString(16)}`;
  };

  const isCorrectNetwork = chainId === getTargetChainId();

  const switchToGanache = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const targetChainId = getTargetChainId();
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error) {
       console.error(error);
       setError('Failed to switch network');
    }
  }, []);

  const disconnect = useCallback(() => {
    setWeb3Instance(null);
    setAccount(null);
    setChainId(null);
  }, []);

  return { web3: web3Instance, account, chainId, isCorrectNetwork, isConnecting, error, connectWallet, switchToGanache, disconnect };
};
