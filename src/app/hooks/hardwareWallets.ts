import { useMutation } from 'react-query';
import { ApiClient } from '../api/api';
import {
  HardwareWalletPromptToUnlockResponseType,
  HardwareWalletSetPassphraseResponseType,
  HardwareWalletUnlockResponseType,
  HardwareWalletXpubResponseType,
} from '../api/types';

export function useGetConnectedHardwareWallets(
  onSuccess?: () => void,
  onError?: () => void,
) {
  return useMutation(() => ApiClient.getConnectedHardwareWallets(), {
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: () => {
      if (onError) {
        onError();
      }
    },
  });
}

type GetHardwareWalletXpubParams = {
  walletUuid: string;
  accountNumber: string;
  derivationPath: string;
};

export function useGetXpubFromHardwareWallet(
  onSuccess?: (data: HardwareWalletXpubResponseType) => void,
  onError?: () => void,
) {
  return useMutation(
    ({
      walletUuid,
      derivationPath,
      accountNumber,
    }: GetHardwareWalletXpubParams) =>
      ApiClient.getXpubFromDevice(walletUuid, accountNumber, derivationPath),
    {
      onSuccess: (data: HardwareWalletXpubResponseType) => {
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: () => {
        if (onError) {
          onError();
        }
      },
    },
  );
}

type PromptToUnlockWalletParams = {
  walletUuid: string;
};
export function usePromptToUnlockWallet(
  onSuccess?: (data: HardwareWalletPromptToUnlockResponseType) => void,
  onError?: () => void,
) {
  return useMutation(
    ({ walletUuid }: PromptToUnlockWalletParams) =>
      ApiClient.promptToUnlockWallet(walletUuid),
    {
      onSuccess: (data: HardwareWalletPromptToUnlockResponseType) => {
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: () => {
        if (onError) {
          onError();
        }
      },
    },
  );
}

type UnlockWalletParams = {
  walletUuid: string;
  pin: string;
};
export function useUnlockWalletMutation(
  onSuccess?: (data: HardwareWalletUnlockResponseType) => void,
  onError?: () => void,
) {
  return useMutation(
    ({ walletUuid, pin }: UnlockWalletParams) =>
      ApiClient.unlockWallet(walletUuid, pin),
    {
      onSuccess: (data: HardwareWalletUnlockResponseType) => {
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: () => {
        if (onError) {
          onError();
        }
      },
    },
  );
}

type SetWalletPassphraseParams = {
  walletUuid: string;
  passphrase: string;
};
export function useSetWalletPassphraseMutation(
  onSuccess?: (data: HardwareWalletSetPassphraseResponseType) => void,
  onError?: () => void,
) {
  return useMutation(
    ({ walletUuid, passphrase }: SetWalletPassphraseParams) =>
      ApiClient.setWalletPassphrase(walletUuid, passphrase),
    {
      onSuccess: (data: HardwareWalletSetPassphraseResponseType) => {
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: () => {
        if (onError) {
          onError();
        }
      },
    },
  );
}
