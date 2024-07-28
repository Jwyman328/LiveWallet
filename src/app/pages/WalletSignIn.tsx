import { useNavigate, useLocation } from 'react-router-dom';
import { useCreateWallet } from '../hooks/wallet';
import React, { useEffect, useMemo, useState } from 'react';
import { Network } from '../types/network';
import {
  Affix,
  Loader,
  Notification,
  NumberInput,
  Tooltip,
} from '@mantine/core';

import {
  NetworkTypeOption,
  ScriptTypeOption,
  networkOptions,
  scriptTypeOptions,
} from '../components/formOptions';

let vaultImage: any;

if (process.env.NODE_ENV === 'test') {
  vaultImage = require('');
} else {
  vaultImage = require('../images/vault.png');
}

import {
  Select,
  Input,
  InputLabel,
  Button,
  Tabs,
  Radio,
  Stack,
  Textarea,
} from '@mantine/core';
import { configs } from '../configs';
import { useGetServerHealthStatus } from '../hooks/healthStatus';
import {
  getDerivationPathFromScriptType,
  scriptTypeToDescriptorMap,
} from '../types/scriptTypes';
import { XIcon } from '../components/XIcon';

import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react';
import { Wallet } from '../types/wallet';

type PublicElectrumUrl = {
  name: string;
  ports: Record<Network, number>;
};

