import { useState } from 'react';
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
  Tabs,
  SegmentedControl,
  ActionIcon,
  NumberInput,
  ColorInput,
} from '@mantine/core';
import { useDeleteCurrentWallet, useGetWalletType } from '../hooks/wallet';
import { useQueryClient } from 'react-query';
import { BtcMetric, btcSatHandler } from '../types/btcSatHandler';
import { SettingsSlideout } from '../components/SettingsSlideout';
import { IconAdjustments } from '@tabler/icons-react';

function Home() {
  const getBalanceQueryRequest = useGetBalance();
  const navigate = useNavigate();
  const getUtxosQueryRequest = useGetUtxos();
  const getWalletTypeQueryRequest = useGetWalletType();
  const deleteCurrentWalletMutation = useDeleteCurrentWallet();

  const [btcMetric, setBtcMetric] = useState(BtcMetric.SATS);

  const queryClient = useQueryClient();

  const logOut = async () => {
    try {
      await deleteCurrentWalletMutation.mutateAsync();
      queryClient.clear();
    } catch (e) {
      // error handled via toast
    }

    navigate('/');
  };

  const scaleOptions = [
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
    { value: '1000000', label: '1,000,000' },
  ];

  const minScaleOptions = [
    { value: '1', label: '1' },
    { value: '10', label: '10' },
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
  ];
  const [feeScale, setFeeScale] = useState(scaleOptions[0]);
  const [minFeeScale, setMinFeeScale] = useState(minScaleOptions[0]);
  const [feeRate, setFeeRate] = useState(parseInt(minFeeScale.value));

  const [feeRateColorMapValues, setFeeRateColorMapValues] = useState<
    [number, string][]
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
          Custom Fee environment{' '}
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
                onChange={setFeeRate}
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
        />
      </div>
    </div>
  );
}

export default Home;
type FeeRateColorChangeInputsProps = {
  numberOfInputs: number;
  feeRateColorMapValues: [number, string][];
  changeFeeRateColorPercent: (index: number, percent: number) => void;
  changeFeeRateColor: (index: number, color: string) => void;
};
const FeeRateColorChangeInputs = ({
  numberOfInputs,
  feeRateColorMapValues,
  changeFeeRateColorPercent,
  changeFeeRateColor,
}: FeeRateColorChangeInputsProps) => {
  const components = [];
  for (let i = 0; i < numberOfInputs; i++) {
    const margin = i === 0 ? 'mt-4' : '';
    components.push(
      <div className={`flex flex-row items-end justify-between ${margin}`}>
        <NumberInput
          label={i === 0 ? 'Fee %' : undefined}
          placeholder="Percents"
          suffix="%"
          value={feeRateColorMapValues[i][0]}
          mt="md"
          onChange={(value) => changeFeeRateColorPercent(i, Number(value))}
        />
        <ColorInput
          withEyeDropper={false}
          format="rgb"
          value={feeRateColorMapValues[i][1]}
          className="ml-4"
          width={100}
          label={i === 0 ? 'Color' : undefined}
          onChange={(value) => changeFeeRateColor(i, value)}
        />
      </div>,
    );
  }
  return <> {components} </>;
};
