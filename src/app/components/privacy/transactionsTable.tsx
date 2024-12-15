import React, { useMemo, useState, useEffect } from 'react';

import { createTheme, ThemeProvider } from '@mui/material';
import {
  MaterialReactTable,
  MRT_RowSelectionState,
  useMaterialReactTable,
} from 'material-react-table';

import {
  CopyButton,
  rem,
  Tooltip,
  ActionIcon,
  Button,
  LoadingOverlay,
} from '@mantine/core';
import { TbListDetails } from 'react-icons/tb';

import { IconCheck, IconCopy } from '@tabler/icons-react';
import { BtcMetric, btcSatHandler } from '../../types/btcSatHandler';
import { Transaction } from '../../api/types';
import { TransactionDetailsModal } from '../TransactionDetailsModal';
import { useGetTransactions } from '../../hooks/transactions';

const sectionColor = 'rgb(1, 67, 97)';

type TransactionsTableProps = {
  btcMetric: BtcMetric;
};

export const TransactionsTable = ({ btcMetric }: TransactionsTableProps) => {
  const transactionsResponse = useGetTransactions();
  const transactions = transactionsResponse.data?.transactions || [];
  const [isTransactionModalShowing, setIsTransactionModalShowing] =
    useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const [isPrivacyModalShowing, setIsPrivacyModalShowing] = useState(false);

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const columns = useMemo(() => {
    const defaultColumns = [
      {
        header: 'View details',
        size: 50,
        accessorKey: 'details',
        enableSorting: false,
        Cell: ({ row }: { row: any }) => {
          const transactionDetails = row.original as Transaction;
          return (
            <div className="ml-6">
              <ActionIcon
                color={'black'}
                variant="subtle"
                size={42}
                onClick={() => {
                  setSelectedTransaction(transactionDetails);
                  setIsTransactionModalShowing(true);
                }}
              >
                <TbListDetails size={32} />
              </ActionIcon>
            </div>
          );
        },
      },
      {
        header: 'Date',
        size: 100,
        accessorKey: 'date',
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.date); // Convert to timestamp
          const dateB = new Date(rowB.original.date); // Convert to timestamp
          //@ts-ignore
          return dateA - dateB; // Compare the timestamps
        },
        Cell: ({ row }: { row: any }) => {
          const date = row.original.date
            ? new Date(row.original.date)
            : 'unknown';
          const displayDate =
            date === 'unknown'
              ? date
              : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`.replace(
                  /:\d{2} /,
                  ' ',
                );
          return <div className="flex">{displayDate}</div>;
        },
      },
      {
        header: 'Txid',
        accessorKey: 'txid',
        size: 100,
        enableSorting: false,
        Cell: ({ row }) => {
          const prefix = row.original.txid.substring(0, 4);
          const suffix = row.original.txid.substring(
            row.original?.txid?.length - 4,
          );
          const abrv = `${prefix}....${suffix}`;
          return (
            <div className="flex">
              <Tooltip label={row.original?.txid}>
                <p className="mr-2">{abrv}</p>
              </Tooltip>
              <CopyButton value={row.original?.txid} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? 'Copied' : 'Copy'}
                    withArrow
                    position="right"
                  >
                    <ActionIcon
                      color={copied ? 'teal' : 'gray'}
                      variant="subtle"
                      onClick={copy}
                    >
                      {copied ? (
                        <IconCheck style={{ width: rem(16) }} />
                      ) : (
                        <IconCopy style={{ width: rem(16) }} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </div>
          );
        },
      },
      {
        header: 'Total Amount',
        accessorKey: 'amount',
        size: 100,
        sortingFn: (rowA, rowB) => {
          const amountA = new Number(rowA.original.user_total_amount);
          const amountB = new Number(rowB.original.user_total_amount);
          //@ts-ignore
          return amountA - amountB; // Compare the amounts
        },
        Cell: ({ row }: { row: any }) => {
          const amount = btcSatHandler(
            Number(row.original.user_total_amount).toFixed(2).toLocaleString(),
            btcMetric,
          );

          const color =
            row.original.user_total_amount < 0
              ? 'text-red-500'
              : 'text-green-500';
          return (
            <div>
              <p className={`${color}`}>
                {btcMetric === BtcMetric.BTC
                  ? amount
                  : Number(amount).toLocaleString()}
              </p>
            </div>
          );
        },
      },
    ];

    return defaultColumns;
  }, [transactions, btcMetric]);

  const analyzePrivacy = () => {
    const selectedTxId = Object.keys(rowSelection)[0];
    const transactionDetails = transactions.find(
      //@ts-ignore
      (tx) => tx?.txid === selectedTxId,
    );

    setSelectedTransaction(transactionDetails);
    setIsPrivacyModalShowing(true);
  };

  const table = useMaterialReactTable({
    columns,
    data: transactions,
    enableRowSelection: true,
    enableBatchRowSelection: false,
    enableSelectAll: false,
    enableMultiRowSelection: false,
    displayColumnDefOptions: { 'mrt-row-select': { header: 'Privacy' } },
    state: { rowSelection },
    initialState: { sorting: [{ id: 'date', desc: true }] },
    getRowId: (originalRow) => {
      return originalRow.txid;
    },

    onRowSelectionChange: setRowSelection,

    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableFilters: false,
    enableColumnFilters: false,
    enableColumnActions: false,
    enableHiding: false,
    enablePagination: false,
    enableTableFooter: false,
    enableBottomToolbar: false,
    muiTableContainerProps: {
      className: 'overflow-auto transition-all duration-300 ease-in-out',
      style: { maxHeight: false ? '24rem' : '30rem' },
    },
    enableStickyHeader: true,
    enableTopToolbar: true,
    positionToolbarAlertBanner: 'none',
    positionToolbarDropZone: 'top',
    enableEditing: false,
    muiSelectCheckboxProps: {
      color: 'primary',
    },
    renderTopToolbarCustomActions: ({ table }) => {
      return (
        <div className="ml-2">
          <p
            style={{
              color: sectionColor,
            }}
            className="text-2xl font-semibold"
          >
            Transactions
          </p>
        </div>
      );
    },

    // @ts-ignore
    muiTableBodyRowProps: { classes: { root: { after: 'bg-green-100' } } },
  });

  return (
    <div>
      <ThemeProvider
        theme={createTheme({
          palette: {
            secondary: {
              main: '#339AF0',
              light: '#fff',
            },
          },
          components: {
            MuiTableRow: {
              styleOverrides: {
                root: {
                  '&.MuiTableRow-root td:after': {
                    backgroundColor: 'rgb(255,255,255, 0.0)', // make the opcity 0 so that the color doesn't even show, it clashes too much with the color of the cell anyways so it isn't really needed
                  },
                  '&.MuiTableRow-root:hover td:after': {
                    backgroundColor: 'rgb(225,225,225, 0.5)', // white with an opacity
                  },
                },
              },
            },
          },
        })}
      >
        <div className="relative">
          <LoadingOverlay
            visible={transactionsResponse.isLoading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          <MaterialReactTable table={table} />
        </div>
      </ThemeProvider>
      <Button
        className="mt-4"
        fullWidth
        disabled={Object.keys(rowSelection).length === 0}
        onClick={analyzePrivacy}
        size="xl"
      >
        Analyze privacy
      </Button>

      {isTransactionModalShowing && (
        <TransactionDetailsModal
          transactionDetails={selectedTransaction}
          btcMetric={btcMetric}
          opened={isTransactionModalShowing}
          onClose={() => setIsTransactionModalShowing(false)}
          showTxDetailsStart={true}
          showPrivacyStart={false}
        />
      )}

      {isPrivacyModalShowing && (
        <TransactionDetailsModal
          transactionDetails={selectedTransaction}
          btcMetric={btcMetric}
          opened={isPrivacyModalShowing}
          onClose={() => setIsPrivacyModalShowing(false)}
          showTxDetailsStart={false}
          showPrivacyStart={true}
        />
      )}
    </div>
  );
};
