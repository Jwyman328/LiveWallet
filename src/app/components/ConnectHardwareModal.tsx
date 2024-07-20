import {
  Button,
  InputLabel,
  Loader,
  Modal,
  ScrollArea,
  Select,
} from '@mantine/core';
import {
  useGetConnectedHardwareWallets,
  useGetXpubFromHardwareWallet,
} from '../hooks/hardwareWallets';
import { IconUsb } from '@tabler/icons-react';
import {
  HardwareWalletDetails,
  HardwareWalletXpubResponseType,
} from '../api/types';
import { useMemo, useState } from 'react';
import { NetworkTypeOption, networkOptions } from './formOptions';
import { configs } from '../configs';
import { HardwareWalletSelect } from './HardwareWalletSelect';
import { ApiClient } from '../api/api';
import { notifications } from '@mantine/notifications';

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

  const handleGetXpubFromHardwareWalletSuccess = (
    data: HardwareWalletXpubResponseType,
  ) => {
    console.log('TODO: do something with this', data);
  };
  const handleGetXpubFromHardwareWalletError = () => {
    notifications.show({
      title: 'Error retrieving xpub from your hardware wallet.',
      message: 'Please try again.',
      color: 'red',
    });
  };

  const getXpubFromHardwareWalletMutation = useGetXpubFromHardwareWallet(
    handleGetXpubFromHardwareWalletSuccess,
    handleGetXpubFromHardwareWalletError,
  );

  const getXpub = async () => {
    try {
      await getXpubFromHardwareWalletMutation.mutateAsync({
        walletUuid: selectedHWId as string,
        accountNumber: selectedAccounts[selectedHWId as string] || '0',
        derivationPath:
          selectedDerivationPaths[selectedHWId as string] || "m/84'/0'/0'",
      });
    } catch (e) {
      // Error handled in the hook
    }
  };

  const closeModalAndHardwareWallets = async () => {
    try {
      await ApiClient.closeAndRemoveHardwareWallets();
    } catch (e) {
      console.log('Error closing and removing hardware wallets');
    }
    closeModal();
  };

  return (
    <Modal
      styles={{
        header: { minHeight: '0px !important' },
        title: { fontWeight: '700' },
      }}
      opened={isOpen}
      onClose={closeModalAndHardwareWallets}
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
            <div className="text-center w-full">
              <h1> Connect a Hardware Wallet</h1>
              <h1 className="text-sm">
                You may need to unlock your wallet before it is discoverable
              </h1>
            </div>
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

            <Button
              loading={getXpubFromHardwareWalletMutation.isLoading}
              disabled={!canInitiateHWWallet}
              onClick={getXpub}
            >
              Advance
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
