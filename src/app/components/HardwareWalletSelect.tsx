import {
  HardwareWalletDetails,
  HardwareWalletPromptToUnlockResponseType,
  HardwareWalletUnlockResponseType,
} from '../api/types';

import { Button, Checkbox, Collapse, Input, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { AccountTypeOption } from './formOptions';
import {
  WalletIdAccountNumbers,
  WalletIdDerivationPaths,
} from './ConnectHardwareModal';
import { useMemo, useState } from 'react';
import { TrezorKeypad } from './TrezorKeypad';
import {
  usePromptToUnlockWallet,
  useSetWalletPassphraseMutation,
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
  const isLocked = !wasUnlockSuccessful && wallet.needs_pin_sent;

  const onSetWalletPassphraseError = () => {
    notifications.show({
      title: 'Setting passphrase failed',
      message: 'Please try again.',
      color: 'red',
    });
  };
  const setWalletPassphraseMutation = useSetWalletPassphraseMutation(
    undefined,
    onSetWalletPassphraseError,
  );
  const isPassphrasePending =
    wallet.needs_passphrase_sent && !setWalletPassphraseMutation.isSuccess;
  const isLockedOrNeedsPassphrase = isLocked || isPassphrasePending;

  const [isShowDerivation, setIsShowDerivation] = useState(false);
  const onPromptToUnlockSuccess = (
    response: HardwareWalletPromptToUnlockResponseType,
  ) => {
    if (response.was_prompt_successful) {
      setHasPromptedSuccessfullyOnce(true);
    }
    setIsReadyForPin(response.was_prompt_successful);
  };
  const onPromptToUnlockError = () => {
    notifications.show({
      title: 'Unlocking wallet failed.',
      message: 'Please try again.',
      color: 'red',
    });
  };
  const promptToUnlockMutation = usePromptToUnlockWallet(
    onPromptToUnlockSuccess,
    onPromptToUnlockError,
  );
  const promptToUnlock = async () => {
    try {
      await promptToUnlockMutation.mutateAsync({
        walletUuid: wallet.id,
      });
    } catch (e) {
      // Error handled in the hook
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

      notifications.show({
        title: 'Invalid pin.',
        message: 'Please unlock and try again.',
        color: 'red',
      });
    }
  };
  const handleUnlockError = () => {
    setWasUnlockSuccessful(false);
    setPin('');

    notifications.show({
      title: 'Unlocking wallet with pin failed.',
      message: 'Please try again.',
      color: 'red',
    });
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
      // Error handled in hook
    }
  };

  const [passphrase, setPassphrase] = useState('');

  const sendPassphrase = async () => {
    try {
      await setWalletPassphraseMutation.mutateAsync({
        walletUuid: wallet.id,
        passphrase: passphrase,
      });
    } catch (e) {
      //Error handled in the hook
    }
  };
  const EnterPinButton = useMemo(() => {
    return () => (
      <Button
        loading={unlockWalletMutation.isLoading}
        className="mb-2"
        color={'green'}
        onClick={sendPin}
        disabled={!isReadyForPin}
      >
        Enter Pin
      </Button>
    );
  }, [unlockWalletMutation.isLoading, isReadyForPin, sendPin]);

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
            {isLocked ? (
              <Button
                loading={promptToUnlockMutation.isLoading}
                onClick={promptToUnlock}
                size="sm"
                color="green"
                disabled={isReadyForPin}
              >
                Unlock
              </Button>
            ) : isPassphrasePending ? (
              <div className="flex items-center justify-center  text-sm">
                passphrase required
              </div>
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
            in={(isReadyForPin || hasPromptedSuccessfullyOnce) && isLocked}
          >
            {isTrezor ? (
              <div className="flex flex-row mt-4">
                <TrezorKeypad
                  currentPin={pin}
                  onPadClick={isReadyForPin ? setPin : () => {}}
                />
                <div className="w-full ml-3 flex flex-col justify-between">
                  <Input
                    data-testid="send pin"
                    value={pin}
                    onInput={(event: any) => {
                      if (event?.target?.value) {
                        setPin(event?.target?.value);
                      }
                    }}
                    type="password"
                    styles={{ input: { fontSize: '2.5rem' } }}
                    disabled={unlockWalletMutation.isLoading || !isReadyForPin}
                  />
                  <EnterPinButton />
                </div>
              </div>
            ) : (
              <>
                <Input
                  data-testid="send pin"
                  className="w-full"
                  value={pin}
                  onInput={(event: any) => {
                    if (event?.target?.value) {
                      //@ts-ignore
                      setPin(event.target?.value);
                    }
                  }}
                  disabled={unlockWalletMutation.isLoading || !isReadyForPin}
                />

                <EnterPinButton />
              </>
            )}
          </Collapse>
          <Collapse in={!isLocked && isPassphrasePending}>
            <div className="flex flex-row mt-1">
              <Input
                data-testid="send passphrase"
                className="flex-grow"
                placeholder="Enter passphrase"
                value={passphrase}
                onInput={(event: any) => {
                  if (event?.target?.value) {
                    setPassphrase(event.target.value);
                  }
                }}
                type="password"
                disabled={false}
              />

              <Button
                loading={false}
                onClick={sendPassphrase}
                color={'green'}
                disabled={false}
                className="ml-2"
              >
                Send
              </Button>
            </div>
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
