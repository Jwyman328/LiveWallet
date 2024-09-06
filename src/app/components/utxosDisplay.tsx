import React, { useEffect, useState } from 'react';
import {
  CreateTxFeeEstimationResponseType,
  UtxoRequestParamWithAmount,
} from '../api/types';
import { notifications } from '@mantine/notifications';
import { Utxo } from '../api/types';
import { useCreateTxFeeEstimate } from '../hooks/utxos';
import {
  Button,
  Tooltip,
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
import { TxMode } from '../pages/Home';

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
  txMode: TxMode;
  consolidationFeeRate: number;
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
  txMode,
  consolidationFeeRate,
}: UtxosDisplayProps) => {
  const startingReceivingOutputCount = txMode === TxMode.CONSOLIDATE ? 1 : 2;
  const [receivingOutputCount, setReceivingOutputCount] = useState(
    startingReceivingOutputCount,
  );
  const [consolidationUtxo, setConsolidationUtxo] = useState<Utxo[]>([]);
  const [isSavePSBTEnabled, setIsSavePSBTEnabled] = useState(false);

  const [selectedUtxos, setSelectedUtxos] = useState<
    UtxoRequestParamWithAmount[]
  >([]);

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
    txMode === TxMode.CONSOLIDATE ? consolidationFeeRate : feeRate,
    txMode === TxMode.CONSOLIDATE ? 1 : receivingOutputCount,
    onCreateBatchTxError,
  );

  useEffect(() => {
    setCurrentBatchedTxData(batchedTxData);
  }, [batchedTxData]);

  // switching selectedUtxos should clear current batchTxData
  useEffect(() => {
    setCurrentBatchedTxData(null);
  }, [selectedUtxos]);

  // switching to consolidation mode should clear the consolidation data.
  useEffect(() => {
    if (txMode === TxMode.CONSOLIDATE) {
      setIsSavePSBTEnabled(false);
      setConsolidationUtxo([]);
    }
  }, [consolidationFeeRate, selectedUtxos.length, txMode]);

  const savePsbt = () => {
    window.electron.ipcRenderer.sendMessage(
      'save-psbt',
      currentBatchedTxData?.psbt || '',
    );
  };

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

  const onRowSelection = (utxosSelected: UtxoRequestParamWithAmount[]) => {
    setSelectedUtxos(utxosSelected);
  };

  const calculateFeeEstimate = async () => {
    try {
      const response = await mutateAsync();
      if (txMode === TxMode.CONSOLIDATE) {
        setIsSavePSBTEnabled(true);

        const totalAmount =
          selectedUtxos.reduce((accumulator, currentObject) => {
            return accumulator + currentObject.amount;
          }, 0) - response?.fee;
        const batchedUtxos =
          selectedUtxos.length > 1 && response
            ? [{ amount: totalAmount, vout: 0, txid: 'mockTxId' }]
            : [];
        setConsolidationUtxo(batchedUtxos);
      }
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

  const containerClassNames = txMode === TxMode.CONSOLIDATE ? 'px-4' : 'px-20';

  return (
    <div className={containerClassNames}>
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
        <div className="flex flex-row">
          <UtxoTable
            utxos={utxos}
            areRowsSelectable={
              txMode === TxMode.BATCH || txMode === TxMode.CONSOLIDATE
            }
            onRowSelection={onRowSelection}
            walletType={walletType}
            signaturesNeeded={signaturesNeeded}
            numberOfXpubs={numberOfXpubs}
            receivingOutputCount={receivingOutputCount}
            feeRate={feeRate}
            getFeeRateColor={getFeeRateColor}
            btcPrice={btcPrice}
            btcMetric={btcMetric}
          />

          {txMode === TxMode.CONSOLIDATE && (
            <div className="ml-4 flex flex-col justify-between">
              <UtxoTable
                utxos={consolidationUtxo}
                areRowsSelectable={false}
                onRowSelection={() => {}}
                walletType={walletType}
                signaturesNeeded={signaturesNeeded}
                numberOfXpubs={numberOfXpubs}
                receivingOutputCount={1}
                feeRate={feeRate}
                getFeeRateColor={getFeeRateColor}
                btcPrice={btcPrice}
                btcMetric={btcMetric}
                title="Output"
                isShowTxId={false}
              />

              <div className="mt-auto">
                <InputLabel
                  style={sectionHeaderStyles}
                  className="font-semibold mt-0 mr-1"
                >
                  {txMode === TxMode.CONSOLIDATE ? 'Consolidation ' : ''}
                  Fees
                </InputLabel>

                <DisplayBatchTxData />
              </div>
            </div>
          )}
        </div>

        <div
          style={{ minWidth: txMode !== TxMode.CONSOLIDATE ? '275px' : '0px' }}
          className="ml-6 flex flex-col"
        >
          <Collapse
            in={txMode !== TxMode.CONSOLIDATE}
            transitionDuration={300}
            transitionTimingFunction="linear"
          >
            <>
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
            </>
          </Collapse>

          <div className="mt-auto">
            <Collapse
              in={txMode === TxMode.BATCH}
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
        in={txMode === TxMode.BATCH || txMode === TxMode.CONSOLIDATE}
        transitionDuration={300}
        transitionTimingFunction="linear"
      >
        <div className="flex flex-row mt-4 mb-4 h-14 mr-6">
          <Button
            loading={batchIsLoading}
            fullWidth
            disabled={
              selectedUtxos?.length < 2 ||
              (txMode === TxMode.CONSOLIDATE && isSavePSBTEnabled)
            }
            onClick={calculateFeeEstimate}
            size="xl"
            style={{ height: '100%' }}
          >
            {txMode === TxMode.CONSOLIDATE ? 'Consolidate' : 'Estimate Batch'}
          </Button>

          {txMode === TxMode.CONSOLIDATE && (
            <Button
              fullWidth
              disabled={!isSavePSBTEnabled}
              onClick={savePsbt}
              size="xl"
              style={{ height: '100%', marginLeft: '1rem' }}
            >
              Save PSBT
            </Button>
          )}
        </div>
      </Collapse>
    </div>
  );
};
