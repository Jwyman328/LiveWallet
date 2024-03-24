import { useMutation, useQuery } from 'react-query';
import { ApiClient } from '../api/api';
import { Network } from '../types/network';

const queryKeys = {
  getWalletType: 'getWalletType',
};

export function useCreateWallet(
  descriptor: string,
  network: Network,
  electrumUrl: string,
  onSuccess: () => void,
  onError: () => void,
) {
  return useMutation(
    () => ApiClient.initiateWallet(descriptor, network, electrumUrl),
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

export function useGetWalletType() {
  return useQuery(queryKeys.getWalletType, () => ApiClient.getWalletType());
}
