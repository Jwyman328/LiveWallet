import { useGetCurrentFees } from '../hooks/utxos';
export const CurrentFeeRates = () => {
  const getCurrentFeesQueryRequest = useGetCurrentFees();
  const feeRates = [
    { title: 'Low', value: getCurrentFeesQueryRequest?.data?.low },
    { title: 'Medium', value: getCurrentFeesQueryRequest?.data?.medium },
    { title: 'High', value: getCurrentFeesQueryRequest?.data?.high },
  ];

  const Fee = ({ title, rate }: { title: string; rate: string }) => {
    return (
      <div className="border-black rounded border-[1] w-20 p-2 text-center">
        <p className="font-bold">{title}</p>
        <p>{rate} sat/vB </p>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {getCurrentFeesQueryRequest.isSuccess ? (
        <div className="ml-auto mr-auto w-80">
          <h2 className="font-bold text-xl text-center">
            {' '}
            Current fee rate priority{' '}
          </h2>
          <div className="flex flex-row mt-1 mb-2 justify-between ">
            {feeRates.map((feeRate) => (
              <Fee title={feeRate.title} rate={feeRate.value} />
            ))}
          </div>
        </div>
      ) : null}
      {getCurrentFeesQueryRequest.isError ? (
        <p className="text-red-400"> Error fetch current fee rates </p>
      ) : null}
    </div>
  );
};
