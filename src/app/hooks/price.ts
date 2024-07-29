import { ApiClient } from '../api/api';
import { useQuery } from 'react-query';
import { GetBTCPriceResponseType } from '../api/types';

export const uxtoQueryKeys = {
  getBtcPrice: ['getBtcPrice'],
};
type getBtcPriceProps = {
  onSuccess?: (data: GetBTCPriceResponseType) => void;
  onError?: () => void;
};
export function useGetBtcPrice({ onSuccess, onError }: getBtcPriceProps) {
  return useQuery(
    uxtoQueryKeys.getBtcPrice,
    () => ApiClient.getCurrentBtcPrice(),
    {
      refetchOnWindowFocus: false,
      onSuccess: (data: GetBTCPriceResponseType) => {
        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: () => {
        if (onError) {
          onError();
        }
      },
    },
  );
}
