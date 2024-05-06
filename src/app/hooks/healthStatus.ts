import { ApiClient } from '../api/api';
import { useQuery } from 'react-query';

export const serverHealthStatusQueryKeys = {
  getServerHealthStatus: ['getServerHealthStatus'],
};

export function useGetServerHealthStatus() {
  return useQuery(
    serverHealthStatusQueryKeys.getServerHealthStatus,
    () => ApiClient.getServerHealthStatus(),
    {
      refetchOnWindowFocus: true,
      retryDelay: 5,
      retry: 10,
    },
  );
}
