import { useMutation, useQuery } from 'react-query';
import { ApiClient } from '../api/api';
import { Network } from '../types/network';
import { WalletTypes } from '../types/scriptTypes';
import { CreateMockWalletResponseType } from '../api/types';

export const walletTypeQueryKeys = {
  getWalletType: 'getWalletType',
};

export function useCreateWallet(
  network: Network,
  electrumUrl: string,
  gapLimit: number,
  onSuccess: () => void,
  onError: () => void,
) {
  return useMutation(
    (descriptors: { descriptor: string; changeDescriptor?: string }) =>
      ApiClient.initiateWallet(
        descriptors.descriptor,
        network,
        electrumUrl,
        gapLimit,
        descriptors.changeDescriptor,
      ),
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: () => {
        onError();
      },
    },
  );
}

type CreateMockWalletParams = {
  type: WalletTypes;
  utxoCount: string;
  minUtxoAmount: string;
  maxUtxoAmount: string;
};
export function useCreateMockWallet(
  network: Network,
  onSuccess: (data: CreateMockWalletResponseType) => void,
  onError: () => void,
) {
  return useMutation(
    ({
      type,
      utxoCount,
      minUtxoAmount,
      maxUtxoAmount,
    }: CreateMockWalletParams) =>
      ApiClient.createMockWallet(
        network,
        type,
        utxoCount,
        minUtxoAmount,
        maxUtxoAmount,
      ),
    {
      onSuccess: (data) => {
        onSuccess(data);
      },
      onError: () => {
        onError();
      },
    },
  );
}
export function useGetWalletType() {
  return useQuery(walletTypeQueryKeys.getWalletType, () =>
    ApiClient.getWalletType(),
  );
}

export function useDeleteCurrentWallet(
  onSuccess?: () => void,
  onError?: () => void,
) {
  return useMutation(() => ApiClient.deleteCurrentWallet(), {
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
