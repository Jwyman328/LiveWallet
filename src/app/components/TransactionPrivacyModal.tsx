import { Accordion, Checkbox, Modal } from '@mantine/core';
import { Transaction } from '../api/types';
import { BtcMetric } from '../types/btcSatHandler';
import { useState } from 'react';
import { useGetPrivacyMetrics } from '../hooks/privacyMetrics';
type TransactionDetailsModalProps = {
  opened: boolean;
  onClose: () => void;
  transactionDetails: Transaction;
  btcMetric: BtcMetric;
};
export const TransactionPrivacyModal = ({
  opened,
  onClose,
  transactionDetails,
  btcMetric,
}: TransactionDetailsModalProps) => {
  const getPRivacyMetricsResponse = useGetPrivacyMetrics();
  // TODO get from backend
  const privacyMetricsOne = [
    {
      value: 'Apples',
      description:
        'Crisp and refreshing fruit. Apples are known for their versatility and nutritional benefits. They come in a variety of flavors and are great for snacking, baking, or adding to salads.',
    },
    {
      value: 'Bananas',
      description:
        'Naturally sweet and potassium-rich fruit. Bananas are a popular choice for their energy-boosting properties and can be enjoyed as a quick snack, added to smoothies, or used in baking.',
    },
    {
      value: 'Broccoli',
      description:
        'Nutrient-packed green vegetable. Broccoli is packed with vitamins, minerals, and fiber. It has a distinct flavor and can be enjoyed steamed, roasted, or added to stir-fries.',
    },
  ];
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const privacyMetrics = getPRivacyMetricsResponse?.data?.metrics || [];
  const items = privacyMetrics.map((item) => (
    <Accordion.Item key={item.name} value={item.name}>
      <div className="flex flex-row">
        <div className="flex justify-center items-center">
          <Checkbox
            checked={selectedMetrics.includes(item.name)}
            onChange={(event) => {
              const newMetrics = [...selectedMetrics];

              if (event.currentTarget.checked) {
                newMetrics.push(item.name);

                setSelectedMetrics(newMetrics);
              } else {
                // remove the item from the array
                const index = newMetrics.indexOf(item.name);
                if (index > -1) {
                  newMetrics.splice(index, 1);
                  setSelectedMetrics(newMetrics);
                }
              }
            }}
          />
        </div>
        <div className="w-full">
          <Accordion.Control>{item.display_name}</Accordion.Control>
          <Accordion.Panel>{item.description}</Accordion.Panel>
        </div>
      </div>
    </Accordion.Item>
  ));
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      title={'Analyze Privacy'}
    >
      <div>
        <p>Transaction ID: {transactionDetails.txid}</p>
        <Accordion defaultValue="Apples">{items}</Accordion>
      </div>
    </Modal>
  );
};
