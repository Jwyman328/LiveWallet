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
  RangeSlider,
} from '@mantine/core';

import {
  NetworkTypeOption,
  PolicyTypeOption,
  ScriptTypeOption,
  multiSigScriptTypeOptions,
  networkOptions,
  policyTypeOptions,
  scriptTypeOptions,
  singleSigScriptTypeOptions,
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
import {
  MultiSigWalletData,
  UnchainedWalletConfig,
  Wallet,
} from '../types/wallet';
import { PolicyTypes } from '../types/policyTypes';

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
  const [activePKTab, setActivePKTab] = useState<string>('0');
  const [activeTab, setActiveTab] = useState<string | null>(
    isUsingPublicServer ? 'public' : 'private',
  );
  const [isShowDescriptorInput, setIsShowDescriptorInput] = useState(false);

  const [policyType, setPolicyType] = useState<PolicyTypeOption>(
    policyTypeOptions[0],
  );

  const [signaturesNeeded, setSignaturesNeeded] = useState(
    policyType.value === PolicyTypes.SINGLE_SIGNATURE ? 1 : 2,
  );
  const [numberOfXpubs, setNumberOfXpubs] = useState(
    policyType.value === PolicyTypes.SINGLE_SIGNATURE ? 1 : 3,
  );

  // TODO rename to just keyData?
  const defaultMultiSigWalletData = {
    masterFingerprint: configs.defaultMasterFingerprint,
    xpub: configs.defaultXpub,
    derivationPath: configs.defaultDerivationPath,
  };

  const [multisigWalletDetails, setMultisigWalletDetails] = useState<
    MultiSigWalletData[]
  >([{ ...defaultMultiSigWalletData }]);

  const handleNofMChange = (value: any) => {
    const currentAmount = numberOfXpubs;
    const newAmount = value[1];
    const howManyNewTabsToAdd = newAmount - currentAmount;

    const M = value[0];
    const N = value[1];

    if (newAmount > currentAmount) {
      // add new tabs
      const repeatedMultiSigWalletDataArray = Array.from(
        { length: howManyNewTabsToAdd },
        () => {
          return { ...defaultMultiSigWalletData };
        },
      );
      setMultisigWalletDetails([
        ...multisigWalletDetails,
        ...repeatedMultiSigWalletDataArray,
      ]);
    } else {
      const newSetOfDetails = multisigWalletDetails.slice(0, newAmount);
      setMultisigWalletDetails([...newSetOfDetails]);

      if (Number(activePKTab) + 1 > newAmount) {
        setActivePKTab((newAmount - 1).toString());
      }
    }

    setSignaturesNeeded(M);
    setNumberOfXpubs(N);
  };

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
    const defaultDescriptor = descriptor || generateDescriptor().descriptor;
    saveWallet({
      defaultDescriptor: defaultDescriptor,
      defaultChangeDescriptor: changeDescriptor,
      keyDetails: multisigWalletDetails,
      signaturesNeeded: signaturesNeeded,
      numberOfXpubs: numberOfXpubs,
      policyType: policyType,
      defaultScriptType: scriptType.value,
      defaultElectrumServerUrl: electrumUrl,
      backendServerBaseUrl: 'http://localhost:5011',
      defaultNetwork: network.value,
      isUsingPublicServer: isUsingPublicServer,
      privateElectrumUrl: privateElectrumUrl,
      publicElectrumUrl: selectedPublicServer.value,
    });
    navigate('/home', { state: { numberOfXpubs, signaturesNeeded } });
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

  const derivationPathPlaceHolder = getDerivationPathFromScriptType(
    scriptType.value,
  );

  const [descriptor, setDescriptor] = useState<string>(
    configs.defaultDescriptor,
  );
  const handleDescriptorChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescriptor(e.target.value);
  };

  const [gapLimit, setGapLimit] = useState<string | number>(100);

  const onSetGapLimit = (limit: string | number) => {
    setGapLimit(limit);
  };

  const [changeDescriptor, setChangeDescriptor] = useState<undefined | string>(
    undefined,
  );

  const generateDescriptor = () => {
    // take the inputs from the various fields and create a descriptor
    let scriptTypeDescription = scriptTypeToDescriptorMap[scriptType.value];

    const isNestedSegWit =
      scriptTypeDescription === scriptTypeToDescriptorMap.P2SHP2WPKH ||
      scriptTypeDescription === scriptTypeToDescriptorMap.P2SHP2WSH;
    const closingParam = isNestedSegWit ? '))' : ')';

    if (policyType.value === PolicyTypes.SINGLE_SIGNATURE) {
      const xpub = multisigWalletDetails[0].xpub;
      const derivationPath = multisigWalletDetails[0].derivationPath;
      const masterFingerPrint = multisigWalletDetails[0].masterFingerprint;

      let derivationWithoutPrefix = derivationPath.replace(/^m\//, '');

      const computedDescriptor = `${scriptTypeDescription}([${masterFingerPrint}/${derivationWithoutPrefix}]${xpub}/0/*${closingParam}`;

      return {
        descriptor: computedDescriptor,
        changeDescriptor: undefined,
      };
    }

    if (policyType.value === PolicyTypes.MULTI_SIGNATURE) {
      const sortedMultiParts = multisigWalletDetails
        .map((key) => {
          return `[${key.masterFingerprint}${key.derivationPath}]${key.xpub}/0/*`.replace(
            /m\//,
            '/',
          );
        })
        .reverse()
        .join(',');

      const sortedMultiPartsChange = multisigWalletDetails
        .map((key) => {
          return `[${key.masterFingerprint}${key.derivationPath}]${key.xpub}/1/*`.replace(
            /m\//,
            '/',
          );
        })
        .reverse()
        .join(',');

      const multisigDescriptor = `${scriptTypeDescription}(sortedmulti(${signaturesNeeded},${sortedMultiParts})${closingParam}`;
      const multisigChangeDescriptor = `${scriptTypeDescription}(sortedmulti(${signaturesNeeded},${sortedMultiPartsChange})${closingParam}`;

      return {
        descriptor: multisigDescriptor,
        changeDescriptor: multisigChangeDescriptor,
      };
    }
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
      const descriptors = generateDescriptor();

      await initiateWalletRequest.mutateAsync({
        descriptor: descriptors.descriptor,
        changeDescriptor: descriptors.changeDescriptor,
      });
    } catch (e) {
      console.log('Error', e);
    }
  };

  const areXpubsValid = multisigWalletDetails.every(
    (wallet) => wallet.xpub.length > 0,
  );

  const areAllDerivationPathsValid = multisigWalletDetails.every(
    (wallet) => wallet.derivationPath.length > 0,
  );

  const areAllMasterFingerprintsValid = multisigWalletDetails.every(
    (wallet) => wallet.masterFingerprint.length > 0,
  );

  const liveWalletLogin =
    areXpubsValid &&
    !!generateDescriptor() &&
    !!scriptType?.value &&
    areAllMasterFingerprintsValid &&
    areAllDerivationPathsValid &&
    !!network.value &&
    !!electrumUrl;

  const unchainedWalletLogin =
    areXpubsValid &&
    areAllDerivationPathsValid &&
    !!changeDescriptor &&
    areAllMasterFingerprintsValid &&
    !!electrumUrl &&
    !!network.value;

  const isLoginEnabled = unchainedWalletLogin || liveWalletLogin;

  const navigateToGenerateWallet = () => {
    navigate('/generate-wallet');
  };

  const handleImportedUnchainedWallet = (walletData: UnchainedWalletConfig) => {
    const generateDescriptors = () => {
      console.log('walletData', walletData);

      const { quorum, extendedPublicKeys } = walletData;
      const sortedMultiParts = extendedPublicKeys
        .map((key) => {
          return `[${key.xfp}${key.bip32Path}]${key.xpub}/0/*`.replace(
            /m\//,
            '/',
          );
        })
        .reverse()
        .join(',');

      const sortedMultiPartsChange = extendedPublicKeys
        .map((key) => {
          return `[${key.xfp}${key.bip32Path}]${key.xpub}/1/*`.replace(
            /m\//,
            '/',
          );
        })
        .reverse()
        .join(',');

      return {
        unchainedDescriptor: `sh(sortedmulti(${quorum.requiredSigners},${sortedMultiParts}))`,
        unchainedChangeDescriptor: `sh(sortedmulti(${quorum.requiredSigners},${sortedMultiPartsChange}))`,
      };
    };

    const importedNetwork = networkOptions.find(
      (option) => option.value === walletData.network.toUpperCase(),
    );

    if (importedNetwork) {
      setNetwork(importedNetwork);
    }

    const importedScriptType = scriptTypeOptions.find(
      (option) => option.value === walletData.addressType,
    );
    if (importedScriptType) {
      setScriptType(importedScriptType);
    }

    const descriptors = generateDescriptors();
    setChangeDescriptor(descriptors.unchainedChangeDescriptor);
    // multisig option
    setPolicyType(policyTypeOptions[1]);
    setSignaturesNeeded(walletData.quorum.requiredSigners);
    setNumberOfXpubs(walletData.extendedPublicKeys.length);

    const unchainedMultisigWalletData = walletData.extendedPublicKeys.map(
      (keyData) => {
        return {
          masterFingerprint: keyData.xfp,
          xpub: keyData.xpub,
          derivationPath: keyData.bip32Path,
        };
      },
    );
    setMultisigWalletDetails(unchainedMultisigWalletData);
    // }
  };

  const handleImportedWallet = (walletData: Wallet | UnchainedWalletConfig) => {
    const isUnchainedWallet = () => {
      return (
        (walletData as UnchainedWalletConfig).name !== undefined &&
        (walletData as UnchainedWalletConfig).uuid !== undefined &&
        (walletData as UnchainedWalletConfig).addressType !== undefined &&
        (walletData as UnchainedWalletConfig).network !== undefined &&
        (walletData as UnchainedWalletConfig).quorum !== undefined &&
        (walletData as UnchainedWalletConfig).startingAddressIndex !==
          undefined &&
        (walletData as UnchainedWalletConfig).extendedPublicKeys !==
          undefined &&
        (walletData as UnchainedWalletConfig).client !== undefined &&
        (walletData as UnchainedWalletConfig).ledgerPolicyHmacs !== undefined
      );
    };

    if (isUnchainedWallet()) {
      // Handle UnchainedWalletConfig
      console.log('UnchainedWalletConfig:', walletData);
      handleImportedUnchainedWallet(walletData as UnchainedWalletConfig);
    } else {
      // Handle Wallet
      console.log('Wallet:', walletData);
      handleImportedLiveWallet(walletData as Wallet);
    }
  };

  const handleImportedLiveWallet = (walletData: Wallet) => {
    console.log('Received imported wallet data in signin page', walletData);
    const {
      defaultDescriptor: importedDefaultDescriptor,
      defaultChangeDescriptor: importedChangeDescriptor,
      keyDetails: importedMultiSigWalletData,
      policyType: importedPolicyType,
      signaturesNeeded: importedSignaturesNeeded,
      numberOfXpubs: importedNumberOfXpubs,
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

    setMultisigWalletDetails(importedMultiSigWalletData);
    setChangeDescriptor(importedChangeDescriptor);
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

    setChangeDescriptor(changeDescriptor);

    setPolicyType(importedPolicyType);
    setSignaturesNeeded(importedSignaturesNeeded);
    setNumberOfXpubs(importedNumberOfXpubs);

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

  const createKeyInformationTabs = () => {
    return multisigWalletDetails.map((wallet, index) => {
      return (
        <Tabs.Panel key={index} value={index.toString()}>
          <div className="mt-4">
            <div className={`flex flex-row ${labelWidth} items-center`}>
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
              value={wallet.masterFingerprint || '00000000'}
              onInput={(event) => {
                const existingWalletDetails = multisigWalletDetails;
                existingWalletDetails[index].masterFingerprint =
                  //@ts-ignore
                  event.target.value;
                setMultisigWalletDetails([...existingWalletDetails]);
              }}
            />
            <div className={`flex flex-row w-72 mb-2 mt-4 items-center`}>
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
              className={`w-72`}
              placeholder={derivationPathPlaceHolder}
              value={wallet.derivationPath}
              onInput={() => {
                const existingWalletDetails = multisigWalletDetails;
                existingWalletDetails[index].derivationPath =
                  //@ts-ignore
                  event.target.value;
                setMultisigWalletDetails([...existingWalletDetails]);
              }}
            />

            <InputLabel className={`mt-4 mb-2 w-72`}>xpub</InputLabel>
            <Textarea
              className={`w-72`}
              styles={{ input: { minHeight: '6.3rem' } }}
              placeholder="xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt"
              onInput={(event) => {
                const existingWalletDetails = multisigWalletDetails;
                //@ts-ignore
                existingWalletDetails[index].xpub = event.target.value;
                setMultisigWalletDetails([...existingWalletDetails]);
              }}
              value={wallet.xpub}
            />
          </div>
        </Tabs.Panel>
      );
    });
  };

  const createWalletTabList = () => {
    const innerTabs = multisigWalletDetails.map((wallet, index) => {
      const xpubLabel =
        multisigWalletDetails.length === 1 ? 'xpub' : `xpub ${index + 1}`;
      return <Tabs.Tab value={index.toString()}>{xpubLabel}</Tabs.Tab>;
    });
    return innerTabs;
  };

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
                {isShowDescriptorInput ? (
                  <div>
                    <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                      Descriptor
                    </InputLabel>
                    <Textarea
                      className={`${formItemWidth}`}
                      styles={{ input: { minHeight: '20.3rem' } }}
                      placeholder="TODO add a mock desctiptor"
                      onInput={handleDescriptorChange}
                      value={descriptor}
                    />
                  </div>
                ) : (
                  <>
                    <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                      Policy type
                    </InputLabel>
                    <Select
                      allowDeselect={false}
                      className={formItemWidth}
                      data={policyTypeOptions}
                      value={policyType.value}
                      onChange={(_value, option) => {
                        if (option) {
                          // If going from multi to single signature
                          if (
                            option.value === PolicyTypes.SINGLE_SIGNATURE &&
                            policyType.value === PolicyTypes.MULTI_SIGNATURE
                          ) {
                            setSignaturesNeeded(1);
                            setNumberOfXpubs(1);
                            setMultisigWalletDetails([
                              { ...defaultMultiSigWalletData },
                            ]);
                            setActivePKTab('0');
                            setScriptType(singleSigScriptTypeOptions[2]);
                          }

                          // If going from single to multi signature
                          if (
                            option.value === PolicyTypes.MULTI_SIGNATURE &&
                            policyType.value === PolicyTypes.SINGLE_SIGNATURE
                          ) {
                            setSignaturesNeeded(2);
                            setNumberOfXpubs(3);
                            setMultisigWalletDetails([
                              { ...defaultMultiSigWalletData },
                              { ...defaultMultiSigWalletData },
                              { ...defaultMultiSigWalletData },
                            ]);

                            setScriptType(multiSigScriptTypeOptions[2]);
                          }

                          setPolicyType(option as PolicyTypeOption);
                        }
                      }}
                    />

                    <InputLabel className={`mt-4 w-70`}>Script type</InputLabel>
                    <Select
                      data-testid="script-type-select"
                      allowDeselect={false}
                      className={`mb-0 w-72`}
                      data={
                        signaturesNeeded === 1 && numberOfXpubs === 1
                          ? singleSigScriptTypeOptions
                          : multiSigScriptTypeOptions
                      }
                      value={scriptType ? scriptType.value : null}
                      onChange={(_value, option) => {
                        if (option) {
                          setScriptType(option as ScriptTypeOption);
                        }
                      }}
                    />

                    {policyType.value === PolicyTypes.MULTI_SIGNATURE && (
                      <>
                        <div
                          className={`flex flex-row items-center ${labelWidth} mb-2 mt-4`}
                        >
                          <InputLabel className={`mr-1`}>M of N</InputLabel>

                          <Tooltip
                            withArrow
                            w={300}
                            multiline
                            label="M is the number of signers and N is the number of xpubs. M must be less than or equal to N."
                          >
                            <IconInfoCircle
                              style={{ width: '14px', height: '14px' }}
                            />
                          </Tooltip>
                        </div>
                        <RangeSlider
                          className="mt-0 mb-4"
                          style={{ marginBottom: '2rem' }}
                          minRange={0.2}
                          min={1}
                          max={9}
                          step={1}
                          marks={[
                            { value: 1, label: '1' },
                            { value: 2, label: '2' },
                            { value: 3, label: '3' },
                            { value: 4, label: '4' },
                            { value: 5, label: '5' },
                            { value: 6, label: '6' },
                            { value: 7, label: '7' },
                            { value: 8, label: '8' },
                            { value: 9, label: '9' },
                          ]}
                          defaultValue={[signaturesNeeded, numberOfXpubs]}
                          onChange={handleNofMChange}
                          label={null}
                        />
                      </>
                    )}

                    <Tabs
                      className={`mt-6`}
                      value={activePKTab}
                      onChange={setActivePKTab}
                    >
                      <Tabs.List>{createWalletTabList()}</Tabs.List>
                      {createKeyInformationTabs()}
                      <Tabs.Panel value="two">
                        <div>two</div>
                      </Tabs.Panel>
                    </Tabs>
                  </>
                )}

                <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
                  Electrum url
                </InputLabel>
                <Tabs
                  color="green"
                  variant="pills"
                  className={`${formItemWidth} flex flex-row`}
                  value={activeTab}
                  onChange={(value: 'public' | 'private') => {
                    setActiveTab(value);
                    setIsUsingPublicServer(value === 'public');
                  }}
                >
                  <Tabs.List justify="space-between" grow>
                    <Tabs.Tab value="public" className="flex-1">
                      Public electrum
                    </Tabs.Tab>
                    <Tabs.Tab className="flex-1" value="private">
                      Private electrum
                    </Tabs.Tab>
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
                      className={`mt-2 ${formItemWidth}`}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="private">
                    <Input
                      disabled={isUsingPublicServer}
                      type="text"
                      placeholder="Enter electrum url"
                      onInput={handlePrivateElectrumInput}
                      value={privateElectrumUrl}
                      className={`${formItemWidth}`}
                      style={{ marginTop: '.5rem' }}
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
                  Gap limit
                </InputLabel>
                <NumberInput
                  className={`mb-4 ${formItemWidth}`}
                  allowNegative={false}
                  value={gapLimit}
                  onChange={onSetGapLimit}
                  min={1}
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
