import React, { useEffect } from 'react';
import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Wallet } from '../types/wallet';

export const ChoosePath = () => {
  const navigate = useNavigate();
  const handleImport = () => {
    // send message to main process to open import file dialog
    window.electron.ipcRenderer.sendMessage('import-wallet-from-dialog');
  };

  const handleImportedWallet = (walletData: Wallet) => {
    navigate('/sign-in', { state: { walletData } });
  };

  useEffect(() => {
    // Listen for the 'json-wallet' event sent from the main process
    // @ts-ignore
    window.electron.ipcRenderer.on('json-wallet', handleImportedWallet);
    window.electron.ipcRenderer.sendMessage('current-route', '/');
  }, []);
  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-100 ">
      <div className="relative bottom-16 font-medium">
        <div className="mb-8">
          <h1 style={{ color: '#228BE6' }} className="text-5xl text-center">
            Live Wallet
          </h1>
        </div>
        <Button
          variant="outline"
          size="xl"
          style={{ width: '16rem', height: '16rem' }}
          className="mt-12"
          onClick={handleImport}
        >
          Import wallet
        </Button>
        <Button
          variant="filled"
          className="ml-14 mt-12"
          size="xl"
          style={{ width: '16rem', height: '16rem' }}
          onClick={() => {
            navigate('/sign-in');
          }}
        >
          Enter wallet
        </Button>
      </div>
    </div>
  );
};
