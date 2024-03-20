import React, { useMemo } from 'react';
import { UtxoRequestParam } from '../api/api';

import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { Utxo } from '../api/types';
import { useCreateTxFeeEstimate } from '../hooks/utxos';
import { Button } from '@mantine/core';

type UtxosDisplayProps = {
  utxos: Utxo[];
  feeRate: number;
};
export const UtxosDisplay = ({ utxos, feeRate }: UtxosDisplayProps) => {
  const columns = useMemo(
    () => [
      {
        header: 'Txid',
        accessorKey: 'txid',
        Cell: ({ row }: { row: any }) => {
          return (
            <div>
              <p> {row.original.txid}</p>
            </div>
          );
        },
      },

      {
        header: 'vout',
        accessorKey: 'vout',
        Cell: ({ row }: { row: any }) => {
          return (
            <div>
              <p> {row.original.vout}</p>
            </div>
          );
        },
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        Cell: ({ row }: { row: any }) => {
          return (
            <div>
              <p> {row.original.amount}</p>
            </div>
          );
        },
      },
    ],
    [],
  );
  const table = useMaterialReactTable({
    columns,
    data: utxos,
    enableRowSelection: true,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    getRowId: (originalRow) => {
      return originalRow.txid;
    },
  });

  const selectedTxs = table.getState().rowSelection;

  const selectedUtxos: UtxoRequestParam = useMemo(() => {
    const selectedUtxosFromatted: UtxoRequestParam = [];
    utxos.forEach((utxo: any) => {
      if (selectedTxs[utxo.txid]) {
        selectedUtxosFromatted.push({ id: utxo.txid, vout: utxo.vout });
      }
    });
    return selectedUtxosFromatted;
  }, [selectedTxs, utxos]);

  const { data: batchedTxData, mutateAsync } = useCreateTxFeeEstimate(
    selectedUtxos,
    feeRate,
  );

  const calculateFeeEstimate = async () => {
    const response = await mutateAsync();
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

      <MaterialReactTable table={table} />
      <Button
        disabled={selectedUtxos.length === 0}
        className="mt-4 mb-4"
        onClick={calculateFeeEstimate}
      >
        Estimate fee
      </Button>
      {batchedTxData ? <DisplayBatchTxData /> : null}
    </div>
  );
};
