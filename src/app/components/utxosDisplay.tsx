import React, { useEffect, useMemo } from 'react';
import {
  CreateTxFeeEstimationResponseType,
  UtxoRequestParamWithAmount,
} from '../api/types';
import {
  MaterialReactTable,
  MRT_RowSelectionState,
  useMaterialReactTable,
} from 'material-react-table';
import { notifications } from '@mantine/notifications';
import { createTheme, ThemeProvider } from '@mui/material';
import { Utxo } from '../api/types';
import { useCreateTxFeeEstimate } from '../hooks/utxos';
import {
  Button,
  Tooltip,
  CopyButton,
  ActionIcon,
  rem,
  LoadingOverlay,
} from '@mantine/core';
import { WalletTypes } from '../types/scriptTypes';
import Big from 'big.js';

import {
  IconCopy,
  IconCheck,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
import { BtcMetric, btcSatHandler } from '../types/btcSatHandler';

type UtxosDisplayProps = {
  utxos: Utxo[];
  feeRate: number;
  walletType: WalletTypes;
  isLoading: boolean;
  isError: boolean;
  btcMetric: BtcMetric;
  feeRateColorValues: [number, string][];
  currentBatchedTxData: CreateTxFeeEstimationResponseType | undefined | null;
  setCurrentBatchedTxData: React.Dispatch<
    React.SetStateAction<CreateTxFeeEstimationResponseType | undefined | null>
  >;
  btcPrice: number;
  signaturesNeeded: number;
  numberOfXpubs: number;
};

export const UtxosDisplay = ({
  utxos,
  feeRate,
  walletType,
  isLoading,
  isError,
  btcMetric,
  feeRateColorValues,
  currentBatchedTxData,
  setCurrentBatchedTxData,
  btcPrice,
  signaturesNeeded,
  numberOfXpubs,
}: UtxosDisplayProps) => {
  const estimateVBtyePerInput = 125;
  const estimateVBtyeOverheadAndOutput = 75; // includes change estimate
  // for a batch tx that doesn't include the script sig.
  const additionalMultiSigVBtyePerScriptSig = walletType === 'P2SH' ? 73 : 10;
  const additionalMultiSigVBtyePerPubKey = walletType === 'P2SH' ? 45 : 1;
  const multisigOverHead = walletType === 'P2SH' ? 145 : 4;
  const estimateVBtyePerScriptSig: Record<WalletTypes, number> = {
    P2PKH: 107,
    P2SH: 250, //not really sure on this one. there is a large range, if it is a multisig script hash it could be like 250. I'll use 250 for now.
    P2WPKH: 27,
    // P2WSH2O3: 63,
    // P2TR: 16,
  };

  const batchedSigInputEstimateFeeTotal =
    estimateVBtyePerScriptSig[walletType] * feeRate;

  const avgInputCost = estimateVBtyePerInput * feeRate;
  const avgBaseCost = estimateVBtyeOverheadAndOutput * feeRate;
  const multiSigAdditionalSigCost =
    numberOfXpubs > 1
      ? additionalMultiSigVBtyePerScriptSig * signaturesNeeded * feeRate
      : 0;
  const multiSigAdditionalPubkeysCost =
    numberOfXpubs > 1
      ? additionalMultiSigVBtyePerPubKey * numberOfXpubs * feeRate
      : 0;
  const multisigOverHeadCost =
    numberOfXpubs > 1 ? multisigOverHead * feeRate : 0;

  const totalCost =
    avgBaseCost +
    avgInputCost +
    multiSigAdditionalSigCost +
    multiSigAdditionalPubkeysCost +
    multisigOverHeadCost;

  const calculateFeePercent = (amount: number) => {
    const percentOfAmount = (totalCost / amount) * 100;
    const formatted =
      percentOfAmount > 1
        ? percentOfAmount.toFixed(2)
        : percentOfAmount.toFixed(4);

    return formatted;
  };

  const getFeeRateColor = (amount: number) => {
    const feeRateColorMap: Record<number, string> = {};

    for (let i = 0; i < feeRateColorValues.length; i++) {
      if (feeRateColorValues[i] && feeRateColorValues[i].length >= 2) {
        feeRateColorMap[feeRateColorValues[i][0]] = feeRateColorValues[i][1];
      }
    }
    let selectedColor = feeRateColorMap[0];

    for (const key in feeRateColorMap) {
      if (amount > Number(key)) {
        selectedColor = feeRateColorMap[key];
      }
    }
    return selectedColor;
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
        header: 'Amount',
        accessorKey: 'amount',
        size: 140,
        Cell: ({ row }: { row: any }) => {
          const amount = btcSatHandler(
            Number(row.original.amount).toFixed(2).toLocaleString(),
            btcMetric,
          );
          return (
            <div>
              <p>
                {btcMetric === BtcMetric.BTC
                  ? amount
                  : Number(amount).toLocaleString()}
              </p>
            </div>
          );
        },
      },
      {
        header: '$ Amount',
        accessorKey: 'amountUSD',
        size: 140,
        Cell: ({ row }: { row: any }) => {
          let amountUSD: string | undefined;

          const btcAmount = btcSatHandler(
            Number(row.original.amount).toLocaleString(),
            BtcMetric.BTC,
          );

          try {
            amountUSD = Big(btcPrice).times(btcAmount).toFixed(0, Big.ROUND_UP);
          } catch (e) {
            console.log('Error calculating amountUSD', e);
          }
          const amountUSDDisplay = amountUSD
            ? `$${Number(amountUSD).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            : '...';
          return (
            <div>
              <p>{amountUSDDisplay}</p>
            </div>
          );
        },
      },
      {
        header: '~ Fee %',
        accessorKey: 'selfCost',
        size: 120,
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
        header: '$ Fee',
        accessorKey: 'feeUSD',
        size: 120,
        Cell: () => {
          let amountUSD: number | string | undefined;

          const btcAmount = btcSatHandler(
            Number(totalCost).toLocaleString(),
            BtcMetric.BTC,
          );

          try {
            amountUSD = Big(btcPrice).times(btcAmount).toFixed(0, Big.ROUND_UP);
          } catch (e) {
            console.log('error', e);
          }

          amountUSD = Number(amountUSD) < 1 ? 1 : Number(amountUSD);

          const amountUSDDisplay = amountUSD
            ? `$${amountUSD.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            : '...';
          return (
            <div>
              <p>{amountUSDDisplay}</p>
            </div>
          );
        },
      },
      {
        header: 'Spendable',
        accessorKey: 'Spendable',
        size: 40,
        Cell: ({ row }: { row: any }) => {
          const feePct = row.original.amount
            ? calculateFeePercent(row.original.amount)
            : null;

          const isSpendable = feePct === null ? '...' : Number(feePct) < 100;
          return (
            <div className="flex items-center justify-center">
              {isSpendable ? (
                <IconCircleCheck data-testid="spendable-icon" color="green" />
              ) : (
                <IconCircleX data-testid="not-spendable-icon" color="red" />
              )}
            </div>
          );
        },
      },
    ],
    [avgBaseCost, avgInputCost, btcMetric, btcPrice, totalCost],
  );

  const getSelectedUtxos = React.useCallback(
    (selectedTxRows: MRT_RowSelectionState) => {
      const selectedUtxosFromatted: UtxoRequestParamWithAmount[] = [];
      utxos.forEach((utxo) => {
        if (selectedTxRows[utxo.txid]) {
          selectedUtxosFromatted.push({
            id: utxo.txid,
            vout: utxo.vout,
            amount: utxo.amount,
          });
        }
      });
      return selectedUtxosFromatted;
    },
    [utxos],
  );

  const DisplaySelectedUtxosData = ({
    selectedRows,
  }: {
    selectedRows: MRT_RowSelectionState;
  }) => {
    const totalUtxosSelected = Object.keys(selectedRows).length;
    const utxosWithData = getSelectedUtxos(selectedRows);
    const totalAmount: number = utxosWithData.reduce(
      (total, utxo) => total + utxo.amount,
      0,
    );
    return (
      <div className="h-16">
        <p className="pl-4 font-semibold text-lg">
          Selected: {totalUtxosSelected}{' '}
        </p>
        <p className="pl-4 font-semibold text-lg">
          amount:
          {' ' + btcSatHandler(totalAmount.toLocaleString(), btcMetric)}
          {btcMetric === BtcMetric.BTC ? ' BTC' : ' sats'}
        </p>
      </div>
    );
  };

  const table = useMaterialReactTable({
    columns,
    data: utxos,
    enableRowSelection: true,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableFilters: false,
    enableColumnFilters: false,
    enableColumnActions: false,
    enableHiding: false,
    enablePagination: false,
    enableTableFooter: false,
    enableBottomToolbar: false,
    muiTableContainerProps: {
      className: 'overflow-auto',
      style: { maxHeight: '24rem' },
    },
    enableStickyHeader: true,
    positionToolbarAlertBanner: 'top',
    positionToolbarDropZone: 'bottom',
    renderTopToolbarCustomActions: () => (
      <h1 className="text-lg font-bold text-center ml-2 mt-2">UTXOS</h1>
    ),
    renderToolbarAlertBannerContent: ({ table }) => (
      <DisplaySelectedUtxosData selectedRows={table.getState().rowSelection} />
    ),
    muiSelectCheckboxProps: {
      color: 'primary',
    },
    initialState: {
      sorting: [
        {
          id: 'amount',
          desc: false,
        },
      ],
    },
    // @ts-ignore
    muiTableBodyRowProps: { classes: { root: { after: 'bg-green-100' } } },
    muiTableBodyCellProps: ({ row }) => {
      const feeRatePct = row.original.amount
        ? calculateFeePercent(row.original.amount)
        : 0;
      const color = getFeeRateColor(Number(feeRatePct));

      return {
        style: { backgroundColor: color },
      };
    },

    getRowId: (originalRow) => {
      return originalRow.txid;
    },
  });

  const selectedTxs = table.getState().rowSelection;

  const selectedUtxos: UtxoRequestParamWithAmount[] = useMemo(() => {
    return getSelectedUtxos(selectedTxs);
  }, [selectedTxs, getSelectedUtxos]);

  const onCreateBatchTxError = () => {
    notifications.show({
      title: 'Error creating batch tx fee estimate.',
      message: 'Please try again',
      color: 'red',
    });
  };

  const {
    data: batchedTxData,
    mutateAsync,
    isLoading: batchIsLoading,
    isError: isBatchTxRequestError,
  } = useCreateTxFeeEstimate(selectedUtxos, feeRate, onCreateBatchTxError);

  useEffect(() => {
    setCurrentBatchedTxData(batchedTxData);
  }, [batchedTxData]);

  useEffect(() => {
    setCurrentBatchedTxData(null);
  }, [selectedUtxos]);

  const calculateFeeEstimate = async () => {
    try {
      await mutateAsync();
    } catch (e) {
      console.log('Error calculating fee estimate', e);
    }
  };

  const DisplayBatchTxData = () => {
    const borderClasses = 'rounded border-2 w-full ml-8 p-1.5';
    if (
      !currentBatchedTxData ||
      !selectedUtxos?.length ||
      batchIsLoading ||
      isBatchTxRequestError
    ) {
      return (
        <div className={borderClasses}>
          <p>Total fees: ...</p>
          <p>Fee cost: ...</p>
        </div>
      );
    }
    const utxoInputTotal = selectedUtxos.reduce(
      (total, utxo) => total + utxo.amount,
      0,
    );

    const inputSigFees = batchedSigInputEstimateFeeTotal * selectedUtxos.length;

    const fee = !isBatchTxRequestError
      ? Number(batchedTxData?.fee) + inputSigFees
      : undefined;
    const percentOfTxFee = fee
      ? (Number(fee / utxoInputTotal) * 100).toFixed(4)
      : undefined;

    const feeInBtc = fee
      ? btcSatHandler(Number(fee).toLocaleString(), BtcMetric.BTC)
      : undefined;
    const feeUsdAmount = feeInBtc
      ? Big(btcPrice).times(feeInBtc).toFixed(0, Big.ROUND_UP)
      : undefined;

    const isSpendable = batchedTxData?.spendable;
    const bgColor = getFeeRateColor(Number(percentOfTxFee));

    return isSpendable ? (
      <div className={borderClasses} style={{ backgroundColor: bgColor }}>
        <p>
          Total fees: ~{btcSatHandler(fee.toLocaleString(), btcMetric)}
          {btcMetric === BtcMetric.BTC ? ' BTC' : ' sats'}
        </p>
        <p>
          Fee cost: $
          {Number(feeUsdAmount).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{' '}
          <span className="ml-3">({percentOfTxFee}%)</span>
        </p>
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
      <ThemeProvider
        theme={createTheme({
          palette: {
            secondary: { main: '#339AF0' },
          },
          components: {
            MuiTableRow: {
              styleOverrides: {
                root: {
                  '&.MuiTableRow-root td:after': {
                    backgroundColor: 'rgb(255,255,255, 0.0)', // make the opcity 0 so that the color doesn't even show, it clashes too much with the color of the cell anyways so it isn't really needed
                  },
                  '&.MuiTableRow-root:hover td:after': {
                    backgroundColor: 'rgb(225,225,225, 0.5)', // white with an opacity
                  },
                },
              },
            },
          },
        })}
      >
        <div className="relative">
          <LoadingOverlay
            visible={isLoading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />

          <LoadingOverlay
            visible={isError && !isLoading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 5 }}
            loaderProps={{
              children: (
                <p className="text-red-700 font-bold text-lg">
                  Error fetching utxos, please log out and try again.
                </p>
              ),
            }}
          />
          <MaterialReactTable table={table} />
        </div>
      </ThemeProvider>
      <div className="flex flex-row mt-4 mb-4 h-16">
        <Button
          fullWidth
          disabled={selectedUtxos.length < 2}
          onClick={calculateFeeEstimate}
          size="xl"
          style={{ height: '100%' }}
        >
          Estimate batch
        </Button>

        <DisplayBatchTxData />
      </div>
    </div>
  );
};