export const WalletSignIn = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const mockElectrumUrl = configs.defaultElectrumServerUrl;
  const serverHealthStatusQuery = useGetServerHealthStatus();
  const location = useLocation();
  const isServerAvailableAndHealthy =
    serverHealthStatusQuery.isSuccess &&
    serverHealthStatusQuery.data.status === 'good' &&
    !serverHealthStatusQuery.isLoading;

  const [privateElectrumUrl, setPrivateElectrumUrl] = useState(mockElectrumUrl);
  const [isUsingPublicServer, setIsUsingPublicServer] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(
    isUsingPublicServer ? 'public' : 'private',
  );

  const [activeConfigTab, setActiveConfigTab] = useState<string>('base');

  useEffect(() => {
    if (location?.state?.walletData) {
      handleImportedWallet(location.state.walletData);
    }
  }, [location?.state?.walletData]);

  // Testnet electrum public servers https://github.com/spesmilo/electrum/blob/master/electrum/servers_testnet.json
  // Bitcoin electrum public servers https://github.com/spesmilo/electrum/blob/master/electrum/servers.json
  const publicElectrumUrls: PublicElectrumUrl[] = [
    {
      name: 'electrum.blockstream.info',
      ports: {
        [Network.REGTEST]: 60001,
        [Network.TESTNET]: 60001,
        [Network.BITCOIN]: 50001,
      },
    },
    {
      name: 'bitcoin.aranguren.org',
      ports: {
        [Network.REGTEST]: 51001,
        [Network.TESTNET]: 51001,
        [Network.BITCOIN]: 50001,
      },
    },
    {
      name: 'blockstream.info',
      ports: {
        [Network.REGTEST]: 143,
        [Network.TESTNET]: 143,
        [Network.BITCOIN]: 110,
      },
    },
  ];

  const publicElectrumOptions = publicElectrumUrls.map((server) => ({
    value: server.name,
    label: server.name,
  }));

  const [selectedPublicServer, setSelectedPublicServer] = useState(
    publicElectrumOptions[0],
  );
  const [displayInitiateWalletError, setDisplayInitateWalletError] =
    useState(false);

  const defaultNetwork = networkOptions.find(
    (option) => option.value === configs.defaultNetwork,
  ) as NetworkTypeOption;

  const [network, setNetwork] = useState<NetworkTypeOption>(defaultNetwork);

  const defaultScriptType = scriptTypeOptions.find(
    (option) => option.value === configs.defaultScriptType,
  ) as ScriptTypeOption;

  const [scriptType, setScriptType] =
    useState<ScriptTypeOption>(defaultScriptType);

  const navigate = useNavigate();

  const handleWalletInitiated = () => {
    // send wallet details to main process so that
    // the main process has the wallet details if they want to save them.
    saveWallet({
      defaultDescriptor: generateDescriptor(),
      defaultMasterFingerprint: masterFingerPrint,
      defaultDerivationPath: derivationPath,
      defaultXpub: xpub,
      defaultElectrumServerUrl: electrumUrl,
      backendServerBaseUrl: 'http://localhost:5011',
      defaultNetwork: network.value,
      defaultScriptType: scriptType.value,
      isUsingPublicServer: isUsingPublicServer,
      privateElectrumUrl: privateElectrumUrl,
      publicElectrumUrl: selectedPublicServer.value,
    });
    navigate('/home');
  };

  const handleWalletError = () => {
    setDisplayInitateWalletError(true);
    console.log('Error initiating wallet');
  };

  const electrumUrl = useMemo(() => {
    if (isUsingPublicServer) {
      const electrumServer = publicElectrumUrls.find(
        (server) => server.name === selectedPublicServer?.value,
      );

      if (!electrumServer) {
        return '';
      }

      if (
        electrumServer.name === 'bitcoin.aranguren.org' &&
        network.value === Network.TESTNET
      ) {
        electrumServer.name = 'testnet.aranguren.org';
      }

      return `${electrumServer.name}:${
        electrumServer.ports[network.value as Network]
      }`;
    }
    return privateElectrumUrl;
  }, [
    isUsingPublicServer,
    selectedPublicServer,
    privateElectrumUrl,
    network,
    publicElectrumUrls,
  ]);

  const handlePrivateElectrumInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPrivateElectrumUrl(e.target.value);
  };

  const formItemWidth = 'w-80';
  const labelWidth = 'w-80';

  const [derivationPath, setDerivationPath] = useState<string>(
    configs.defaultDerivationPath,
  );
  const handleDerivationPathChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDerivationPath(e.target.value);
  };

  const derivationPathPlaceHolder = getDerivationPathFromScriptType(
    scriptType.value,
  );

  const [xpub, setXpub] = useState<string>(configs.defaultXpub);
  const handleXpubChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setXpub(e.target.value);
  };

  const [masterFingerPrint, setMasterFingerPrint] = useState<string>(
    configs.defaultMasterFingerprint || '00000000',
  );
  const handleMasterFingerPrint = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMasterFingerPrint(e.target.value);
  };

  const [gapLimit, setGapLimit] = useState<string | number>(100);

  const onSetGapLimit = (limit: string | number) => {
    setGapLimit(limit);
  };

  const generateDescriptor = () => {
    // take the inputs from the various fields and create a descriptor
    let scriptTypeDescription = scriptTypeToDescriptorMap[scriptType.value];

    const isNestedSegWit =
      scriptTypeDescription === scriptTypeToDescriptorMap.P2WSH;
    const closingParam = isNestedSegWit ? '))' : ')';

    let derivationWithoutPrefix = derivationPath.replace(/^m\//, '');

    const computedDescriptor = `${scriptTypeDescription}([${masterFingerPrint}/${derivationWithoutPrefix}]${xpub}/0/*${closingParam}`;
    return computedDescriptor;
  };

  const initiateWalletRequest = useCreateWallet(
    network.value as Network,
    electrumUrl,
    Number(gapLimit),
    handleWalletInitiated,
    handleWalletError,
  );

  const signIn = async () => {
    try {
      const fullDescriptor = generateDescriptor();
      await initiateWalletRequest.mutateAsync(fullDescriptor);
    } catch (e) {
      console.log('Error', e);
    }
  };

  const isLoginEnabled =
    !!xpub &&
    !!generateDescriptor() &&
    !!scriptType?.value &&
    !!masterFingerPrint &&
    !!derivationPath &&
    !!network.value &&
    !!electrumUrl;

  const navigateToGenerateWallet = () => {
    navigate('/generate-wallet');
  };

  const handleImportedWallet = (walletData: Wallet) => {
    console.log('Received imported wallet data in signin page', walletData);
    const {
      defaultDescriptor: importedDefaultDescriptor,
      defaultMasterFingerprint: importedDefaultMasterFingerprint,
      defaultDerivationPath: importedDefaultDerivationPath,
      defaultXpub: importedDefaultXpub,
      defaultNetwork: importedDefaultNetwork,
      defaultScriptType: importedDefaultScriptType,
      publicElectrumUrl: importedPublicElectrumUrl,
      privateElectrumUrl: importedPrivateElectrumUrl,
      isUsingPublicServer: importedIsUsingPublicServer,

      btcMetric: importedBtcMetric,
      feeRateColorMapValues: importedFeeRateColorMapValues,
      feeScale: importedFeeScale,
      minFeeScale: importedMinFeeScale,
      feeRate: importedFeeRate,
    } = walletData;
    console.log('imported descriptor', importedDefaultDescriptor);

    setMasterFingerPrint(importedDefaultMasterFingerprint as string);
    setDerivationPath(importedDefaultDerivationPath as string);
    setXpub(importedDefaultXpub as string);
    setIsUsingPublicServer(importedIsUsingPublicServer as boolean);
    setPrivateElectrumUrl(importedPrivateElectrumUrl as string);

    const importedNetwork = networkOptions.find(
      (option) => option.value === importedDefaultNetwork,
    );

    if (importedNetwork) {
      setNetwork(importedNetwork);
    }
    const importedScriptType = scriptTypeOptions.find(
      (option) => option.value === importedDefaultScriptType,
    );
    if (importedScriptType) {
      setScriptType(importedScriptType);
    }
    const importedPublicServer = publicElectrumOptions.find(
      (option) => option.value === importedPublicElectrumUrl,
    );

    if (importedPublicServer) {
      setSelectedPublicServer(importedPublicServer);
    }

    const activeUrlTab = importedIsUsingPublicServer ? 'public' : 'private';
    setActiveTab(activeUrlTab);

    const walletConfigs = {
      btcMetric: importedBtcMetric,
      feeRateColorMapValues: importedFeeRateColorMapValues,
      feeScale: importedFeeScale,
      minFeeScale: importedMinFeeScale,
      feeRate: importedFeeRate,
    };
    window.electron.ipcRenderer.sendMessage(
      'save-wallet-configs',
      walletConfigs,
    );
  };

  const saveWallet = (walletDetails: Wallet) => {
    window.electron.ipcRenderer.sendMessage('save-wallet', walletDetails);
  };

  useEffect(() => {
    // Listen for the 'json-wallet' event sent from the main process
    // @ts-ignore
    window.electron.ipcRenderer.on('json-wallet', handleImportedWallet);

    window.electron.ipcRenderer.sendMessage('current-route', '/signin');
  }, []);

  return isServerAvailableAndHealthy ? (
    <div className="flex flex-row w-screen h-screen overflow-scroll">
      {isDevelopment ? (
        <Affix position={{ top: 20, right: 20 }}>
          <Button onClick={navigateToGenerateWallet}>Create dev mocks</Button>
        </Affix>
      ) : null}
      <Affix position={{ top: 20, left: 20 }}>
        <Button
          leftSection={<IconArrowLeft />}
          variant="transparent"
          onClick={() => navigate('/')}
        ></Button>
      </Affix>

      <div className="px-4 flex-1 w-1/2 flex flex-col items-center h-screen">
        {displayInitiateWalletError && (
          <Notification
            withCloseButton={true}
            onClose={() => setDisplayInitateWalletError(false)}
            className="border-red-500 border-2 top-2 right-1 self-end w-1/2 z-10"
            style={{ position: 'absolute' }}
            icon={XIcon}
            color="red"
            title="Error!"
          >
            Error initiating wallet
          </Notification>
        )}
        <h1
          className={`text-4xl font-semibold mb-1 mt-8 ${labelWidth} text-blue-500`}
        >
          Watch Only Wallet
        </h1>

        <div className="px-4 flex-1 w-1/2 flex flex-col items-center h-[90%]">
          <Tabs
            className={`${formItemWidth} mt-8`}
            value={activeConfigTab}
            onChange={setActiveConfigTab}
          >
            <Tabs.List>
              <Tabs.Tab className="w-1/2" value="base">
                Basic
              </Tabs.Tab>
              <Tabs.Tab className="w-1/2" value="advanced">
                Advanced
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="base">
              <>
                <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                  Network
                </InputLabel>
                <Select
                  allowDeselect={false}
                  className={formItemWidth}
                  data={networkOptions}
                  value={network.value}
                  onChange={(_value, option) => {
                    if (option) {
                      setNetwork(option as NetworkTypeOption);
                    }
                  }}
                />

                <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                  Script type
                </InputLabel>
                <Select
                  data-testid="script-type-select"
                  allowDeselect={false}
                  className={`mb-4 ${formItemWidth}`}
                  data={scriptTypeOptions}
                  value={scriptType ? scriptType.value : null}
                  onChange={(_value, option) => {
                    if (option) {
                      setScriptType(option as ScriptTypeOption);
                    }
                  }}
                />

                <div
                  className={`flex flex-row ${labelWidth} mb-2 mt-6 items-center`}
                >
                  <InputLabel className="mr-1">Derivation path</InputLabel>
                  <Tooltip
                    withArrow
                    label="The derivation path to the xpub from the master private key."
                  >
                    <IconInfoCircle style={{ width: '14px', height: '14px' }} />
                  </Tooltip>
                </div>
                <Input
                  data-testid="derivation-path"
                  className={`${formItemWidth}`}
                  placeholder={derivationPathPlaceHolder}
                  value={derivationPath}
                  onInput={handleDerivationPathChange}
                />

                <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                  xpub
                </InputLabel>
                <Textarea
                  className={`${formItemWidth}`}
                  styles={{ input: { minHeight: '6.3rem' } }}
                  placeholder="xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt"
                  onInput={handleXpubChange}
                  value={xpub}
                />

                <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                  Server type
                </InputLabel>
                <Stack className={labelWidth}>
                  <Radio
                    checked={isUsingPublicServer}
                    onClick={(e) => {
                      const isSelected = e.currentTarget.value === 'on';
                      setIsUsingPublicServer(isSelected);
                    }}
                    label="Public electrum server"
                  />
                  <Radio
                    checked={!isUsingPublicServer}
                    onClick={(e) => {
                      const isSelected = e.currentTarget.value === 'on';
                      setIsUsingPublicServer(!isSelected);
                    }}
                    label="Private electrum server"
                  />
                </Stack>

                <InputLabel className={`mt-4 mb-0 ${labelWidth}`}>
                  Electrum url
                </InputLabel>
                <Tabs
                  className={formItemWidth}
                  value={activeTab}
                  onChange={setActiveTab}
                >
                  <Tabs.List>
                    <Tabs.Tab value="public">Public electrum</Tabs.Tab>
                    <Tabs.Tab value="private">Private electrum</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="public">
                    <Select
                      placeholder="Enter public electrum url"
                      allowDeselect={false}
                      disabled={!isUsingPublicServer}
                      data={publicElectrumOptions}
                      value={
                        selectedPublicServer ? selectedPublicServer.value : null
                      }
                      onChange={(_value, option) => {
                        if (option) {
                          setSelectedPublicServer(option);
                        }
                      }}
                      className={formItemWidth}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="private">
                    <Input
                      disabled={isUsingPublicServer}
                      type="text"
                      placeholder="Enter electrum url"
                      onInput={handlePrivateElectrumInput}
                      value={privateElectrumUrl}
                      className="mt-2 w-80"
                    />
                  </Tabs.Panel>
                </Tabs>

                <div className={formItemWidth}>
                  <Button
                    disabled={!isLoginEnabled}
                    className="mt-8"
                    fullWidth
                    type="button"
                    onClick={signIn}
                  >
                    {initiateWalletRequest.isLoading ? (
                      <Loader size={20} color="white" />
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>
              </>
            </Tabs.Panel>
            <Tabs.Panel value="advanced">
              <>
                <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                  Gap limit
                </InputLabel>
                <NumberInput
                  className={`mb-4 ${formItemWidth}`}
                  allowNegative={false}
                  value={gapLimit}
                  onChange={onSetGapLimit}
                  min={1}
                />
                <div
                  className={`flex flex-row ${labelWidth} mb-2 items-center`}
                >
                  <InputLabel className={`mr-1`}>Master fingerprint</InputLabel>
                  <Tooltip
                    withArrow
                    w={300}
                    multiline
                    label="The master fingerprint uniquely identifies this keystore using the first 4 bytes of the master public key hash. It is safe to use any valid value (00000000) for watch only wallets"
                  >
                    <IconInfoCircle style={{ width: '14px', height: '14px' }} />
                  </Tooltip>
                </div>
                <Input
                  className={`${formItemWidth}`}
                  placeholder="00000000"
                  value={masterFingerPrint}
                  onInput={handleMasterFingerPrint}
                />
              </>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>

      <img src={vaultImage} className=" w-1/2 min-h-screen" />
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
