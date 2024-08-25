import {
  HardwareWalletDetails,
  HardwareWalletPromptToUnlockResponseType,
  HardwareWalletSetPassphraseResponseType,
  HardwareWalletUnlockResponseType,
} from '../api/types';

import { Button, Checkbox, Collapse, Input, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { AccountTypeOption } from './formOptions';
import {
  WalletIdAccountNumbers,
  WalletIdDerivationPaths,
} from './ConnectHardwareModal';
import { useEffect, useMemo, useState } from 'react';
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

enum HardwareWalletState {
  LOCKED,
  READY_FOR_PIN,
  READY_FOR_PASSPHRASE,
  AVAILABLE,
}

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

  const [hardwareWalletState, setHardwareWalletState] =
    useState<HardwareWalletState>(HardwareWalletState.LOCKED);

  useEffect(() => {
    if (wallet.needs_pin_sent) {
      setHardwareWalletState(HardwareWalletState.LOCKED);
    } else if (wallet.needs_passphrase_sent) {
      setHardwareWalletState(HardwareWalletState.READY_FOR_PASSPHRASE);
    } else {
      setHardwareWalletState(HardwareWalletState.AVAILABLE);
    }
  }, [wallet.needs_pin_sent, wallet.needs_passphrase_sent]);

  const onSetWalletPassphraseError = () => {
    notifications.show({
      title: 'Setting passphrase failed',
      message: 'Please try again.',
      color: 'red',
    });
  };

  const onPassphraseSuccess = (
    data: HardwareWalletSetPassphraseResponseType,
  ) => {
    if (data.was_passphrase_set) {
      setHardwareWalletState(HardwareWalletState.AVAILABLE);
    } else {
      onSetWalletPassphraseError();
    }
  };

  const setWalletPassphraseMutation = useSetWalletPassphraseMutation(
    onPassphraseSuccess,
    onSetWalletPassphraseError,
  );
  const isPassphrasePending =
    wallet.needs_passphrase_sent && !setWalletPassphraseMutation.isSuccess;
  const isLockedOrNeedsPassphrase =
    hardwareWalletState === HardwareWalletState.LOCKED || isPassphrasePending;

  const [isShowDerivation, setIsShowDerivation] = useState(false);
  const onPromptToUnlockSuccess = (
    response: HardwareWalletPromptToUnlockResponseType,
  ) => {
    if (response.was_prompt_successful) {
      setHardwareWalletState(HardwareWalletState.READY_FOR_PIN);
    }
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
      if (wallet.needs_passphrase_sent) {
        setHardwareWalletState(HardwareWalletState.READY_FOR_PASSPHRASE);
      } else {
        setHardwareWalletState(HardwareWalletState.AVAILABLE);
      }
    } else {
      // After a failed unlock, we need to prompt the wallet again
      // before we can send a pin again, therefore the wallet is LOCKED
      setHardwareWalletState(HardwareWalletState.LOCKED);

      setPin('');

      notifications.show({
        title: 'Invalid pin.',
        message: 'Please unlock and try again.',
        color: 'red',
      });
    }
  };
  const handleUnlockError = () => {
    setHardwareWalletState(HardwareWalletState.LOCKED);
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
        disabled={hardwareWalletState !== HardwareWalletState.READY_FOR_PIN}
      >
        Enter pin
      </Button>
    );
  }, [unlockWalletMutation.isLoading, hardwareWalletState, sendPin]);

  return (
    <div>
      <div className="flex flex-row w-full items-center">
        <Checkbox
          data-testid={`hardware-walletcheckbox-${wallet.id}`}
          className="mr-2 mb-4"
          onClick={() => {
            if (selectedHWId === wallet.id) {
              setSelectedHWId(null);
            } else {
              setSelectedHWId(wallet.id);
            }
          }}
          checked={selectedHWId === wallet.id}
          disabled={hardwareWalletState !== HardwareWalletState.AVAILABLE}
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
            {hardwareWalletState === HardwareWalletState.LOCKED ||
            hardwareWalletState === HardwareWalletState.READY_FOR_PIN ? (
              <Button
                loading={promptToUnlockMutation.isLoading}
                onClick={promptToUnlock}
                size="sm"
                color="green"
                disabled={hardwareWalletState !== HardwareWalletState.LOCKED}
              >
                Unlock
              </Button>
            ) : isPassphrasePending &&
              hardwareWalletState ===
                HardwareWalletState.READY_FOR_PASSPHRASE ? (
              <div className="flex items-center justify-center  text-sm">
                passphrase required
              </div>
            ) : (
              hardwareWalletState === HardwareWalletState.AVAILABLE && (
                <Select
                  data={accountOptions}
                  data-testid={`account-select-${wallet.id}`}
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
              )
            )}
          </div>
          <Collapse
            in={hardwareWalletState === HardwareWalletState.READY_FOR_PIN}
          >
            {isTrezor ? (
              <div className="flex flex-row mt-4">
                <TrezorKeypad
                  currentPin={pin}
                  onPadClick={
                    hardwareWalletState === HardwareWalletState.READY_FOR_PIN
                      ? setPin
                      : () => {}
                  }
                />
                <div className="w-full ml-3 flex flex-col justify-between">
                  <Input
                    data-testid="send-pin-input-trezor"
                    value={pin}
                    onInput={(event: any) => {
                      if (event?.target?.value) {
                        setPin(event?.target?.value);
                      }
                    }}
                    type="password"
                    styles={{ input: { fontSize: '2.5rem' } }}
                    disabled={
                      unlockWalletMutation.isLoading ||
                      hardwareWalletState !== HardwareWalletState.READY_FOR_PIN
                    }
                  />
                  <EnterPinButton />
                </div>
              </div>
            ) : (
              <>
                <Input
                  data-testid="send-pin-input"
                  placeholder="Enter pin"
                  className="w-full"
                  value={pin}
                  onInput={(event: any) => {
                    if (event?.target?.value) {
                      //@ts-ignore
                      setPin(event.target?.value);
                    }
                  }}
                  disabled={
                    unlockWalletMutation.isLoading ||
                    hardwareWalletState !== HardwareWalletState.READY_FOR_PIN
                  }
                />

                <EnterPinButton />
              </>
            )}
          </Collapse>
          <Collapse
            in={
              isPassphrasePending &&
              hardwareWalletState === HardwareWalletState.READY_FOR_PASSPHRASE
            }
          >
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
              data-testid={`derivation-path-${wallet.id}`}
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
