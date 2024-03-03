import { useGetCurrentFees } from "../hooks/utxos";
export const CurrentFeeRates = () => {
  const getCurrentFeesQueryRequest = useGetCurrentFees();

  return (
    <div className="mt-4">
      {getCurrentFeesQueryRequest.isSuccess ? (
        <>
          <h2> Current fee rate </h2>
          <p> low: {getCurrentFeesQueryRequest.data.low} sat/vB </p>
          <p> medium: {getCurrentFeesQueryRequest.data.medium} sat/vB </p>
          <p> high: {getCurrentFeesQueryRequest.data.high} sat/vB </p>
        </>
      ) : null}
      {getCurrentFeesQueryRequest.isError ? (
        <p className="text-red-400"> Error fetch current fee rates </p>
      ) : null}
    </div>
  );
};
