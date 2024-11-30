import React, { useState } from 'react';
import {
  TextInput,
  Modal,
  Textarea,
  Divider,
  Switch,
  Collapse,
} from '@mantine/core';
import { Transaction } from '../api/types';
import { BtcMetric } from '../types/btcSatHandler';
import { BitcoinAddress } from './BitcoinAddress';
type TransactionDetailsModalProps = {
  opened: boolean;
  onClose: () => void;
  transactionDetails: Transaction;
  btcMetric: BtcMetric;
};
export const TransactionDetailsModal = ({
  opened,
  onClose,
  transactionDetails,
  btcMetric,
}: TransactionDetailsModalProps) => {
  const [showTxDiagram, setShowTxDiagram] = useState(true);
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      fullScreen
      title={
        <p className="text-lg font-bold">
          Transaction ID:{' '}
          <span className="text-md font-medium">{transactionDetails.txid}</span>
        </p>
      }
    >
      <div className="px-4">
        <Divider className="mt-4" variant="solid" size={1} />
        <div className="mt-2">
          <p className="text-lg font-bold">Amounts</p>

          <div className="flex flex-row items-center">
            <TextInput
              label={'Input total'}
              value={transactionDetails.input_total}
              rightSection={'sats'}
              disabled={true}
              className="w-40 mr-8"
            />

            <TextInput
              label={'Outputs total'}
              value={transactionDetails.output_total}
              rightSection={'sats'}
              disabled={true}
              className="w-40"
            />
          </div>
        </div>

        <Divider className="mt-4" variant="solid" size={1} />
        <div className="mt-4">
          <div className="flex flex-row items-center my-3">
            <p className="text-lg font-bold">Inputs & Outputs</p>
            <Switch
              className="ml-2"
              labelPosition="left"
              checked={showTxDiagram}
              onChange={(event) =>
                setShowTxDiagram(event.currentTarget.checked)
              }
            />
          </div>

          <Collapse
            in={showTxDiagram}
            transitionDuration={300}
            transitionTimingFunction="linear"
          >
            <div className="flex flex-row justify-between w-3/4 mt-8">
              <div className="flex flex-col border-t-2 border-gray-900 border-r-2 border-b-2 p-2 h-40 max-h-40 overflow-y-scroll w-60 items-center bg-blue-300 justify-center">
                {transactionDetails.inputs.map((input) => (
                  <BitcoinAddress splitCount={6} address={input.address} />
                ))}
              </div>

              <Divider className="flex-1 mt-20" variant="solid" size={2} />
              <div>
                <div className="h-40 w-40 border-black border-2 border-b-1 flex items-center justify-center bg-blue-300">
                  <p> Inputs</p>
                </div>

                <div className="h-40 w-40 border-black border-2 border-t-1 flex items-center justify-center bg-green-300">
                  Outputs
                </div>
              </div>

              <Divider className="flex-1 mt-60" variant="solid" size={2} />

              <div className="flex flex-col border-t-2 border-gray-900 border-l-2 border-b-2 p-2 h-40 max-h-40 overflow-y-scroll w-60 items-center mt-40 bg-green-300 justify-center">
                {transactionDetails.outputs.map((output) => (
                  <BitcoinAddress splitCount={6} address={output.address} />
                ))}
              </div>
            </div>
          </Collapse>
        </div>

        <Divider className="mt-4" variant="solid" size={1} />

        <div className="mt-4">
          <p className="text-lg font-bold">Size</p>
          <div className="flex flex-col justify-between w-1/4">
            <TextInput
              className="w-40"
              label={'Bytes'}
              value={transactionDetails.size}
              rightSection={'B'}
              disabled={true}
            />

            <TextInput
              className="w-40 mt-2"
              label={'VBytes'}
              value={transactionDetails.vsize}
              rightSection={'vB'}
              disabled={true}
            />
          </div>
        </div>

        <Divider className="mt-4" variant="solid" size={1} />

        <div className="mt-4 w-2/4">
          <p className="text-lg font-bold">Details</p>
          <Textarea
            label="Raw Transaction"
            value={transactionDetails.raw}
            autosize
            disabled={true}
          />
        </div>

        {/**
        // This data is being returned as null
        <div>
          <h1>Fee</h1>
          <p>Amount: {transactionDetails.fee} </p>
          <p>Rate: {transactionDetails.fee_per_kb} sats/vB </p>
        </div>
        */}
        {/**
        // This data is being returned as null
        <div>
          <p>Blockchain </p>
          <p>confirmmations: {transactionDetails.confirmations}</p>
          <p>blockheight: {transactionDetails.block_height}</p>

          <p>status: {transactionDetails.status}</p>
        </div>

        */}
      </div>
    </Modal>
  );
};
