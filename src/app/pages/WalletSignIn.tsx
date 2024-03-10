import { useNavigate } from 'react-router-dom';
import { useCreateWallet } from '../hooks/wallet';
import React, { useState } from 'react';
import { Network } from '../types/network';

import {
  ComboboxItem,
  Select,
  Input,
  InputLabel,
  Button,
  Textarea,
} from '@mantine/core';

export const WalletSignIn = () => {
  const mockDescriptor =
    'wpkh(tprv8ZgxMBicQKsPcx5nBGsR63Pe8KnRUqmbJNENAfGftF3yuXoMMoVJJcYeUw5eVkm9WBPjWYt6HMWYJNesB5HaNVBaFc1M6dRjWSYnmewUMYy/84h/0h/0h/0/*)';

  const mockElectrumUrl = '127.0.0.1:50000';

  const [descriptor, setDescriptor] = useState(mockDescriptor);
  const [electrumUrl, setElectrumUrl] = useState(mockElectrumUrl);

  const networkOptions = [
    { value: Network.TESTNET, label: Network.TESTNET },
    { value: Network.REGTEST, label: Network.REGTEST },
    { value: Network.BITCOIN, label: Network.BITCOIN },
    { value: Network.SIGNET, label: Network.SIGNET },
  ];

  const [network, setNetwork] = useState<ComboboxItem>(networkOptions[0]);

  const navigate = useNavigate();

  const handleWalletInitiated = () => {
    navigate('/home');
  };

  const handleWalletError = () => {
    console.log('Error initiating wallet');
  };

  const initiateWalletRequest = useCreateWallet(
    descriptor,
    network.value as Network,
    electrumUrl,
    handleWalletInitiated,
    handleWalletError,
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptor(e.target.value);
  };

  const handleElectrumInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setElectrumUrl(e.target.value);
  };

  const isLoginEnabled = !!descriptor && !!network.value && !!electrumUrl;

  const signIn = async () => {
    try {
      await initiateWalletRequest.mutateAsync();
    } catch (e) {
      console.log('Error', e);
    }
  };
  return (
    <div className="px-4">
      <h1>Setup wallet</h1>
      <InputLabel>Enter xpub descriptor</InputLabel>
      <Textarea
        placeholder="Enter xpub descriptor"
        onInput={handleInput}
        value={descriptor}
      />
      <InputLabel className="mt-2">Choose a network</InputLabel>
      <Select
        data={networkOptions}
        value={network ? network.value : null}
        onChange={(_value, option) => setNetwork(option)}
        clearable
      />

      <InputLabel>Electrum url</InputLabel>
      <Input
        type="text"
        placeholder="Enter electrum url"
        onInput={handleElectrumInput}
        value={electrumUrl}
      />
      <Button
        disabled={!isLoginEnabled}
        className="mt-4"
        type="button"
        onClick={signIn}
      >
        login here
      </Button>
    </div>
  );
};
