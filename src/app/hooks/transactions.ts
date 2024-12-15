import { ApiClient } from '../api/api';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  AddLabelRequestBody,
  GetOutputLabelsPopulateResponseType,
  PopulateOutputLabelsBodyType,
  RemoveLabelRequestParams,
} from '../api/types';

export const uxtoQueryKeys = {
  getTransactions: ['getTransactions'],
  getOutputs: ['getOutputs'],
  getOutputLabels: ['getOutputLabels'],
  getOutputLabelsUnique: ['getOutputLabelsUnique'],
};

export function useGetTransactions() {
  return useQuery(
    uxtoQueryKeys.getTransactions,
    () => ApiClient.getTransactions(),
    {
      refetchOnWindowFocus: false,
      refetchInterval: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );
}

export function useGetOutputs() {
  return useQuery(uxtoQueryKeys.getOutputs, () => ApiClient.getOutputs(), {
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetOutputLabels() {
  return useQuery(
    uxtoQueryKeys.getOutputLabels,
    () => ApiClient.getOutputLabels(),
    {
      refetchOnWindowFocus: true,
    },
  );
}

export function useGetOutputLabelsUnique(
  handleSuccess: (data: GetOutputLabelsPopulateResponseType) => void,
) {
  return useQuery(
    uxtoQueryKeys.getOutputLabelsUnique,
    () => ApiClient.getOutputLabelsUnique(),
    {
      refetchOnWindowFocus: true,
      onSuccess: (data: GetOutputLabelsPopulateResponseType) => {
        // save in global wallet storage
        // so that when a user saves their wallet the labels are saved
        // and then can later repopulate the db on wallet load/import.
        handleSuccess(data);
      },
    },
  );
}

export function usePopulateOutputLabels(
  onSuccess?: () => void,
  onError?: () => void,
) {
  return useMutation(
    (body: PopulateOutputLabelsBodyType) =>
      ApiClient.populateOutputLabelsUnique(body),
    {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: () => {
        onError();
      },
    },
  );
}

export function useAddUtxoLabel(onError?: () => void) {
  const queryClient = useQueryClient();
  return useMutation(
    (addLabelRequestBody: AddLabelRequestBody) =>
      ApiClient.addOutputLabel(addLabelRequestBody),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(uxtoQueryKeys.getOutputs);
        queryClient.invalidateQueries(uxtoQueryKeys.getOutputLabelsUnique);
      },
      onError: () => {
        onError();
      },
    },
  );
}

export function useRemoveUtxoLabel(onError?: () => void) {
  const queryClient = useQueryClient();
  return useMutation(
    (requestParams: RemoveLabelRequestParams) =>
      ApiClient.removeOutputLabel(
        requestParams.txid,
        requestParams.vout,
        requestParams.labelName,
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(uxtoQueryKeys.getOutputs);
        // we need to invalidate the output labels unique query
        // so that the  useGetOutputLabelsUnique refires, which will
        // populate the global wallet.labels object with the updated labels
        // keeping the global wallet.labels object in sync with the latest changes in the db.
        queryClient.invalidateQueries(uxtoQueryKeys.getOutputLabelsUnique);
      },
      onError: () => {
        onError();
      },
    },
  );
}
