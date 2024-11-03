import { ApiClient } from '../api/api';
import { useMutation, useQuery } from 'react-query';
import { AnalyzeTxPrivacyRequestBody } from '../api/types';

export const uxtoQueryKeys = {
  getPrivacyMetrics: ['getPrivacyMetrics'],
};

export function useGetPrivacyMetrics() {
  return useQuery(
    uxtoQueryKeys.getPrivacyMetrics,
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
