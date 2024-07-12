import { useMutation } from 'react-query';
import { ApiClient } from '../api/api';

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
