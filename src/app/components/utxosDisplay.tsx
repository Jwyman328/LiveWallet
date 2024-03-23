import React, { useMemo } from 'react';
import { UtxoRequestParam } from '../api/api';

import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { Utxo } from '../api/types';
import { useCreateTxFeeEstimate } from '../hooks/utxos';
import { Button, Tooltip, CopyButton, ActionIcon, rem } from '@mantine/core';

import { IconCopy, IconCheck } from '@tabler/icons-react';
type UtxosDisplayProps = {
  utxos: Utxo[];
  feeRate: number;
};
export const UtxosDisplay = ({ utxos, feeRate }: UtxosDisplayProps) => {
  // TODO add color of row based off of fee rate percent
  const estimateVBtyePerInput = 200;
  const estimateVBtyeOverheadAndOutput = 50;

  const avgInputCost = estimateVBtyePerInput * feeRate;
  const avgBaseCost = estimateVBtyeOverheadAndOutput * feeRate;

  const calculateFeePercent = (amount: Number) => {
    const totalCost = avgBaseCost + avgInputCost;
    const percentOfAmount = (totalCost / amount) * 100;
    const formatted =
      percentOfAmount > 1
        ? percentOfAmount.toFixed(2)
        : percentOfAmount.toFixed(4);

    return formatted;
  };
  const columns = useMemo(
    () => [
      {
        header: 'Txid',
        accessorKey: 'txid',
        Cell: ({ row }: { row: any }) => {
          const prefix = row.original.txid.substring(0, 7);
          const suffix = row.original.txid.substring(
            row.original.txid.length - 7,
          );
          const abrv = `${prefix}....${suffix}`;
          return (
            <div className="flex justify-center items-center">
              <Tooltip label={row.original.txid}>
                <p className="mr-2">{abrv}</p>
              </Tooltip>
              <CopyButton value={row.original.txid} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? 'Copied' : 'Copy'}
                    withArrow
                    position="right"
                  >
                    <ActionIcon
                      color={copied ? 'teal' : 'gray'}
                      variant="subtle"
                      onClick={copy}
                    >
                      {copied ? (
                        <IconCheck style={{ width: rem(16) }} />
                      ) : (
                        <IconCopy style={{ width: rem(16) }} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
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
        header: '~ Fee rate %',
        accessorKey: 'selfCost',
        Cell: ({ row }: { row: any }) => {
          const feePct = row.original.amount
            ? `${calculateFeePercent(row.original.amount)}%`
            : '...';
          return (
            <div>
              <p> {feePct}</p>
            </div>
          );
        },
      },
      {
        header: 'Spendable',
        accessorKey: 'Spendable',
        Cell: ({ row }: { row: any }) => {
          const feePct = row.original.amount
            ? calculateFeePercent(row.original.amount)
            : null;

          const isSpendable = feePct === null ? '...' : Number(feePct) < 100;
          // TODO use check and x icons
          return (
            <div>
              <p>{isSpendable ? 'yes' : 'no'}</p>
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
    [avgBaseCost, avgInputCost],
  );
  const table = useMaterialReactTable({
    columns,
    data: utxos,
    enableRowSelection: true,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enablePagination: false,
    muiTableContainerProps: { className: 'min-h-96 overflow-auto' },
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
