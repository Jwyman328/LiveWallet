import React, { useState } from 'react';
import {
  TextInput,
  Modal,
  Textarea,
  Divider,
  Switch,
  Collapse,
  NumberInput,
} from '@mantine/core';
import { Transaction } from '../api/types';
import { BtcMetric } from '../types/btcSatHandler';
import { BitcoinAddress } from './BitcoinAddress';
import { TransactionPrivacyModal } from './TransactionPrivacyModal';
type TransactionDetailsModalProps = {
  opened: boolean;
  onClose: () => void;
  transactionDetails: Transaction;
  btcMetric: BtcMetric;
  showTxDetailsStart?: boolean;
  showPrivacyStart?: boolean;
};
export const TransactionDetailsModal = ({
  opened,
  onClose,
  transactionDetails,
  btcMetric,
  showTxDetailsStart = true,
  showPrivacyStart = true,
}: TransactionDetailsModalProps) => {
  const [showTxDetails, setShowTxDetails] = useState(showTxDetailsStart);
  const [showTxDiagram, setShowTxDiagram] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(showPrivacyStart);

  const date = transactionDetails.date
    ? new Date(transactionDetails.date).toLocaleString()
    : null;

  const isTotalAmountNeeded =
    transactionDetails.user_spent_amount !== 0 &&
    transactionDetails.user_received_amount !== 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      fullScreen
      title={
        <div>
          <p className="text-lg font-bold">
            Transaction ID:{' '}
            <span className="text-md font-medium">
              {transactionDetails.txid}
            </span>
          </p>
          {date && (
            <div>
              <span className="text-md font-semibold">Date: </span>
              <span className="text-md font-medium">{date}</span>
            </div>
          )}
        </div>
      }
    >
      <div className="px-0">
        <div className="flex flex-row items-center">
          <p className="text-lg font-bold">View details</p>
          <Switch
            className="ml-2"
            labelPosition="left"
            checked={showTxDetails}
            onChange={(event) => setShowTxDetails(event.currentTarget.checked)}
          />
        </div>
        <Collapse
          in={showTxDetails}
          transitionDuration={300}
          transitionTimingFunction="linear"
        >
          <div className="px-4">
            <Divider className="mt-4" variant="solid" size={1} />
            <div className="mt-2 flex flex-col">
              <p className="text-lg font-bold">Amounts</p>

              <div className="flex flex-row  mt-2">
                <NumberInput
                  label={'Wallet input'}
                  value={transactionDetails.user_spent_amount}
                  rightSection={<div className="mr-6">sats</div>}
                  disabled={true}
                  className="w-40 mr-8"
                  thousandSeparator=","
                />

                <NumberInput
                  label={'Wallet output'}
                  value={transactionDetails.user_received_amount}
                  rightSection={<div className="mr-6">sats</div>}
                  disabled={true}
                  className="w-40"
                  thousandSeparator=","
                />
                {isTotalAmountNeeded && (
                  <NumberInput
                    label={'Wallet total'}
                    value={transactionDetails.user_total_amount}
                    rightSection={<div className="mr-6">sats</div>}
                    disabled={true}
                    className={`w-40 ml-8`}
                    thousandSeparator=","
                  />
                )}
              </div>
              <div className="flex flex-row items-center mt-2">
                <NumberInput
                  label={'Tx Fee total'}
                  value={transactionDetails.fee}
                  rightSection={<div className="mr-6">sats</div>}
                  disabled={true}
                  className="w-40 mr-8"
                  thousandSeparator=","
                />

                <NumberInput
                  label={'Tx Output total'}
                  value={transactionDetails.output_total}
                  rightSection={<div className="mr-6">sats</div>}
                  disabled={true}
                  className="w-40"
                  thousandSeparator=","
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
                <div className="flex flex-row justify-between w-3/4 mt-8 ml-auto mr-auto">
                  <div
                    className={`flex flex-col border-t-2 border-gray-900 border-r-2 border-b-2 p-2 h-40 max-h-40 overflow-y-scroll w-60 items-center bg-blue-300 ${
                      transactionDetails.inputs.length > 4
                        ? 'justify-between'
                        : 'justify-center'
                    } `}
                  >
                    {transactionDetails.inputs.map((input) => {
                      // This is a huge hack done on the backend, if the input is the users or not is hidden inside the sort property
                      // this adding an actual field like is_mine would require a refactor.
                      const isMine = input.sort; // wicked big hack
                      const color = isMine ? 'text-red-500' : undefined;
                      return (
                        <BitcoinAddress
                          splitCount={6}
                          address={input.address}
                          className={`mt-1 ${color}`}
                          fontColor={color}
                          tooltipLabel={
                            <div className={color}>
                              <p>Amount: {input.value} sats</p>
                              <p>Output tx id: {input.prev_txid}</p>
                              <p>Output tx v out: {input.output_n}</p>
                              <p>Address: {input.address}</p>
                            </div>
                          }
                        />
                      );
                    })}
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

                  <div
                    className={`flex flex-col border-t-2 border-gray-900 border-l-2 border-b-2 p-2 h-40  overflow-y-scroll w-60 items-center mt-40 bg-green-300 ${
                      transactionDetails.outputs.length > 4
                        ? 'justify-between'
                        : 'justify-center'
                    } `}
                  >
                    {transactionDetails.outputs.map((output) => {
                      // This is a huge hack done on the backend, if the output is the users or not is hidden inside the spending_txid property
                      // this adding an actual field like is_mine would require a refactor.
                      const isMine = output.spending_txid === 'mine';
                      const color = isMine ? 'text-yellow-600' : undefined;
                      return (
                        <BitcoinAddress
                          splitCount={6}
                          address={output.address}
                          className={`mt-1 ${color}`}
                          fontColor={color}
                          tooltipLabel={
                            <div className={color}>
                              <p>Amount: {output.value} sats</p>
                              <p>Address: {output.address}</p>
                              <p>Script type: {output.script_type}</p>
                              <p>V out: {output.output_n}</p>
                            </div>
                          }
                        />
                      );
                    })}
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
          </div>
        </Collapse>

        <Divider className="my-8" variant="solid" size={1} />
        <div className="flex flex-row items-center">
          <p className="text-lg font-bold mr-1.5">Analyze privacy</p>
          <Switch
            className="ml-2"
            labelPosition="left"
            checked={showPrivacy}
            onChange={(event) => setShowPrivacy(event.currentTarget.checked)}
          />
        </div>

        <Collapse
          in={showPrivacy}
          transitionDuration={300}
          transitionTimingFunction="linear"
        >
          <TransactionPrivacyModal
            btcMetric={btcMetric}
            transactionDetails={transactionDetails}
          />
        </Collapse>
      </div>
    </Modal>
  );
};
