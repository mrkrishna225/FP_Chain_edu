import { useState } from 'react';
import { create } from 'ipfs-http-client';

export const useIPFS = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Initialize client
  const host = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_IPFS_HOST) || 
               (typeof process !== 'undefined' && process.env && process.env.REACT_APP_IPFS_HOST) || 'localhost';
  const port = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_IPFS_PORT) || 
               (typeof process !== 'undefined' && process.env && process.env.REACT_APP_IPFS_PORT) || '5001';
  const protocol = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_IPFS_PROTOCOL) || 
                   (typeof process !== 'undefined' && process.env && process.env.REACT_APP_IPFS_PROTOCOL) || 'http';
  
  const client = create({ host, port, protocol });

  const uploadToIPFS = async (data) => {
    setUploading(true);
    setError(null);
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const added = await client.add(dataString, {
        progress: (prog) => setUploadProgress((prog / new Blob([dataString]).size) * 100),
      });
      return added.path; // CID
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchFromIPFS = async (cid) => {
    try {
      const stream = client.cat(cid);
      const decoder = new TextDecoder('utf8');
      let data = '';
      for await (const chunk of stream) {
        data += decoder.decode(chunk, { stream: true });
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { uploadToIPFS, fetchFromIPFS, uploading, uploadProgress, error };
};
