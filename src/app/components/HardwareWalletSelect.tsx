import {
  HardwareWalletDetails,
  HardwareWalletPromptToUnlockResponseType,
  HardwareWalletUnlockResponseType,
} from '../api/types';

import {
  Button,
  Checkbox,
  Collapse,
  Input,
  Loader,
  Select,
} from '@mantine/core';
import { AccountTypeOption } from './formOptions';
import {
  WalletIdAccountNumbers,
  WalletIdDerivationPaths,
} from './ConnectHardwareModal';
import { useState } from 'react';
import { ApiClient } from '../api/api';
import { TrezorKeypad } from './TrezorKeypad';
import {
  usePromptToUnlockWallet,
  useUnlockWalletMutation,
} from '../hooks/hardwareWallets';

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
  const [hasPromptedSuccessfullyOnce, setHasPromptedSuccessfullyOnce] =
    useState(false);
  const isLockedOrNeedsPassphrase =
    !wasUnlockSuccessful &&
    (wallet.needs_pin_send || wallet.needs_passphrase_sent);

  const [isShowDerivation, setIsShowDerivation] = useState(false);
  const onPromptToUnlockSuccess = (
    response: HardwareWalletPromptToUnlockResponseType,
  ) => {
    if (response.was_prompt_successful) {
      setIsReadyForPin(true);
      setHasPromptedSuccessfullyOnce(true);
    } else {
      setIsReadyForPin(false);
    }
  };
  const onPromptToUnlockError = () => {
    console.log('TODO handle error');
  };
  const promptToUnlockMutation = usePromptToUnlockWallet(
    onPromptToUnlockSuccess,
    onPromptToUnlockError,
  );
  const promptToUnlock = async () => {
    try {
      // TODO use hook and use loading states
      await promptToUnlockMutation.mutateAsync({
        walletUuid: wallet.id,
      });
    } catch (e) {
      console.log('error', e);
    }
  };
  const [pin, setPin] = useState('');

  const handleUnlockSuccess = (response: HardwareWalletUnlockResponseType) => {
    if (response.was_unlock_successful) {
      setWasUnlockSuccessful(true);
    } else {
      setWasUnlockSuccessful(false);
      // After a failed unlock, we need to prompt the wallet again
      // before we can send a pin again, therefore the wallet is not ready for pin
      setIsReadyForPin(false);

      setPin('');
    }
  };
  const handleUnlockError = () => {
    console.log('TODO handle error');

    setWasUnlockSuccessful(false);
    setPin('');
  };
  const unlockWalletMutation = useUnlockWalletMutation(
    handleUnlockSuccess,
    handleUnlockError,
  );

  const sendPin = async () => {
    try {
      await unlockWalletMutation.mutateAsync({
        walletUuid: wallet.id,
        pin: pin,
      });
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
          disabled={isLockedOrNeedsPassphrase}
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
            {isLockedOrNeedsPassphrase ? (
              <Button
                loading={promptToUnlockMutation.isLoading}
                onClick={promptToUnlock}
                size="sm"
                color="green"
                disabled={isReadyForPin}
              >
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
              (isReadyForPin || hasPromptedSuccessfullyOnce) &&
              isLockedOrNeedsPassphrase &&
              !wasUnlockSuccessful
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
                    disabled={unlockWalletMutation.isLoading || !isReadyForPin}
                  />
                  <Button
                    loading={unlockWalletMutation.isLoading}
                    className="mb-2"
                    color={'green'}
                    onClick={sendPin}
                    disabled={!isReadyForPin}
                  >
                    Enter Pin
                  </Button>
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
                  disabled={unlockWalletMutation.isLoading || !isReadyForPin}
                />

                <Button
                  loading={unlockWalletMutation.isLoading}
                  onClick={sendPin}
                  color={'green'}
                  disabled={!isReadyForPin}
                >
                  Enter Pin
                </Button>
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
