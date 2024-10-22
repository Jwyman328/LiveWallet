import { Modal, Chip, Tooltip } from '@mantine/core';
import { useState } from 'react';
import { BtcMetric, btcSatHandler } from '../types/btcSatHandler';
import { OutputLabelType, TransactionOutputType } from '../api/types';
import { useAddUtxoLabel, useRemoveUtxoLabel } from '../hooks/transactions';

type OutputModalProps = {
  output: TransactionOutputType;
  btcMetric: BtcMetric;
  opened: boolean;
  onClose: () => void;
  labels: OutputLabelType[];
};
export const OutputModal = ({
  output,
  btcMetric,
  opened,
  onClose,
  labels,
}: OutputModalProps) => {
  const [selectedChips, setSelectedChips] = useState(output.labels);
  const addUtxoLabel = useAddUtxoLabel();
  const removeUtxoLabel = useRemoveUtxoLabel();
  const amount = btcSatHandler(
    Number(output.value).toFixed(2).toLocaleString(),
    btcMetric,
  );

  const handleChipChange = (label: OutputLabelType, isChecked: boolean) => {
    if (isChecked) {
      addUtxoLabel.mutate({
        txid: output.txid,
        vout: output.output_n,
        labelName: label.display_name,
      });
    } else {
      removeUtxoLabel.mutate({
        txid: output.txid,
        vout: output.output_n,
        labelName: label.display_name,
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      title={`Output`}
    >
      <div className="h-full">
        <p>address: {output.address}</p>
        <p>
          amount:{' '}
          {btcMetric === BtcMetric.BTC
            ? amount
            : Number(amount).toLocaleString()}
        </p>
        <p>Annominity set: {output.annominity_set}</p>
        <p>v out: {output.output_n}</p>
        <p>hash: {output.public_hash}</p>
        <p>script: {output.script}</p>
        <p>script type: {output.script_type}</p>
        <p>Recieved txid: {output.txid}</p>
        <p>is spent?{output.spent ? 'Yes' : 'No'}</p>
        <p>spending index: {output.spending_index_n}</p>
        <p>spending txid: {output.spending_txid}</p>
        labels here
        <Chip.Group multiple value={selectedChips} onChange={setSelectedChips}>
          <div className="flex flex-row">
            {labels.map((label) => (
              <Tooltip
                multiline
                w={250}
                withArrow
                label={label.description}
                refProp="rootRef"
              >
                <Chip
                  onChange={(isChecked) => handleChipChange(label, isChecked)}
                  width={30}
                  value={label.display_name}
                >
                  {label.display_name}
                </Chip>
              </Tooltip>
            ))}
          </div>
        </Chip.Group>
      </div>
    </Modal>
  );
};
