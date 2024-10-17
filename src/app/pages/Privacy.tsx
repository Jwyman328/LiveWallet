import { Tabs, rem } from '@mantine/core';
import { IconCoins, IconArrowsDownUp, IconEye } from '@tabler/icons-react';
export const Privacy = () => {
  const iconStyle = { width: rem(22), height: rem(22) };
  enum PrivacyTabs {
    UTXOS_STXOS = 'utxos_stxos',
    TRANSACTIONS = 'transactions',
    PREVIEW = 'preview',
  }
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
          My utxos and stxos
        </Tabs.Panel>

        <Tabs.Panel value={PrivacyTabs.TRANSACTIONS}>
          My transactions
        </Tabs.Panel>

        <Tabs.Panel value={PrivacyTabs.PREVIEW}>My preview area</Tabs.Panel>
      </Tabs>
    </div>
  );
};
