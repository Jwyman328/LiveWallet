import { useMutation } from 'react-query';
import { ApiClient } from '../api/api';

export function useCreateWallet(
  descriptor: string,
  onSuccess: () => void,
  onError: () => void,
) {
  return useMutation(() => ApiClient.initiateWallet(descriptor), {
    onSuccess: () => {
      onSuccess();
    },
    onError: () => {
      onError();
    },
  });
}
