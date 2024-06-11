import { useEffect, useState } from 'react';
import { CurrentFeeRates } from '../components/currentFeeRates';
import { UtxosDisplay } from '../components/utxosDisplay';
import { useGetBalance, useGetUtxos } from '../hooks/utxos';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Group,
  Button,
  Slider,
  InputLabel,
  Select,
  SegmentedControl,
  ActionIcon,
} from '@mantine/core';
import { useDeleteCurrentWallet, useGetWalletType } from '../hooks/wallet';
import { useQueryClient } from 'react-query';
import { BtcMetric, btcSatHandler } from '../types/btcSatHandler';
import { SettingsSlideout } from '../components/SettingsSlideout';
import { IconAdjustments } from '@tabler/icons-react';
import { FeeRateColorChangeInputs } from '../components/FeeRateColorChangeInputs';
import { CreateTxFeeEstimationResponseType } from '../api/types';
import { Wallet, WalletConfigs } from '../types/wallet';

export type ScaleOption = {
  value: string;
  label: string;
};

export type FeeRateColor = [number, string];

function Home() {
  const getBalanceQueryRequest = useGetBalance();
  const navigate = useNavigate();
  const getUtxosQueryRequest = useGetUtxos();
  const getWalletTypeQueryRequest = useGetWalletType();
  const deleteCurrentWalletMutation = useDeleteCurrentWallet();

  const [currentBatchedTxData, setCurrentBatchedTxData] = useState<
    CreateTxFeeEstimationResponseType | undefined | null
  >(null);
  const [btcMetric, setBtcMetric] = useState(BtcMetric.BTC);

  const queryClient = useQueryClient();

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('current-route', '/home');
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
    navigate('/');
  };

  const scaleOptions: ScaleOption[] = [
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
    { value: '1000000', label: '1,000,000' },
  ];

  const minScaleOptions: ScaleOption[] = [
    { value: '1', label: '1' },
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
  ];
  const [feeScale, setFeeScale] = useState(scaleOptions[0]);
  const [minFeeScale, setMinFeeScale] = useState(minScaleOptions[0]);
  const [feeRate, setFeeRate] = useState(parseInt(minFeeScale.value));

  const [feeRateColorMapValues, setFeeRateColorMapValues] = useState<
    FeeRateColor[]
  >([
    [0, 'rgb(220, 252, 231)'],
    [2, 'rgb(254, 240, 138)'],
    [10, 'rgb(248, 113, 113)'],
    [
      45,
      'rgb(239, 68, 68)', // 'bg-red-500',
    ],
    [
      65,
      'rgb(220, 38, 38)', // 'bg-red-600',
    ],
    [
      85,
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
      });
    }
  }, [btcMetric, feeRateColorMapValues, feeScale, minFeeScale, feeRate]);

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
    setHasInitialWalletConfigDataBeenLoaded(true);
  };

  useEffect(() => {
    // @ts-ignore
    window.electron.ipcRenderer.on('wallet-data', handleWalletData);
    window.electron.ipcRenderer.sendMessage('get-wallet-data');
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
    setCurrentBatchedTxData(null);
  };

  const [isShowSettingsSlideout, setIsShowSettingsSlideout] = useState(false);
  return (
    <div className="h-full">
      <SettingsSlideout
        opened={isShowSettingsSlideout}
        onClose={() => setIsShowSettingsSlideout(false)}
      >
        <div className="flex w-full justify-start mt-4 flex-col">
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
            />
          </div>

          <Button
            style={{
              position: 'fixed',
              marginBottom: '1rem',
              bottom: '0',
              width: '93%',
            }}
            className="bg-blue-200 "
            onClick={logOut}
          >
            Log out
          </Button>
        </div>
      </SettingsSlideout>

      <header className="border-2 border-gray-200 border-l-0 border-r-0 mb-4 h-16">
        <Container size="xl" className="flex justify-between items-center h-16">
          <CurrentFeeRates />
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
            >
              <IconAdjustments
                style={{ width: '70%', height: '70%' }}
                stroke={1.5}
              />
            </ActionIcon>
          </Group>
        </Container>
      </header>

      <div className="ml-4 flex flex-col items-center">
        <h1 className="text-center font-bold text-xl">
          Custom Fee Environment
        </h1>
        <div className="mb-8">
          <div className="flex flex-row items-center">
            <div className="w-80 ml-8 mr-8 relative top-4">
              <Slider
                defaultValue={parseInt(minFeeScale.value)}
                min={parseInt(minFeeScale.value)}
                max={parseInt(feeScale.value)}
                step={10}
                value={feeRate}
                onChange={handleFeeRateChange}
              />

              <InputLabel className="text-center">
                Fee rate: {feeRate.toLocaleString()} sat/vB
              </InputLabel>
            </div>
          </div>
        </div>

        <UtxosDisplay
          feeRateColorValues={feeRateColorMapValues}
          btcMetric={btcMetric}
          feeRate={feeRate}
          utxos={getUtxosQueryRequest?.data?.utxos || []}
          walletType={getWalletTypeQueryRequest.data || 'P2WPKH'}
          isLoading={
            getUtxosQueryRequest.isLoading ||
            getWalletTypeQueryRequest.isLoading
          }
          isError={
            getUtxosQueryRequest.isError || getWalletTypeQueryRequest.isError
          }
          currentBatchedTxData={currentBatchedTxData}
          setCurrentBatchedTxData={setCurrentBatchedTxData}
        />
      </div>
    </div>
  );
}

export default Home;
