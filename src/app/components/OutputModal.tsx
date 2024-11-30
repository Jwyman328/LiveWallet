import {
  Modal,
  Chip,
  Tooltip,
  TextInput,
  Textarea,
  Checkbox,
  Divider,
} from '@mantine/core';
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

  const displayAmount =
    btcMetric === BtcMetric.BTC ? amount : Number(amount).toLocaleString();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={<p className="text-xl font-bold">Output details</p>}
      fullScreen
    >
      <Divider className="mt-2" variant="solid" size={1} />
      <div className="h-full">
        <p className="text-lg font-bold mb-2 mt-4">Labels</p>
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
                  className="ml-2"
                >
                  {label.display_name}
                </Chip>
              </Tooltip>
            ))}
          </div>
        </Chip.Group>

        <Divider className="mt-4" variant="solid" size={1} />

        <div className="flex flex-row mt-4">
          <div>
            <p className="text-lg font-bold">Transaction details</p>
            <Textarea
              label={'Recieved txid'}
              value={output.txid}
              disabled={true}
              className="w-96"
            />

            <TextInput
              label={'V out'}
              value={output.output_n}
              disabled={true}
              className="w-28 mt-2"
            />

            <TextInput
              label={'Input total'}
              value={displayAmount}
              rightSection={'sats'}
              disabled={true}
              className="w-40 mt-2"
            />

            <TextInput
              label={'Annominity set'}
              value={output.annominity_set}
              disabled={true}
              className="w-28 mt-2"
            />
          </div>
          <div className="ml-8">
            <p className="text-lg font-bold">Address details</p>
            <Textarea
              label={'Address'}
              value={output.address}
              disabled={true}
              className="w-96"
            />

            <Textarea
              label={'Script'}
              value={output.script}
              disabled={true}
              className="w-96 mt-2"
            />

            <TextInput
              label={'Script type'}
              value={output.script_type}
              disabled={true}
              className="w-32 mt-2"
            />
          </div>
        </div>

        <Divider className="mt-4" variant="solid" size={1} />

        <div className="mt-4">
          <p className="text-lg font-bold">Spent details</p>
          <Checkbox
            checked={output.spent}
            label="Spent"
            disabled={true}
            className="mt-2"
          />
          {output.spent && (
            <>
              <Textarea
                label={'Spending txid'}
                value={output.spending_txid}
                disabled={true}
                className="w-96 mt-2"
              />

              <TextInput
                label={'Spending vout'}
                value={output.spending_index_n}
                disabled={true}
                className="w-28 mt-2"
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
