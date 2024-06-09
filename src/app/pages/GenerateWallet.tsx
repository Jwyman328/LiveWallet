import {
  Button,
  NumberInput,
  Select,
  InputLabel,
  Notification,
  Loader,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Network } from '../types/network';

import {
  ScriptTypes,
  WalletTypes,
  descriptorTypeToScriptType,
} from '../types/scriptTypes';

import { useState } from 'react';
import { useCreateMockWallet } from '../hooks/wallet';
import { configs } from '../configs';
import {
  NetworkTypeOption,
  ScriptTypeOption,
  networkOptions,
  scriptTypeOptions,
} from '../components/formOptions';
import { XIcon } from '../components/XIcon';
import { CreateMockWalletResponseType } from '../api/types';

export const GenerateWallet = () => {
  const navigate = useNavigate();
  const backToSignIn = () => {
    navigate('/');
  };

  const formItemWidth = 'w-80';
  const labelWidth = 'w-80';

  const defaultNetwork = networkOptions.find(
    (option) => option.value === configs.defaultNetwork,
  ) as NetworkTypeOption;

  const [network, setNetwork] = useState<NetworkTypeOption>(defaultNetwork);

  const [scriptType, setScriptType] = useState<ScriptTypeOption>(
    scriptTypeOptions[0],
  );

  const [utxoCount, setUtxoCount] = useState<string | number>('1');

  const onUtxoCountChange = (count: string | number) => {
    setUtxoCount(count);
  };

  const [minBtcAmount, setMinBtcAmount] = useState<string | number>(
    '0.0000001',
  );
  const [maxBtcAmount, setMaxBtcAmount] = useState<string | number>(
    '1.00000000',
  );
  const canGenerateWallet =
    !!scriptType.value &&
    !!network.value &&
    !!minBtcAmount &&
    !!maxBtcAmount &&
    !!utxoCount;
  const handleMinBtcAmountChange = (amount: string | number) => {
    setMinBtcAmount(amount);
    if (amount > maxBtcAmount) {
      setMaxBtcAmount(amount);
    }
  };

  const parseDescriptor = (descriptor: string) => {
    try {
      let scriptType = descriptor.match(/^([^\(]*)/)[0];
      scriptType = scriptType === 'sh' ? 'sh(wpkh' : scriptType;

      const fingerPrint = descriptor.match(/(?<=\[)([^\/]+)(?=\/)/)[0];

      const derivationPath = descriptor.match(
        /(?<=\/)([^\/\]]+\/[^\/\]]+\/[^\/\]]+)(?=\'])/,
      )[0];
      const closingDerivationIndex = descriptor.indexOf(']');

      const pubType = descriptor.substring(
        closingDerivationIndex + 1,
        closingDerivationIndex + 5,
      ) as 'tpub' | 'xpub';

      const pubValueRegEx = new RegExp(`(?<=${pubType})[^\/]+`);
      const pubValue = descriptor.match(pubValueRegEx)[0];
      return { scriptType, fingerPrint, derivationPath, pubType, pubValue };
    } catch (e) {
      throw new Error('Invalid descriptor');
    }
  };

  const handleMockWalletCreationSuccess = (
    data: CreateMockWalletResponseType,
  ) => {
    const descriptor = data.descriptor;
    configs.defaultDescriptor = descriptor;
    const { scriptType, fingerPrint, derivationPath, pubType, pubValue } =
      parseDescriptor(descriptor);
    configs.defaultMasterFingerprint = fingerPrint;
    configs.defaultDerivationPath = `m/${derivationPath}`;
    configs.defaultXpub = `${pubType}${pubValue}`;
    configs.defaultNetwork = network.value as Network;
    const defaultScriptType = descriptorTypeToScriptType[
      scriptType
    ] as unknown as ScriptTypes;
    configs.defaultScriptType = defaultScriptType;
    navigate('/');
  };
  const generateMockWalletMutation = useCreateMockWallet(
    network.value as Network,
    handleMockWalletCreationSuccess,
    () => {
      setDisplayGenerateWalletError(true);
    },
  );
  const onGenerateWallet = () => {
    generateMockWalletMutation.mutate({
      type: scriptType.value as WalletTypes,
      utxoCount: utxoCount.toString(),
      minUtxoAmount: minBtcAmount.toString(),
      maxUtxoAmount: maxBtcAmount.toString(),
    });
  };

  const [displayGenerateWalletError, setDisplayGenerateWalletError] =
    useState(false);
  return (
    <div className="flex flex-col justify-center items-center">
      <Button className="ml-4 mt-4 self-start" onClick={backToSignIn}>
        Back
      </Button>

      {displayGenerateWalletError && (
        <Notification
          withCloseButton={true}
          onClose={() => setDisplayGenerateWalletError(false)}
          className="border-red-500 border-2 top-2 right-1 self-end w-1/2 z-10"
          style={{ position: 'absolute' }}
          icon={XIcon}
          color="red"
          title="Error!"
        >
          Error generating wallet. Please try again.
        </Notification>
      )}
      <h1 className={`text-4xl font-semibold mb-8 ${labelWidth} text-blue-500`}>
        Generate wallet
      </h1>
      <InputLabel className={`mt-0 mb-2 ${labelWidth}`}>Network</InputLabel>
      <Select
        allowDeselect={false}
        className={formItemWidth}
        data={networkOptions}
        value={network ? network.value : null}
        onChange={(_value, option) => setNetwork(option as NetworkTypeOption)}
      />

      <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>Script type</InputLabel>
      <Select
        allowDeselect={false}
        className={`mb-4 ${formItemWidth}`}
        data={scriptTypeOptions}
        value={scriptType ? scriptType.value : null}
        onChange={(_value, option) => setScriptType(option as ScriptTypeOption)}
      />

      <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>Utxo count</InputLabel>
      <NumberInput
        className={`mb-4 ${formItemWidth}`}
        allowNegative={false}
        value={utxoCount}
        onChange={onUtxoCountChange}
        min={1}
      />

      <InputLabel className={`mt-4 mb-2 ${labelWidth}`}>
        UTXO BTC amount range
      </InputLabel>
      <div className={`flex mb-2 ${labelWidth}`}>
        <div className="mr-4">
          <InputLabel>Min</InputLabel>
          <NumberInput
            allowNegative={false}
            value={minBtcAmount}
            onChange={handleMinBtcAmountChange}
            decimalScale={8}
            step={0.01}
            min={0.0000001}
          />
        </div>
        <div>
          <InputLabel>Max</InputLabel>
          <NumberInput
            allowNegative={false}
            value={maxBtcAmount}
            onChange={setMaxBtcAmount}
            decimalScale={8}
            step={0.01}
            min={0.0000001}
          />
        </div>
      </div>
      <div className={`mt-4 ${formItemWidth}`}>
        <Button
          fullWidth
          disabled={!canGenerateWallet}
          onClick={onGenerateWallet}
        >
          {generateMockWalletMutation.isLoading ? (
            <Loader size={20} color="white" />
          ) : (
            'Generate Wallet'
          )}
        </Button>
      </div>
    </div>
  );
};
