import React, { useEffect, useMemo, useState } from 'react';
import {
  CreateTxFeeEstimationResponseType,
  UtxoRequestParamWithAmount,
} from '../api/types';
import { MRT_RowSelectionState } from 'material-react-table';
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
  NumberInput,
  InputLabel,
  Collapse,
} from '@mantine/core';
import { ScriptTypes } from '../types/scriptTypes';
import Big from 'big.js';
const sectionColor = 'rgb(1, 67, 97)';

const sectionHeaderStyles = {
  fontSize: '1.5rem',
  color: sectionColor,
  fontWeight: '600',
};

const sectionLabelStyles = {
  fontSize: '1.125rem',
  color: sectionColor,
  fontWeight: '600',
};

import { IconInfoCircle } from '@tabler/icons-react';
import { BtcMetric, btcSatHandler } from '../types/btcSatHandler';
import { UtxoTable } from './utxoTable';

type UtxosDisplayProps = {
  utxos: Utxo[];
  feeRate: number;
  walletType: ScriptTypes;
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
  isCreateBatchTx: boolean;
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
  isCreateBatchTx,
}: UtxosDisplayProps) => {
  const [receivingOutputCount, setReceivingOutputCount] = useState(2);

  const onReceivingOutputChange = (value: number) => {
    setReceivingOutputCount(value);
    // reset the current batched tx data
    // since a new output count will change the batch fee estimate
    // and thefore the current fee estimate will be invalid.
    setCurrentBatchedTxData(null);
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

  const [selectedUtxos, setSelectedUtxos] = useState<
    UtxoRequestParamWithAmount[]
  >([]);

  const onRowSelection = (utxosSelected: UtxoRequestParamWithAmount[]) => {
    setSelectedUtxos(utxosSelected);
  };

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
  } = useCreateTxFeeEstimate(
    selectedUtxos,
    feeRate,
    receivingOutputCount,
    onCreateBatchTxError,
  );

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
    const borderClasses = 'p-2';
    if (
      !currentBatchedTxData ||
      !selectedUtxos?.length ||
      batchIsLoading ||
      isBatchTxRequestError
    ) {
      return (
        <div className={borderClasses}>
          <p style={sectionLabelStyles}>Total fees: ...</p>
          <p style={sectionLabelStyles}>Fee cost: ...</p>
        </div>
      );
    }
    const utxoInputTotal = selectedUtxos.reduce(
      (total, utxo) => total + utxo.amount,
      0,
    );

    const fee = !isBatchTxRequestError ? Number(batchedTxData?.fee) : undefined;
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
        <p style={sectionLabelStyles}>
          Total fees: ~{btcSatHandler(fee.toLocaleString(), btcMetric)}
          {btcMetric === BtcMetric.BTC ? ' BTC' : ' sats'}
        </p>
        <p style={sectionLabelStyles}>
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
        <p className="text-white font-bold">Not Spendable</p>
      </div>
    );
  };

  return (
    <div className="px-20">
      <div className="relative flex flex-row ">
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
        <UtxoTable
          utxos={utxos}
          isCreateBatchTx={isCreateBatchTx}
          walletType={walletType}
          signaturesNeeded={signaturesNeeded}
          numberOfXpubs={numberOfXpubs}
          receivingOutputCount={receivingOutputCount}
          feeRate={feeRate}
          getFeeRateColor={getFeeRateColor}
          btcPrice={btcPrice}
          btcMetric={btcMetric}
          onRowSelection={onRowSelection}
        />

        <div style={{ minWidth: '275px' }} className="ml-6 flex flex-col">
          <InputLabel
            style={sectionHeaderStyles}
            className="font-semibold mt-0 mr-1"
          >
            Outputs
          </InputLabel>
          <div className={`flex flex-row items-center`}>
            <InputLabel
              style={sectionLabelStyles}
              className="font-semibold mt-0 mr-1"
            >
              Count
            </InputLabel>

            <Tooltip
              withArrow
              w={300}
              multiline
              label="A bitcoin transaction typically has 2 outputs, one to the payee's address and one back to the payer's change address. If you are estimating sending to multiple payees, you can increase this number. If you are estimating a consolidation transaction you can set the count to 1.
                "
            >
              <IconInfoCircle
                style={{
                  width: '14px',
                  height: '14px',
                  color: sectionColor,
                }}
              />
            </Tooltip>
          </div>
          <NumberInput
            data-testid="output-count"
            className={`mb-4 w-40 mt-2`}
            style={sectionLabelStyles}
            allowNegative={false}
            clampBehavior="strict"
            value={receivingOutputCount}
            onChange={onReceivingOutputChange}
            thousandSeparator=","
            min={1}
            max={5000}
          />

          <div className="mt-auto">
            <Collapse
              in={isCreateBatchTx}
              transitionDuration={300}
              transitionTimingFunction="linear"
            >
              <InputLabel
                style={sectionHeaderStyles}
                className="font-semibold mt-0 mr-1"
              >
                Fees
              </InputLabel>

              <DisplayBatchTxData />
            </Collapse>
          </div>
        </div>
      </div>

      <Collapse
        in={isCreateBatchTx}
        transitionDuration={300}
        transitionTimingFunction="linear"
      >
        <div className="flex flex-row mt-4 mb-4 h-14">
          <Button
            loading={batchIsLoading}
            fullWidth
            disabled={selectedUtxos?.length < 2}
            onClick={calculateFeeEstimate}
            size="xl"
            style={{ height: '100%' }}
          >
            Estimate Batch
          </Button>
        </div>
      </Collapse>
    </div>
  );
};
