import { ApiClient } from '../api/api';
import {  useQuery } from 'react-query';

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
