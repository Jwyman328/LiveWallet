import { useEffect, useState } from 'react';
import { CurrentFeeRates } from '../components/currentFeeRates';
import { UtxosDisplay } from '../components/utxosDisplay';
import { useGetBalance, useGetCurrentFees, useGetUtxos } from '../hooks/utxos';

import { notifications } from '@mantine/notifications';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Group,
  Button,
  Slider,
  InputLabel,
  Select,
  SegmentedControl,
  ActionIcon,
  NumberInput,
  Collapse,
} from '@mantine/core';
import { useDeleteCurrentWallet, useGetWalletType } from '../hooks/wallet';
import { useQueryClient } from 'react-query';
import { BtcMetric, btcSatHandler } from '../types/btcSatHandler';
import { SettingsSlideout } from '../components/SettingsSlideout';
import { IconAdjustments } from '@tabler/icons-react';
import { FeeRateColorChangeInputs } from '../components/FeeRateColorChangeInputs';
import {
  CreateTxFeeEstimationResponseType,
  GetBTCPriceResponseType,
  GetOutputLabelsPopulateResponseType,
} from '../api/types';
import { Wallet, WalletConfigs } from '../types/wallet';
import { useGetBtcPrice } from '../hooks/price';
import { Pages } from '../../renderer/pages';
import { ScriptTypes } from '../types/scriptTypes';
import { Privacy } from './Privacy';
import { usePopulateOutputLabels } from '../hooks/transactions';

export type ScaleOption = {
  value: string;
  label: string;
};

