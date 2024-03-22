import React, { useState } from 'react';
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
} from '@mantine/core';

function Home() {
  const getBalanceQueryRequest = useGetBalance();
  const navigate = useNavigate();
  const getUtxosQueryRequest = useGetUtxos();

  const logOut = () => {
    navigate('/');
  };

  const scaleOptions = [
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
    { value: '1000000', label: '1,000,000' },
    { value: '10000000', label: '10,000,000' },
    { value: '100000000', label: '100,000,000' },
  ];

  const minScaleOptions = [
    { value: '0', label: '0' },
    { value: '10', label: '10' },
    { value: '100', label: '100' },
    { value: '1000', label: '1,000' },
    { value: '10000', label: '10,000' },
    { value: '100000', label: '100,000' },
    { value: '1000000', label: '1,000,000' },
    { value: '10000000', label: '10,000,000' },
  ];
  const [feeScale, setFeeScale] = useState(scaleOptions[0]);
  const [minFeeScale, setMinFeeScale] = useState(minScaleOptions[0]);
  const [feeRate, setFeeRate] = useState(parseInt(minFeeScale.value));

  const setMinFeeRate = (option: { value: string; label: string }) => {
    if (feeRate < Number(option.value)) {
      setFeeRate(Number(option.value));
    }
    if (Number(option.value) <= Number(feeScale.value)) {
      setMinFeeScale(option);
    } else {
      const minScaleOption = minScaleOptions.find(
        (option) => option.value === feeScale.value,
      );
      setMinFeeScale(minScaleOption);
    }
  };
  return (
    <div className="h-full">
      <header className="border-2 border-gray-200 border-l-0 border-r-0 mb-4 h-14">
        <Container size="md" className="flex justify-between items-center h-14">
          <Group gap={5} visibleFrom="xs">
            <p>Balance: {getBalanceQueryRequest?.data?.total} sats</p>
          </Group>

          <Button className="bg-blue-200" onClick={logOut}>
            Log out
          </Button>
        </Container>
      </header>
      <div className="ml-4 flex flex-col items-center">
        <CurrentFeeRates />
        <div>
          <div className="flex flex-row items-center">
            <Select
              className={'w-36'}
              data={minScaleOptions}
              value={minFeeScale.value}
              onChange={(_value, option) => setMinFeeRate(option)}
              label={<p>Min fee rate</p>}
            />
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

            <Select
              className={'w-36'}
              data={scaleOptions}
              value={feeScale.value}
              onChange={(_value, option) => setFeeScale(option)}
              label={<p>Max fee rate</p>}
            />
          </div>
        </div>

        {getUtxosQueryRequest.isSuccess ? (
          <UtxosDisplay
            feeRate={feeRate}
            utxos={getUtxosQueryRequest?.data?.utxos}
          />
        ) : null}
      </div>
    </div>
  );
}

export default Home;
