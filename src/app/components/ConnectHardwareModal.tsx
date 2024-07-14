import {
  Button,
  InputLabel,
  Loader,
  Modal,
  ScrollArea,
  Select,
} from '@mantine/core';
import { useGetConnectedHardwareWallets } from '../hooks/hardwareWallets';
import { IconUsb } from '@tabler/icons-react';
import { HardwareWalletDetails } from '../api/types';
import { useMemo, useState } from 'react';
import { NetworkTypeOption, networkOptions } from './formOptions';
import { configs } from '../configs';
import { HardwareWalletSelect } from './HardwareWalletSelect';
import { ApiClient } from '../api/api';

export type WalletIdAccountNumbers = {
  // the key is the walletId and the value is the account number
  [key: string]: string;
};
export type WalletIdDerivationPaths = {
  // the key is the walletId and the value is the derivation path
  [key: string]: string;
};

type ConnectHardwareModalProps = {
  isOpen: boolean;
  closeModal: () => void;
};
export const ConnectHardwareModal = ({
  isOpen,
  closeModal,
}: ConnectHardwareModalProps) => {
  const getConnectedHardwareWalletsQuery = useGetConnectedHardwareWallets();

  const scanForConnectedHardwareWallets = () => {
    getConnectedHardwareWalletsQuery.mutate();
  };
  const hwwData = getConnectedHardwareWalletsQuery.data?.wallets || [];

  const [selectedHWId, setSelectedHWId] = useState<string | null>(null);

  const [selectedAccounts, setSelectedAccounts] =
    useState<WalletIdAccountNumbers>({});

  const [selectedDerivationPaths, setSelectedDerivationPaths] =
    useState<WalletIdDerivationPaths>({});

  const accountOptions = Array.from({ length: 10 }, (_, i) => ({
    label: `Account #${i}`,
    value: `${i}`,
  }));

  const defaultNetwork = networkOptions.find(
    (option) => option.value === configs.defaultNetwork,
  ) as NetworkTypeOption;
  const [network, setNetwork] = useState<NetworkTypeOption>(defaultNetwork);

  const canInitiateHWWallet = !!selectedHWId;

  const hardwareWalletsDisplay = useMemo(() => {
    const hwwDisplays = hwwData.map((wallet: HardwareWalletDetails) => {
      return (
        <HardwareWalletSelect
          wallet={wallet}
          accountOptions={accountOptions}
          selectedAccounts={selectedAccounts}
          setSelectedAccounts={setSelectedAccounts}
          selectedHWId={selectedHWId}
          setSelectedHWId={setSelectedHWId}
          selectedDerivationPaths={selectedDerivationPaths}
          setSelectedDerivationPath={setSelectedDerivationPaths}
        />
      );
    });
    if (hwwDisplays.length > 0) {
      return (
        <div>
          <InputLabel className={`mt-0 mb-2 w-64`}>
            Connected wallets
          </InputLabel>
          {hwwDisplays}
        </div>
      );
    } else {
      return [];
    }
  }, [hwwData, selectedHWId, selectedAccounts, selectedHWId, accountOptions]);

  const isShowScan =
    !getConnectedHardwareWalletsQuery.isLoading && hwwData.length === 0;

  const isShowFoundDevices =
    getConnectedHardwareWalletsQuery.isSuccess && hwwData.length > 0;

  const getXpub = async () => {
    try {
      // TODO use hook and use loading states
      const response = await ApiClient.getXpubFromDevice(
        selectedHWId as string,
      );
      console.log('xpub response', response);
    } catch (e) {
      console.log('error from getting xpub', e);
    }
  };

  return (
    <Modal
      styles={{
        header: { minHeight: '0px !important' },
        title: { fontWeight: '700' },
      }}
      opened={isOpen}
      onClose={closeModal}
      centered
      size="md"
      title={isShowFoundDevices ? 'Complete wallet setup' : ''}
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <div className="relative">
        {isShowScan && (
          <div
            className="flex justify-between flex-col items-center"
            // TODO fix height of modal to be dynamic
            style={{ minHeight: '450px' }}
          >
            <h1> Connect a Hardware Wallet</h1>
            <IconUsb style={{ width: '10rem', height: '10rem' }} />
            <Button
              variant="filled"
              className="mb-4"
              size="md"
              style={{ width: '10rem' }}
              onClick={scanForConnectedHardwareWallets}
            >
              scan
            </Button>
          </div>
        )}
        {getConnectedHardwareWalletsQuery.isLoading && (
          <div
            className="flex flex-col items-center"
            style={{ height: '450px' }}
          >
            <h1>Check your hardware device</h1>

            <Loader className="mt-40" size={60} color="blue" />
          </div>
        )}
        {isShowFoundDevices && (
          <div
            className="flex flex-col justify-between"
            style={{ height: '450px' }}
          >
            <div style={{ zIndex: '1000000' }} className="relative bottom-2">
              {hardwareWalletsDisplay}
              <InputLabel className={`mt-1 mb-2`}>Network</InputLabel>
              <Select
                allowDeselect={false}
                className={'mb-4'}
                data={networkOptions}
                value={network.value}
                onChange={(_value, option) => {
                  if (option) {
                    setNetwork(option as NetworkTypeOption);
                  }
                }}
              />
            </div>

            <Button disabled={!canInitiateHWWallet} onClick={getXpub}>
              Advance
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
