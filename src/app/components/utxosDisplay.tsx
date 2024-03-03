import React, { useEffect, useState } from "react";
import { UtxoRequestParam } from "../api/api";
import { Utxo } from "../api/types";
import { useCreateTxFeeEstimate } from "../hooks/utxos";

type UtxosDisplayProps = {
  utxos: Utxo[];
  feeRate: number;
};
export const UtxosDisplay = ({ utxos, feeRate }: UtxosDisplayProps) => {
  const [selectedUtxos, setSelectedUtxos] = useState<UtxoRequestParam[]>([]);

  const addUtxoToSelectedList = (e: any, txid: string, vout: number) => {
    const isAlreadyChecked = selectedUtxos.some((selectedUtxo) => {
      return txid === selectedUtxo.id && selectedUtxo.vout === vout;
    });
    if (isAlreadyChecked) {
      const newSelectedUtxos: UtxoRequestParam[] = selectedUtxos.filter(
        (selectedUtxo) => {
          return selectedUtxo.id !== txid && selectedUtxo.vout !== vout;
        },
      );
      setSelectedUtxos(newSelectedUtxos);
    } else {
      setSelectedUtxos([...selectedUtxos, { id: txid, vout: vout }]);
    }
  };

  const {
    mutate,
    isLoading,
    data: batchedTxData,
    mutateAsync,
  } = useCreateTxFeeEstimate(selectedUtxos, feeRate);

  const calculateFeeEstimate = async () => {
    const response = await mutateAsync();
    console.log("response", response);
  };

  const UtxoDisplay = (utxo: Utxo) => {
    const { mutate, data } = useCreateTxFeeEstimate(
      [{ id: utxo.txid, vout: utxo.vout }],
      feeRate,
    );
    const fee = data?.fee;
    const percentOfTxFee = fee && utxo?.amount ? (fee / utxo.amount) * 100 : 0;
    const isSpendable: boolean = data?.spendable;

    useEffect(() => {
      mutate();
    }, [mutate]);
    return (
      <div>
        <p className="text-black">txid: {utxo.txid}</p>
        <p className="text-black">txvout: {utxo.vout} </p>
        <p className="text-black">
          amount: {(utxo.amount / 100000000).toFixed(8)}
        </p>

        {isSpendable ? (
          <div>
            <p className="text-black">
              fee estimate: {(fee / 100000000).toFixed(8) || "pending"}
            </p>
            <p className="text-black">
              % of tx fee: {percentOfTxFee.toFixed(5).replace(/\.?0+$/, "")}%
            </p>
          </div>
        ) : (
          <p className="text-red-600">not spendable</p>
        )}
        <input
          type="checkbox"
          onClick={(e) => addUtxoToSelectedList(e, utxo.txid, utxo.vout)}
          className="mt-3 bg-blue-400"
          checked={selectedUtxos.some((selectedUtxo) => {
            return (
              utxo.txid === selectedUtxo.id && selectedUtxo.vout === utxo.vout
            );
          })}
        />
      </div>
    );
  };

  const DisplayBatchTxData = () => {
    const fee = batchedTxData?.fee;
    const percentOfTxFee = batchedTxData?.percent_fee_is_of_utxo;
    const isSpendable: boolean = batchedTxData?.spendable;

    return isSpendable ? (
      <div>
        <p>batched tx fee: {fee}</p>
        <p>batched % of tx fee: {percentOfTxFee}</p>
      </div>
    ) : (
      <p className="text-red-600">not spendable</p>
    );
  };
  return (
    <div>
      <p className="text-blue-600">utxos display</p>
      {utxos.map((utxo) => {
        return UtxoDisplay(utxo);
      })}

      <button
        className="border rounded border-black"
        onClick={calculateFeeEstimate}
      >
        estimate fee for a transaction using the selected utxos
      </button>
      {batchedTxData ? <DisplayBatchTxData /> : null}
    </div>
  );
};
