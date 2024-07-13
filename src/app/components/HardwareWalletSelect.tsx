import { HardwareWalletDetails } from '../api/types';

import { Button, Checkbox, Collapse, Input, Select } from '@mantine/core';
import { AccountTypeOption } from './formOptions';
import {
  WalletIdAccountNumbers,
  WalletIdDerivationPaths,
} from './ConnectHardwareModal';
import { useState } from 'react';

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

  const isLockedOrNeedsPassphrase =
    wallet.needs_pin_send || wallet.needs_passphrase_sent;
  const [isShowDerivation, setIsShowDerivation] = useState(false);

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
              <Button size="sm" color="green">
                Unlock
              </Button>
            ) : (
              <Select
                data={accountOptions}
                placeholder="Pick value"
                defaultValue={'0'}
                onSelect={(event) => {
                  const labelToValue = accountOptions.find(
                    (accountOption) =>
                      // @ts-ignore
                      accountOption.label === event.target?.value,
                  );
                  setSelectedAccounts({
                    ...selectedAccounts,
                    //@ts-ignore
                    [wallet.id]: labelToValue.value,
                  });
                }}
              />
            )}
          </div>
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
