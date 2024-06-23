import { ApiClient } from '../api/api';
import { UtxoRequestParam } from '../api/types';
import { useMutation, useQuery } from 'react-query';

export const uxtoQueryKeys = {
  getBalance: ['getBalance'],
  getUtxos: ['getUtxos'],
  getCurrentFees: ['getCurrentFees'],
};

export function useGetBalance() {
  return useQuery(uxtoQueryKeys.getBalance, () => ApiClient.getBalance(), {
    refetchOnWindowFocus: false,
  });
}
export function useGetUtxos() {
  return useQuery(uxtoQueryKeys.getUtxos, () => ApiClient.getUtxos(), {
    refetchOnWindowFocus: true,
  });
}

export function useCreateTxFeeEstimate(
  utxos: UtxoRequestParam[],
  feeRate: number,
) {
  return useMutation(() => ApiClient.createTxFeeEstimation(utxos, feeRate));
}

export function useGetCurrentFees() {
  return useQuery(
    uxtoQueryKeys.getCurrentFees,
    () => ApiClient.getCurrentFees(),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 120000,
    },
  );
}
