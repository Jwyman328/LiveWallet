import { ApiClient } from '../api/api';
import { useMutation, useQuery } from 'react-query';
import { AddLabelRequestBody, RemoveLabelRequestParams } from '../api/types';

export const uxtoQueryKeys = {
  getTransactions: ['getTransactions'],
  getOutputs: ['getOutputs'],
  getOutputLabels: ['getOutputLabels'],
};

export function useGetTransactions() {
  return useQuery(
    uxtoQueryKeys.getTransactions,
    () => ApiClient.getTransactions(),
    {
      refetchOnWindowFocus: true,
    },
  );
}

export function useGetOutputs() {
  return useQuery(uxtoQueryKeys.getOutputs, () => ApiClient.getOutputs(), {
    refetchOnWindowFocus: true,
  });
}

export function useGetOutputLabels() {
  return useQuery(
    uxtoQueryKeys.getOutputLabels,
    () => ApiClient.getOutputLabels(),
    {
      refetchOnWindowFocus: false,
    },
  );
}

export function useAddUtxoLabel(onError?: () => void) {
  return useMutation(
    (addLabelRequestBody: AddLabelRequestBody) =>
      ApiClient.addOutputLabel(addLabelRequestBody),
    {
      onError: () => {
        onError();
      },
    },
  );
}

export function useRemoveUtxoLabel(onError?: () => void) {
  return useMutation(
    (requestParams: RemoveLabelRequestParams) =>
      ApiClient.removeOutputLabel(
        requestParams.txid,
        requestParams.vout,
        requestParams.labelName,
      ),
    {
      onError: () => {
        onError();
      },
    },
  );
}
