import React, { useState } from 'react';
import { CurrentFeeRates } from '../components/currentFeeRates';
import { UtxosDisplay } from '../components/utxosDisplay';
import { useGetBalance, useGetUtxos } from '../hooks/utxos';
import { useNavigate } from 'react-router-dom';
import { TextInput, Container, Group, Button } from '@mantine/core';

function Home() {
  const getBalanceQueryRequest = useGetBalance();
  const navigate = useNavigate();
  const getUtxosQueryRequest = useGetUtxos();

  const logOut = () => {
    navigate('/');
  };

  const [feeRate, setFeeRate] = useState(1);
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
      <div className="ml-4">
        <CurrentFeeRates />
        <div className="w-36">
          <TextInput
            type="number"
            placeholder="1"
            label="Fee rate"
            value={feeRate}
            onChange={(e) => setFeeRate(parseInt(e.target.value))}
            rightSection={<p>sats/vB</p>}
            rightSectionWidth={80}
          />
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
