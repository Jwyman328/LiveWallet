import {
  Button,
  InputLabel,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Tooltip,
} from '@mantine/core';
import {
  useGetConnectedHardwareWallets,
  useGetXpubFromHardwareWallet,
} from '../hooks/hardwareWallets';
import { IconInfoCircle, IconUsb } from '@tabler/icons-react';
import {
  HardwareWalletDetails,
  HardwareWalletXpubResponseType,
} from '../api/types';
import { useMemo, useState } from 'react';
import {
  NetworkTypeOption,
  networkOptions,
  policyTypeOptions,
} from './formOptions';
import { configs } from '../configs';
import { HardwareWalletSelect } from './HardwareWalletSelect';
import { ApiClient } from '../api/api';
import { notifications } from '@mantine/notifications';
import { KeyDetails, Wallet } from '../types/wallet';
import {
  getScriptTypeFromDerivationPath,
  ScriptTypes,
} from '../types/scriptTypes';
import { useNavigate } from 'react-router-dom';
import { Pages } from '../../renderer/pages';

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
  nextModal: () => void;
  onGetXpubFromHardwareWalletSuccess?: (keyDetails: KeyDetails) => void;
};
export const ConnectHardwareModal = ({
  isOpen,
  closeModal,
  nextModal,
  onGetXpubFromHardwareWalletSuccess,
}: ConnectHardwareModalProps) => {
  const getConnectedHardwareWalletsQuery = useGetConnectedHardwareWallets();
  const navigate = useNavigate();

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
    const derivationPath =
      selectedDerivationPaths[selectedHWId as string] || "m/84'/0'/0'";
    const wallet: Wallet = {
      // single sig
      policyType: policyTypeOptions[0],
      defaultNetwork: network.value,
      numberOfXpubs: 1,
      signaturesNeeded: 1,
      keyDetails: [
        {
          xpub: data.xpub,
          derivationPath: derivationPath,
          masterFingerprint: '00000000', // since this is a watch only wallet we don't need to send the master fingerprint
        },
      ],
      defaultScriptType: getScriptTypeFromDerivationPath(
        derivationPath,
      ) as ScriptTypes,
      defaultDescriptor: '', // since we are sending all the individual components of the descriptor, we don't need to send the full descriptor
      defaultElectrumServerUrl: '',
      backendServerBaseUrl: '',
      isUsingPublicServer: false,
      privateElectrumUrl: '',
      publicElectrumUrl: '',
    };

    if (onGetXpubFromHardwareWalletSuccess) {
      onGetXpubFromHardwareWalletSuccess(wallet.keyDetails[0]);
    } else {
      navigate(Pages.SIGN_IN, {
        state: { walletData: wallet },
      });
    }
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
        network: network.value,
      });
    } catch (e) {
      // Error handled in the hook
    }
  };

  const closeModalAndHardwareWallets = async () => {
    try {
      closeModal();
      await ApiClient.closeAndRemoveHardwareWallets();
    } catch (e) {
      console.log('Error closing and removing hardware wallets');
    }
  };
  const modalHeight = hwwData.length > 1 ? '500px' : '400px';
  const walletsSectionHeight = hwwData.length > 1 ? '370px' : '270px';

  const getHeader = () => {
    if (isShowFoundDevices) {
      return 'Complete wallet setup';
    }

    if (isShowScan) {
      return (
        <div>
          <Button
            styles={{ root: { paddingLeft: '0px' } }}
            variant="transparent"
            onClick={nextModal}
          >
            Supported devices
          </Button>
        </div>
      );
    }

    return '';
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
      title={getHeader()}
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <div style={{ height: modalHeight, overflow: 'scroll' }}>
        {isShowScan && (
          <div className="flex justify-between flex-col items-center h-full">
            <div className="flex items-center justify-center">
              <h1 className="mr-2">Connect a Hardware Wallet</h1>
              <Tooltip
                withArrow
                label="You may need to unlock your wallet before it is discoverable."
              >
                <IconInfoCircle style={{ width: '14px', height: '14px' }} />
              </Tooltip>
            </div>
            <IconUsb style={{ width: '8rem', height: '8rem' }} />
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
          <div className="flex flex-col items-center h-full">
            <h1>Check your hardware device</h1>

            <Loader className="mt-40" size={60} color="blue" />
          </div>
        )}
        {isShowFoundDevices && (
          <div
            className="flex flex-col justify-between h-full relative bottom-2"
            style={{ zIndex: '1000000' }}
          >
            <div>
              <div style={{ height: walletsSectionHeight, overflow: 'scroll' }}>
                {hardwareWalletsDisplay}
              </div>

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