export type FeeRateColor = [number, string];
export enum TxMode {
  SINGLE = 'SINGLE',
  BATCH = 'BATCH',
  CONSOLIDATE = 'CONSOLIDATE',
}
export enum DisplayType {
  PRIVACY = 'PRIVACY',
  EFFICENCY = 'EFFICIENCY',
}
function Home() {
  const getBalanceQueryRequest = useGetBalance();
  const navigate = useNavigate();
  const getUtxosQueryRequest = useGetUtxos();
  const getWalletTypeQueryRequest = useGetWalletType();
  const deleteCurrentWalletMutation = useDeleteCurrentWallet();

  const getCurrentFeesQueryRequest = useGetCurrentFees();

  const [currentBatchedTxData, setCurrentBatchedTxData] = useState<
    CreateTxFeeEstimationResponseType | undefined | null
  >(null);
  const [btcMetric, setBtcMetric] = useState(BtcMetric.BTC);
  const [btcPrice, setBtcPrice] = useState(0);

  const [txMode, setTxMode] = useState(TxMode.SINGLE);
  const isCreateBatchTx = txMode === TxMode.BATCH;

  const [displayType, setDisplayType] = useState(DisplayType.EFFICENCY);

  const location = useLocation();
  const { numberOfXpubs, signaturesNeeded } = location.state as {
    numberOfXpubs: number;
    signaturesNeeded: number;
  };

  const handleGetBtcPrice = (data: GetBTCPriceResponseType) => {
    const usdPrice = data.USD;
    setBtcPrice(usdPrice);
  };

  const getBtcPriceResponse = useGetBtcPrice({
    onSuccess: handleGetBtcPrice,
    onError: () => {
      notifications.show({
        title: 'Fetching current btc price failed',
        message: 'Please set the price manually.',
        color: 'red',
      });
    },
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('current-route', Pages.HOME);
  }, []);

  const logOut = async () => {
    try {
      await deleteCurrentWalletMutation.mutateAsync();
      queryClient.clear();
    } catch (e) {
      // error handled via toast
    }

    window.electron.ipcRenderer.sendMessage('save-wallet-configs', undefined);

    window.electron.ipcRenderer.sendMessage('save-wallet', undefined);
    navigate(Pages.CHOOSE_PATH);
  };

  const scaleOptions: ScaleOption[] = [
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
    { value: '1000000', label: '1,000,000' },
  ];

  const minScaleOptions: ScaleOption[] = [
    { value: '0', label: '0' },
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
  ];
  const [feeScale, setFeeScale] = useState(scaleOptions[1]);
  const [minFeeScale, setMinFeeScale] = useState(minScaleOptions[0]);
  const [feeRate, setFeeRate] = useState(parseInt(minFeeScale.value));
  // use the labels to populate the backend.
  const [importedOutputLabels, setImportedOutputLabels] = useState<
    undefined | null | GetOutputLabelsPopulateResponseType
  >(null);

  // Initially set the current future fee rate to the current medium fee rate
  // if it was not set by an imported wallet.
  // Also always set the consolidation fee rate to the current medium fee rate.
  useEffect(() => {
    if (
      getCurrentFeesQueryRequest.isSuccess &&
      feeRate.toString() === minFeeScale.value
    ) {
      setFeeRate(parseInt(`${getCurrentFeesQueryRequest.data?.medium}`));
    }

    if (getCurrentFeesQueryRequest.isSuccess) {
      setConsolidationFeeRate(
        parseInt(`${getCurrentFeesQueryRequest.data?.medium}`),
      );
    }
  }, [getCurrentFeesQueryRequest.isSuccess]);

  const [feeRateColorMapValues, setFeeRateColorMapValues] = useState<
    FeeRateColor[]
  >([
    [0, 'rgb(220, 252, 231)'],
    [5, 'rgb(254, 240, 138)'],
    [
      25,
      'rgb(239, 68, 68)', // 'bg-red-500',
    ],
    [
      50,
      'rgb(220, 38, 38)', // 'bg-red-600',
    ],
    [
      75,
      'rgb(185, 28, 28)', // 'bg-red-700',
    ],
    [
      100,
      'rgb(153, 27, 27)', // 'bg-red-800',
    ],
  ]);

  const saveWalletConfigs = (walletConfigs: WalletConfigs) => {
    window.electron.ipcRenderer.sendMessage(
      'save-wallet-configs',
      walletConfigs,
    );
  };
  const [
    hasInitialWalletConfigDataBeenLoaded,
    setHasInitialWalletConfigDataBeenLoaded,
  ] = useState(false);

  useEffect(() => {
    if (hasInitialWalletConfigDataBeenLoaded) {
      saveWalletConfigs({
        btcMetric,
        feeRateColorMapValues,
        feeScale,
        minFeeScale,
        feeRate,
        isCreateBatchTx,
      });
    }
  }, [
    btcMetric,
    feeRateColorMapValues,
    feeScale,
    minFeeScale,
    feeRate,
    isCreateBatchTx,
  ]);

  const populateBackendWithLabels = usePopulateOutputLabels();

  const handleWalletData = (walletData?: Wallet) => {
    console.log('walletData loaded', walletData);
    const isConfigDataLoaded =
      !!walletData?.feeRate &&
      !!walletData?.btcMetric &&
      !!walletData?.feeRateColorMapValues &&
      !!walletData?.feeScale &&
      !!walletData?.minFeeScale;

    if (isConfigDataLoaded) {
      // @ts-ignore
      setFeeRate(walletData.feeRate!);
      setFeeScale(walletData.feeScale!);
      setMinFeeScale(walletData.minFeeScale!);
      setBtcMetric(walletData.btcMetric!);
      setFeeRateColorMapValues(walletData.feeRateColorMapValues!);
    }

    const isLabelDataLoaded = !!walletData?.labels;

    if (isLabelDataLoaded) {
      setImportedOutputLabels(walletData.labels);
    }
    setHasInitialWalletConfigDataBeenLoaded(true);
  };

  useEffect(() => {
    if (
      populateBackendWithLabels.isLoading ||
      populateBackendWithLabels.isSuccess
    ) {
      console.log(
        'The backend has already been populated with labels, therefore do not make the request again.',
      );
    } else if (importedOutputLabels && !populateBackendWithLabels.isSuccess) {
      populateBackendWithLabels.mutate(importedOutputLabels);
    } else {
      console.log(
        'there are no output labels to populate the db with, therefore do not make the request.',
      );
    }
  }, [importedOutputLabels]);

  useEffect(() => {
    // @ts-ignore
    window.electron.ipcRenderer.on('wallet-data', handleWalletData);
    window.electron.ipcRenderer.sendMessage('get-wallet-data');
  }, []);

  useEffect(() => {
    // @ts-ignore
    window.electron.ipcRenderer.on('logout', logOut);
  }, []);

  const changeFeeRateColorPercent = (index: number, percent: number) => {
    const feeRateColorItem = feeRateColorMapValues[index];
    const newFeeRateColorItem = [percent, feeRateColorItem[1]] as [
      number,
      string,
    ];
    const newFeeRateColorMapValues = [...feeRateColorMapValues];
    newFeeRateColorMapValues[index] = newFeeRateColorItem;

    setFeeRateColorMapValues(newFeeRateColorMapValues);
  };

  const changeFeeRateColor = (index: number, color: string) => {
    const feeRateColorItem = feeRateColorMapValues[index];
    const newFeeRateColorItem = [feeRateColorItem[0], color] as [
      number,
      string,
    ];
    const newFeeRateColorMapValues = [...feeRateColorMapValues];
    newFeeRateColorMapValues[index] = newFeeRateColorItem;

    setFeeRateColorMapValues(newFeeRateColorMapValues);
  };
  const scaleColor = (r: number, g: number, b: number, scale: number) => {
    // Scale factor to increase the color intensity
    let newR = Math.min(255, Math.max(0, r + scale));
    let newG = Math.min(255, Math.max(0, g + scale));
    let newB = Math.min(255, Math.max(0, b + scale));

    return { r: newR, g: newG, b: newB };
  };

  const extractRGBValues = (rgb: string) => {
    // Regular expression to match 'rgb(r, g, b)'
    const regex = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
    const match = rgb.match(regex);

    if (match) {
      // Extract values from the matched groups
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      return { r, g, b };
    } else {
      throw new Error('Invalid RGB string format');
    }
  };

  const removeFeeRateColor = (index: number) => {
    const newFeeRateColorMapValues = [...feeRateColorMapValues];
    newFeeRateColorMapValues.splice(index, 1);
    setFeeRateColorMapValues(newFeeRateColorMapValues);
  };
  const addFeeRateColor = () => {
    const lastFeeRateColor =
      feeRateColorMapValues[feeRateColorMapValues.length - 1];
    const newFeeRateColorFeeRate = lastFeeRateColor[0] + 5;
    const lastFeeRateColorColor = lastFeeRateColor[1];
    const lastFeeRateColorRGB = extractRGBValues(lastFeeRateColorColor);
    const newFeeRateColorRGB = scaleColor(
      lastFeeRateColorRGB['r'],
      lastFeeRateColorRGB['g'],
      lastFeeRateColorRGB['b'],
      -10, // make color darker
    );
    const newFeeRateColorColor = `rgb(${newFeeRateColorRGB['r']}, ${newFeeRateColorRGB['g']}, ${newFeeRateColorRGB['b']})`;
    const newFeeRateColorMapValue: FeeRateColor = [
      newFeeRateColorFeeRate,
      newFeeRateColorColor,
    ];

    const newFeeRateColorMapValues = [
      ...feeRateColorMapValues,
      newFeeRateColorMapValue,
    ];

    setFeeRateColorMapValues(newFeeRateColorMapValues);
  };

  const setMinFeeRate = (option: { value: string; label: string }) => {
    if (feeRate < Number(option.value)) {
      setFeeRate(Number(option.value));
    }
    if (Number(option.value) <= Number(feeScale.value)) {
      setMinFeeScale(option);
    } else {
      const minScaleOption = minScaleOptions.find(
        (scaleOption) => scaleOption.value === feeScale.value,
      );
      if (minScaleOption) {
        setMinFeeScale(minScaleOption);
      }
    }
  };

  const handleFeeRateChange = (value: number) => {
    setFeeRate(value);
    if (txMode === TxMode.BATCH) {
      setCurrentBatchedTxData(null);
    }
  };

  // switching txMode should clear batchTxData
  useEffect(() => {
    setCurrentBatchedTxData(null);
  }, [txMode]);

  const saveWallet = () => {
    window.electron.ipcRenderer.sendMessage('save-wallet-data-from-dialog');
  };

  const diffBetweenMaxAndMinFeeRate =
    parseInt(feeScale.value) + parseInt(minFeeScale.value);
  const twentyFivePercent = Math.ceil(diffBetweenMaxAndMinFeeRate * 0.25);
  const fiftyPercent = Math.ceil(diffBetweenMaxAndMinFeeRate * 0.5);
  const seventyFivePercent = Math.ceil(diffBetweenMaxAndMinFeeRate * 0.75);
  const feeRateMarks =
    minFeeScale.value !== feeScale.value
      ? [
          { value: parseInt(minFeeScale.value), label: minFeeScale.value },
          { value: twentyFivePercent, label: twentyFivePercent.toString() },
          { value: fiftyPercent, label: fiftyPercent.toString() },
          { value: seventyFivePercent, label: seventyFivePercent.toString() },
          { value: parseInt(feeScale.value), label: feeScale.value },
        ]
      : [];

  const [isShowSettingsSlideout, setIsShowSettingsSlideout] = useState(false);
  const [consolidationFeeRate, setConsolidationFeeRate] = useState(1);

  const onConsolidationFeeRate = (consolidationFeeRate: string | number) => {
    setConsolidationFeeRate(Number(consolidationFeeRate));
    setCurrentBatchedTxData(null);
  };

  const onBtcPriceChange = (netBtcPrice: string | number) => {
    setBtcPrice(Number(netBtcPrice));
  };

  const maxToggleContainerWidth =
    txMode !== TxMode.CONSOLIDATE ? { maxWidth: '1000px' } : {};
  return (
    <div className="h-full overflow-y-scroll">
      <SettingsSlideout
        opened={isShowSettingsSlideout}
        onClose={() => setIsShowSettingsSlideout(false)}
      >
        <div className="flex w-full justify-start mt-4 flex-col ">
          <SegmentedControl
            className="mb-4"
            value={btcMetric.toString()}
            onChange={(value) => {
              const selectedValue =
                value === BtcMetric.BTC.toString()
                  ? BtcMetric.BTC
                  : BtcMetric.SATS;
              setBtcMetric(selectedValue);
            }}
            data={[BtcMetric.SATS.toString(), BtcMetric.BTC.toString()]}
          />

          <SegmentedControl
            className="mb-4"
            value={txMode}
            onChange={(value: TxMode) => {
              setTxMode(value);
            }}
            data={[TxMode.SINGLE, TxMode.BATCH, TxMode.CONSOLIDATE]}
          />
          <div className="h-full">
            <div className="flex flex-row justify-between mb-4">
              <Select
                className={'w-36'}
                data={minScaleOptions}
                value={minFeeScale.value}
                onChange={(_value, option) => setMinFeeRate(option)}
                label={<p>Min fee rate</p>}
              />

              <Select
                className={'w-36'}
                data={scaleOptions}
                value={feeScale.value}
                onChange={(_value, option) => setFeeScale(option)}
                label={<p>Max fee rate</p>}
              />
            </div>

            <FeeRateColorChangeInputs
              numberOfInputs={feeRateColorMapValues.length}
              feeRateColorMapValues={feeRateColorMapValues}
              changeFeeRateColorPercent={changeFeeRateColorPercent}
              changeFeeRateColor={changeFeeRateColor}
              removeFeeRateColor={removeFeeRateColor}
              addFeeRateColor={addFeeRateColor}
            />
          </div>

          <div
            style={{
              position: 'fixed',
              marginBottom: '1rem',
              bottom: '0',
              width: '93%',
            }}
            className="flex flex-col items-center"
          >
            <Button
              fullWidth
              onClick={saveWallet}
              className="mb-3"
              variant="light"
            >
              Save wallet
            </Button>
            <Button fullWidth className="bg-blue-200 " onClick={logOut}>
              Log out
            </Button>
          </div>
        </div>
      </SettingsSlideout>

      <header className="border-2 border-gray-200 border-l-0 border-r-0 mb-0 h-[8vh] ">
        <Container size="xl" className="flex justify-between items-center h-16">
          <CurrentFeeRates />
          <SegmentedControl
            style={{ width: '300px' }}
            value={displayType}
            onChange={(value) => {
              const selectedValue =
                value === DisplayType.EFFICENCY
                  ? DisplayType.EFFICENCY
                  : DisplayType.PRIVACY;
              setDisplayType(selectedValue);
            }}
            data={[DisplayType.EFFICENCY, DisplayType.PRIVACY]}
          />
          <Group gap={5} visibleFrom="xs">
            <p className="mr-5">
              Balance:{' '}
              {btcSatHandler(
                Number(getBalanceQueryRequest?.data?.total).toLocaleString(),
                btcMetric,
              )}{' '}
              {btcMetric === BtcMetric.BTC ? 'BTC' : 'sats'}
            </p>

            <ActionIcon
              onClick={() => setIsShowSettingsSlideout(true)}
              variant="filled"
              aria-label="Settings"
              data-testid="settings-button"
            >
              <IconAdjustments
                style={{ width: '70%', height: '70%' }}
                stroke={1.5}
              />
            </ActionIcon>
          </Group>
        </Container>
      </header>

      <div className="flex flex-row justify-evenly h-[92vh]"></div>
      {displayType === DisplayType.PRIVACY ? (
        <Privacy btcMetric={btcMetric} />
      ) : (
        <div className="mx-4 flex flex-col items-center overflow-x-scroll mt-4">
          <div
            className={`flex flex-row w-full justify-around`}
            style={maxToggleContainerWidth}
          >
            <Collapse
              in={txMode === TxMode.CONSOLIDATE}
              transitionDuration={300}
              transitionTimingFunction="linear"
            >
              <div className="flex flex-col items-center">
                <h1 className="text-center font-bold text-xl mt-4 mr-4 mb-2">
                  Consolidation Tx Fee Rate (sat/vB)
                </h1>
                <NumberInput
                  data-testid="consolidation-fee-rate-input"
                  className={`mb-4 w-40 mt-2`}
                  allowNegative={false}
                  clampBehavior="strict"
                  value={consolidationFeeRate}
                  onChange={onConsolidationFeeRate}
                  thousandSeparator=","
                  min={1}
                  max={10000000}
                />
              </div>
            </Collapse>
            <div>
              <h1 className="text-center font-bold text-xl mt-4">
                Future Fee Environment (sat/vB)
              </h1>
              <div className="mb-10">
                <div className="flex flex-row items-center ">
                  <div
                    style={{ width: '30rem' }}
                    className="ml-8 mr-8 relative top-4"
                  >
                    <Slider
                      data-testid="fee-rate-slider"
                      marks={feeRateMarks}
                      defaultValue={parseInt(minFeeScale.value)}
                      min={parseInt(minFeeScale.value)}
                      max={parseInt(feeScale.value)}
                      step={10}
                      value={feeRate}
                      onChange={handleFeeRateChange}
                      label={`${feeRate.toLocaleString()} sat/vB`}
                      thumbSize={26}
                      styles={{
                        track: { height: '16px' },
                        markLabel: { marginTop: '16px' },
                        mark: { height: '0px', display: 'none' },
                      }}
                    />

                    <InputLabel className="text-center mt-6">
                      Fee rate: {feeRate.toLocaleString()} sat/vB
                    </InputLabel>
                  </div>
                </div>
              </div>
            </div>

            <div className="ml-2">
              <h1 className="text-center font-bold text-xl mt-4">BTC Price</h1>
              <NumberInput
                data-testid="btc-price-input"
                className={`mb-4 w-40 mt-2`}
                prefix="$"
                allowNegative={false}
                value={btcPrice}
                onChange={onBtcPriceChange}
                thousandSeparator=","
                min={1}
              />
            </div>
          </div>

          <UtxosDisplay
            feeRateColorValues={feeRateColorMapValues}
            btcMetric={btcMetric}
            feeRate={feeRate}
            utxos={getUtxosQueryRequest?.data?.utxos || []}
            walletType={
              (getWalletTypeQueryRequest.data as ScriptTypes) ||
              ScriptTypes.P2WPKH
            }
            isLoading={
              getUtxosQueryRequest.isLoading ||
              getWalletTypeQueryRequest.isLoading ||
              getBtcPriceResponse.isLoading
            }
            isError={
              getUtxosQueryRequest.isError || getWalletTypeQueryRequest.isError
            }
            currentBatchedTxData={currentBatchedTxData}
            setCurrentBatchedTxData={setCurrentBatchedTxData}
            btcPrice={btcPrice}
            numberOfXpubs={numberOfXpubs || 1}
            signaturesNeeded={signaturesNeeded || 1}
            txMode={txMode}
            consolidationFeeRate={consolidationFeeRate}
          />
        </div>
      )}
    </div>
  );
}

export default Home;
