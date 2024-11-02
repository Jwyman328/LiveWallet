import { Modal } from '@mantine/core';
import { Transaction } from '../api/types';
import { BtcMetric } from '../types/btcSatHandler';
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
      </div>
    </Modal>
  );
};
