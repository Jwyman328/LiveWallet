import { Accordion, Button, Checkbox, Modal } from '@mantine/core';
import { PrivacyMetric, Transaction } from '../api/types';
import { BtcMetric } from '../types/btcSatHandler';
import { useState } from 'react';
import {
  useAnalyzeTxPrivacy,
  useGetPrivacyMetrics,
} from '../hooks/privacyMetrics';

import { IconX, IconLineDashed } from '@tabler/icons-react';
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
  const getPRivacyMetricsResponse = useGetPrivacyMetrics(
    transactionDetails.txid,
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  const privacyMetrics = getPRivacyMetricsResponse?.data?.metrics || [];
  const privacyMetricsNames = privacyMetrics.map((item) => item.name);
  const halfOfMetricsCount = Math.ceil(privacyMetrics.length / 2);
  const firstHalf = privacyMetrics.slice(0, halfOfMetricsCount);
  const secondHalf = privacyMetrics.slice(halfOfMetricsCount);
  const analyzeTxPrivacyMutation = useAnalyzeTxPrivacy();

  const PrivacyMetricComponent = ({
    privacyMetric,
  }: {
    privacyMetric: PrivacyMetric;
  }) => {
    const isMetricPassed = () => {
      if (
        analyzeTxPrivacyMutation.isSuccess &&
        analyzeTxPrivacyMutation.data?.results
      ) {
        const isMetricIncluded =
          analyzeTxPrivacyMutation.data?.results[privacyMetric.name];
        return isMetricIncluded;
      } else {
        return undefined;
      }
    };
    const checkboxColor = () => {
      if (!analyzeTxPrivacyMutation.isSuccess) {
        return undefined;
      } else {
        const isPassed = isMetricPassed();
        if (isPassed === undefined) {
          return undefined;
        } else if (isPassed) {
          return 'green';
        } else {
          return 'red';
        }
      }
    };
    const checkboxIcon = () => {
      if (!analyzeTxPrivacyMutation.isSuccess) {
        return IconLineDashed;
      } else {
        const isPassed = isMetricPassed();
        if (isPassed === undefined) {
          return IconLineDashed;
        } else if (isPassed) {
          return undefined; // Check mark by default
        } else {
          return IconX;
        }
      }
    };
    return (
      <Accordion.Item key={privacyMetric.name} value={privacyMetric.name}>
        <div className="flex flex-row">
          <div className="flex justify-center items-center">
            <Checkbox
              disabled={analyzeTxPrivacyMutation.isLoading}
              checked={selectedMetrics.includes(privacyMetric.name)}
              color={checkboxColor()}
              icon={checkboxIcon()}
              onChange={(event) => {
                const newMetrics = [...selectedMetrics];

                if (event.currentTarget.checked) {
                  newMetrics.push(privacyMetric.name);

                  setSelectedMetrics(newMetrics);
                } else {
                  // remove the item from the array
                  const index = newMetrics.indexOf(privacyMetric.name);
                  if (index > -1) {
                    newMetrics.splice(index, 1);
                    setSelectedMetrics(newMetrics);
                  }
                }
              }}
            />
          </div>
          <div className="w-full">
            <Accordion.Control>{privacyMetric.display_name}</Accordion.Control>
            <Accordion.Panel>{privacyMetric.description}</Accordion.Panel>
          </div>
        </div>
      </Accordion.Item>
    );
  };

  const firstHalfMetrics = firstHalf.map((item) => (
    <PrivacyMetricComponent key={item.name} privacyMetric={item} />
  ));

  const secondHalfMetrics = secondHalf.map((item) => (
    <PrivacyMetricComponent key={item.name} privacyMetric={item} />
  ));

  const analyzePrivacy = () => {
    analyzeTxPrivacyMutation.mutate({
      txid: transactionDetails.txid,
      privacy_metrics: selectedMetrics,
    });
  };

  const areAllSelected =
    selectedMetrics.length > 0 &&
    selectedMetrics.length === privacyMetricsNames.length;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      fullScreen
      title={'Analyze Privacy'}
    >
      <div>
        <p>Transaction ID: {transactionDetails.txid}</p>
        <div className="flex my-4">
          <Checkbox
            icon={IconLineDashed}
            checked={areAllSelected}
            onChange={() => {
              if (areAllSelected) {
                setSelectedMetrics([]);
              } else {
                setSelectedMetrics(privacyMetricsNames);
              }
            }}
            size="lg"
            label={<p className="font-bold text-lg text-center">All</p>}
          />
        </div>
        <div className="flex flex-row">
          <Accordion className="flex-1">{firstHalfMetrics}</Accordion>
          <Accordion className="flex-1 ml-8">{secondHalfMetrics}</Accordion>
        </div>
      </div>
      <Button
        loading={analyzeTxPrivacyMutation.isLoading}
        onClick={analyzePrivacy}
        className="mt-8"
        size="lg"
        fullWidth
        disabled={selectedMetrics.length === 0}
      >
        Analyze privacy
      </Button>
    </Modal>
  );
};
