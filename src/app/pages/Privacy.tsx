import { Tabs, rem } from '@mantine/core';
import { IconCoins, IconArrowsDownUp, IconEye } from '@tabler/icons-react';
import { useGetTransactions, useGetOutputs } from '../hooks/utxos';
import { TxosTable } from '../components/privacy/txosTable';
import { BtcMetric } from '../types/btcSatHandler';

type PrivacyProps = {
  btcMetric: BtcMetric;
};
export const Privacy = ({ btcMetric }: PrivacyProps) => {
  const iconStyle = { width: rem(22), height: rem(22) };
  enum PrivacyTabs {
    UTXOS_STXOS = 'utxos_stxos',
    TRANSACTIONS = 'transactions',
    PREVIEW = 'preview',
  }

  const transactionsResponse = useGetTransactions();
  console.log('transactionsResponse', transactionsResponse.data);
  const outputs = useGetOutputs();
  console.log('outputs', outputs.data);
  return (
    <div>
      <Tabs
        variant="default"
        orientation="vertical"
        defaultValue={PrivacyTabs.UTXOS_STXOS}
      >
        <Tabs.List>
          <Tabs.Tab
            className="h-40"
            value={PrivacyTabs.UTXOS_STXOS}
            leftSection={<IconCoins style={iconStyle} />}
          >
            <div>UTXOS</div> <div> STXOS</div>
          </Tabs.Tab>
          <Tabs.Tab
            className="h-40"
            value={PrivacyTabs.TRANSACTIONS}
            leftSection={<IconArrowsDownUp style={iconStyle} />}
          >
            Transactions
          </Tabs.Tab>
          <Tabs.Tab
            className="h-40"
            value={PrivacyTabs.PREVIEW}
            leftSection={<IconEye style={iconStyle} />}
          >
            Preview
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={PrivacyTabs.UTXOS_STXOS}>
          <div className="p-14">
            <TxosTable
              btcMetric={btcMetric}
              txos={outputs?.data?.outputs || []}
            />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value={PrivacyTabs.TRANSACTIONS}>
          My transactions
        </Tabs.Panel>

        <Tabs.Panel value={PrivacyTabs.PREVIEW}>My preview area</Tabs.Panel>
      </Tabs>
    </div>
  );
};
