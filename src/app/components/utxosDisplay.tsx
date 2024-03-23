import React, { useEffect, useMemo, useState } from 'react';
import { UtxoRequestParam } from '../api/api';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { Utxo } from '../api/types';
import { useCreateTxFeeEstimate } from '../hooks/utxos';
import { Button, Tooltip, CopyButton, ActionIcon, rem } from '@mantine/core';

import {
  IconCopy,
  IconCheck,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
type UtxosDisplayProps = {
  utxos: Utxo[];
  feeRate: number;
};
export const UtxosDisplay = ({ utxos, feeRate }: UtxosDisplayProps) => {
  const getFeeRateColor = (amount: number) => {
    const feeRateColorMap = {
      0: 'rgb(220 252 231)', // 'bg-green-100',
      2: 'rgb(254 240 138)', // 'bg-yellow-200',
      // 10: 'rgb(252 165 165)', // 'bg-red-300',
      10: 'rgb(248 113 113)', // 'bg-red-400',
      45: 'rgb(239 68 68)', // 'bg-red-500',
      65: 'rgb(220 38 38)', // 'bg-red-600',
      85: 'rgb(185 28 28)', // 'bg-red-700',
      100: 'rgb(153 27 27)', // 'bg-red-800',
    };
    let selectedColor = feeRateColorMap[0];

    for (let key in feeRateColorMap) {
      if (amount > Number(key)) {
        selectedColor = feeRateColorMap[key];
      }
    }
    return selectedColor;
  };
  const estimateVBtyePerInput = 150;
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
          return (
            <div className="flex items-center justify-center">
              {isSpendable ? (
                <IconCircleCheck color="green" />
              ) : (
                <IconCircleX color="red" />
              )}
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
              <p> {Number(row.original.amount).toLocaleString()}</p>
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
    enableTableFooter: false,
    muiTableContainerProps: { className: 'min-h-96 overflow-auto' },

    muiTableBodyCellProps: ({ row }) => {
      const feeRatePct = row.original.amount
        ? calculateFeePercent(row.original.amount)
        : 0;
      const color = getFeeRateColor(Number(feeRatePct));

      return {
        className: row.original?.amount ? `${color} !important` : '',
        style: { backgroundColor: color },
      };
    },

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

  const {
    data: batchedTxData,
    mutateAsync,
    isLoading: batchIsLoading,
  } = useCreateTxFeeEstimate(selectedUtxos, feeRate);

  useEffect(() => {
    setCurrentBatchedTxData(batchedTxData);
  }, [batchedTxData]);

  useEffect(() => {
    console.log('selected utxos changed clear local batch data');
    setCurrentBatchedTxData(null);
  }, [selectedUtxos]);

  const [currentBatchedTxData, setCurrentBatchedTxData] = useState(null);

  const calculateFeeEstimate = async () => {
    const response = await mutateAsync();
  };

  const DisplayBatchTxData = () => {
    const borderClasses = 'rounded border-2 w-full ml-8 p-1.5';
    if (!currentBatchedTxData || !selectedUtxos.length || batchIsLoading) {
      return (
        <div className={borderClasses}>
          <p>Total fees: ...</p>
          <p>Fee rate %: ...</p>
        </div>
      );
    }

    const fee: string = batchedTxData?.fee;
    const percentOfTxFee = Number(
      batchedTxData?.percent_fee_is_of_utxo,
    ).toFixed(4);
    const isSpendable: boolean = batchedTxData?.spendable;
    const bgColor = getFeeRateColor(Number(percentOfTxFee));

    return isSpendable ? (
      <div className={borderClasses} style={{ backgroundColor: bgColor }}>
        <p>Total fees: {Number(fee).toLocaleString()} sats</p>
        <p>Fee rate %: {percentOfTxFee}%</p>
      </div>
    ) : (
      <div
        className={`flex items-center justify-center bg-red-600 ${borderClasses}`}
      >
        <p className="text-black font-bold">Tx not spendable</p>
      </div>
    );
  };

  return (
    <div>
      <MaterialReactTable table={table} />
      <div className="flex flex-row mt-4 mb-4">
        <Button
          fullWidth
          disabled={selectedUtxos.length === 0}
          onClick={calculateFeeEstimate}
          size="xl"
        >
          Estimate tx fees
        </Button>

        <DisplayBatchTxData />
      </div>
    </div>
  );
};
