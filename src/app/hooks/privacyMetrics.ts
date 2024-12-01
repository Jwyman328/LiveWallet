import { ApiClient } from '../api/api';
import { useMutation, useQuery } from 'react-query';
import { AnalyzeTxPrivacyRequestBody } from '../api/types';

export const uxtoQueryKeys = {
  getPrivacyMetrics: (txid: string) => ['getPrivacyMetrics', txid],
};

export function useGetPrivacyMetrics(txid: string) {
  return useQuery(
    uxtoQueryKeys.getPrivacyMetrics(txid),
    () => ApiClient.getAllPrivacyMetrics(),
    {
      refetchOnWindowFocus: true,
    },
  );
}

export function useAnalyzeTxPrivacy(
  onSuccess?: () => void,
  onError?: () => void,
) {
  return useMutation(
    (body: AnalyzeTxPrivacyRequestBody) => ApiClient.analyzeTxPrivacy(body),
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
