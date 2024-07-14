import React, { useEffect } from 'react';
import { Button, Loader, Notification } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Wallet } from '../types/wallet';

import { useGetServerHealthStatus } from '../hooks/healthStatus';
import { XIcon } from '../components/XIcon';
import { ConnectHardwareModal } from '../components/ConnectHardwareModal';

export const ChoosePath = () => {
  const navigate = useNavigate();
  const handleImport = () => {
    // send message to main process to open import file dialog
    window.electron.ipcRenderer.sendMessage('import-wallet-from-dialog');
  };

  const handleImportedWallet = (walletData: Wallet) => {
    navigate('/sign-in', { state: { walletData } });
  };

  const [isHWWModalOpen, setIsHWWModalOpen] = React.useState(false);
  const closeModal = () => {
    setIsHWWModalOpen(false);
    // make request to backend to close all connected hardware wallets
  };
  const openModal = () => {
    setIsHWWModalOpen(true);
  };

  const serverHealthStatusQuery = useGetServerHealthStatus();
  const isServerAvailableAndHealthy =
    serverHealthStatusQuery.isSuccess &&
    serverHealthStatusQuery.data.status === 'good' &&
    !serverHealthStatusQuery.isLoading;

  useEffect(() => {
    // Listen for the 'json-wallet' event sent from the main process
    // @ts-ignore
    window.electron.ipcRenderer.on('json-wallet', handleImportedWallet);
    window.electron.ipcRenderer.sendMessage('current-route', '/');
  }, []);
  return isServerAvailableAndHealthy ? (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-100 ">
      <div className="relative bottom-16 font-medium">
        <div className="mb-8">
          <h1 style={{ color: '#228BE6' }} className="text-5xl text-center">
            Live Wallet
          </h1>
        </div>
        <div className="flex flex-row">
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
            variant="light"
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
        <div className="w-full flex items-center justify-center">
          <Button
            variant="filled"
            className="mt-6"
            size="xl"
            style={{ width: '16rem', height: '16rem' }}
            onClick={() => {
              openModal();
            }}
          >
            Hardware wallet
          </Button>
        </div>
      </div>
      {/* The isHWWModalOpen check is needed in order to demount and remount the component, without it the modal state persists, which is not what we want, we want to have to scan for wallets each time the modal is opened  */}
      {isHWWModalOpen && (
        <ConnectHardwareModal isOpen={isHWWModalOpen} closeModal={closeModal} />
      )}
    </div>
  ) : serverHealthStatusQuery.isLoading ? (
    <div className="flex flex-row justify-center items-center h-screen w-screen">
      <Loader size={50} />
    </div>
  ) : (
    <div className="p-8">
      <Notification
        withCloseButton={false}
        className="border-red-500 border-2"
        icon={XIcon}
        color="red"
        title="Error!"
      >
        There is a problem connecting with the server, please restart the app
        and try again.
      </Notification>
    </div>
  );
};
