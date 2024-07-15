import { HardwareWalletDetails } from '../api/types';

import { Button, Checkbox, Collapse, Input, Select } from '@mantine/core';
import { AccountTypeOption } from './formOptions';
import {
  WalletIdAccountNumbers,
  WalletIdDerivationPaths,
} from './ConnectHardwareModal';
import { useState } from 'react';
import { ApiClient } from '../api/api';
import { TrezorKeypad } from './TrezorKeypad';

type HardwareWalletSelectProps = {
  wallet: HardwareWalletDetails;
  accountOptions: AccountTypeOption[];
  selectedAccounts: WalletIdAccountNumbers;
  setSelectedAccounts: React.Dispatch<
    React.SetStateAction<WalletIdAccountNumbers>
  >;
  selectedHWId: string | null;
  setSelectedHWId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDerivationPath: React.Dispatch<
    React.SetStateAction<WalletIdDerivationPaths>
  >;
  selectedDerivationPaths: WalletIdDerivationPaths;
};

export const HardwareWalletSelect = ({
  wallet,
  accountOptions,
  selectedAccounts,
  setSelectedAccounts,
  selectedHWId,
  setSelectedHWId,
  setSelectedDerivationPath,
  selectedDerivationPaths,
}: HardwareWalletSelectProps) => {
  const model = wallet.model.replace('_', ' ');
  const isTrezor = wallet.type === 'trezor';

  const [isReadyForPin, setIsReadyForPin] = useState(false);
  const [wasUnlockSuccessful, setWasUnlockSuccessful] = useState(false);
  const isLockedOrNeedsPassphrase =
    !wasUnlockSuccessful &&
    (wallet.needs_pin_send || wallet.needs_passphrase_sent);

  const [isShowDerivation, setIsShowDerivation] = useState(false);
  const promptToUnlock = async () => {
    try {
      // TODO use hook and use loading states
      const response = await ApiClient.promptToUnlockWallet(wallet.id);
      if (response.was_prompt_successful) {
        setIsReadyForPin(true);
      }
    } catch (e) {
      console.log('error', e);
    }
  };
  const [pin, setPin] = useState('');

  const sendPin = async () => {
    try {
      // TODO use hook and use loading states
      const response = await ApiClient.unlockWallet(wallet.id, pin);
      if (response.was_unlock_successful) {
        setWasUnlockSuccessful(true);
      }
    } catch (e) {
      // TODO throw some type of toast to let the user know the request failed and they should try again
      console.log('error', e);
    }
  };
  return (
    <div>
      <div className="flex flex-row w-full items-center">
        <Checkbox
          className="mr-2 mb-4"
          onClick={() => {
            if (selectedHWId === wallet.id) {
              setSelectedHWId(null);
            } else {
              setSelectedHWId(wallet.id);
            }
          }}
          checked={selectedHWId === wallet.id}
          //disabled={isLockedOrNeedsPassphrase}
          disabled={false}
        />
        <div className="items-center border rounded border-gray-600 p-2 bg-gray-100  mb-4 w-full">
          <div className="flex flex-row justify-between">
            <div>
              <p className="capitalize">{model}</p>
              {!isLockedOrNeedsPassphrase && (
                <Button
                  onClick={() => setIsShowDerivation(!isShowDerivation)}
                  style={{ padding: '0px' }}
                  variant="transparent"
                >
                  {!isShowDerivation ? 'Show derivation' : 'Hide derivation'}
                </Button>
              )}
            </div>
            {isLockedOrNeedsPassphrase && !isReadyForPin ? (
              <Button onClick={promptToUnlock} size="sm" color="green">
                Unlock
              </Button>
            ) : (
              <Select
                data={accountOptions}
                placeholder="Pick value"
                defaultValue={'0'}
                onChange={(value) => {
                  setSelectedAccounts({
                    ...selectedAccounts,
                    //@ts-ignore
                    [wallet.id]: value as string,
                  });
                }}
              />
            )}
          </div>
          <Collapse
            in={
              isReadyForPin && isLockedOrNeedsPassphrase && !wasUnlockSuccessful
            }
          >
            {isTrezor ? (
              <div className="flex flex-row mt-4">
                <TrezorKeypad currentPin={pin} onPadClick={setPin} />
                <div className="w-full ml-3 flex flex-col justify-between">
                  <Input
                    data-testid="send pin"
                    value={pin}
                    onInput={(event) => {
                      setPin(event.target.value);
                    }}
                    type="password"
                    styles={{ input: { fontSize: '2.5rem' } }}
                  />
                  <Button onClick={sendPin}>Enter Pin</Button>
                </div>
              </div>
            ) : (
              <>
                <Input
                  data-testid="send pin"
                  className="w-full"
                  value={pin}
                  onInput={(event) => {
                    setPin(event.target.value);
                  }}
                />

                <Button onClick={sendPin}>Enter Pin</Button>
              </>
            )}
          </Collapse>
          <Collapse in={isShowDerivation}>
            <Input
              data-testid="derivation-path"
              className="w-full"
              value={selectedDerivationPaths[wallet.id] || "m/84'/0'/0'"}
              onInput={(event) => {
                setSelectedDerivationPath({
                  ...selectedDerivationPaths,
                  //@ts-ignore
                  [wallet.id]: event.target.value,
                });
              }}
            />
          </Collapse>
        </div>
      </div>
    </div>
  );
};
