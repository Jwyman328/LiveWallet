import React, { useMemo, useState } from 'react';

import { createTheme, ThemeProvider } from '@mui/material';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

import {
  CopyButton,
  rem,
  Tooltip,
  ActionIcon,
  Chip,
  LoadingOverlay,
} from '@mantine/core';
import { MdLabelOutline } from 'react-icons/md';

import {
  IconCheck,
  IconCircleCheck,
  IconCircleX,
  IconCopy,
  IconEdit,
} from '@tabler/icons-react';
import { BtcMetric, btcSatHandler } from '../../types/btcSatHandler';
import { OutputModal } from '../OutputModal';
import {
  GetOutputLabelsPopulateResponseType,
  TransactionOutputType,
} from '../../api/types';
import {
  useGetOutputLabels,
  useGetOutputLabelsUnique,
  useGetOutputs,
} from '../../hooks/transactions';

const sectionColor = 'rgb(1, 67, 97)';

type TxosTableProps = {
  btcMetric: BtcMetric;
};

export const TxosTable = ({ btcMetric }: TxosTableProps) => {
  const getOutputLabelsQuery = useGetOutputLabels();
  const saveLabelsInWalletConfig = (
    data: GetOutputLabelsPopulateResponseType,
  ) => {
    window.electron.ipcRenderer.sendMessage('save-labels', data);
  };

  const outputs = useGetOutputs();
  const txos = outputs.data?.outputs || [];
  // get all the output labels in a format that is good for storing
  // in the global wallet.labels object via the "save-labels" event
  useGetOutputLabelsUnique(saveLabelsInWalletConfig);

  const [isOutputModalShowing, setIsOutputModalShowing] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<TransactionOutputType>();
  const columns = useMemo(() => {
    const defaultColumns = [
      {
        header: 'Address',
        size: 100,
        accessorKey: 'address',
        Cell: ({ row }: { row: any }) => {
          const prefix = row.original.address.substring(0, 4);
          const suffix = row.original.address.substring(
            row.original?.address?.length - 4,
          );
          const abrv = `${prefix}....${suffix}`;
          return (
            <div className="flex justify-center items-center">
              <Tooltip label={row.original?.address}>
                <p className="mr-2">{abrv}</p>
              </Tooltip>
              <CopyButton value={row.original.address} timeout={2000}>
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
        header: 'Amount',
        accessorKey: 'amount',
        size: 100,
        Cell: ({ row }: { row: any }) => {
          const amount = btcSatHandler(
            Number(row.original.value).toFixed(2).toLocaleString(),
            btcMetric,
          );
          return (
            <div>
              <p>
                {btcMetric === BtcMetric.BTC
                  ? amount
                  : Number(amount).toLocaleString()}
              </p>
            </div>
          );
        },
      },
      {
        header: 'Annominity',
        accessorKey: 'annominity_set',
        size: 30,
        Cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center">
              <p>{row.original.annominity_set}</p>
            </div>
          );
        },
      },
      {
        header: 'Labels',
        accessorKey: 'labels',
        size: 250,
        Cell: ({ row }) => {
          const allLabels = row.original.labels || [];
          return (
            <div className="flex flex-row flex-wrap">
              {allLabels.length > 0 ? (
                allLabels.map((label) => (
                  <Chip
                    icon={<MdLabelOutline />}
                    color="red"
                    checked={true}
                    variant="light"
                    className="mr-1"
                  >
                    {label}
                  </Chip>
                ))
              ) : (
                <p className="mt-auto">None</p>
              )}

              <ActionIcon
                onClick={() => {
                  setSelectedOutput(row.original);
                  setIsOutputModalShowing(true);
                }}
                variant="outline"
                aria-label="edit"
                data-testid="edit-label-button"
                color="gray"
                size="sm"
                className="mt-auto ml-1"
              >
                <IconEdit />
              </ActionIcon>
            </div>
          );
        },
      },
      {
        header: 'Unspent',
        accessorKey: 'spent',
        size: 100,
        Cell: ({ row }) => {
          const isSpent = row.original.spent === true;
          return (
            <div className="flex items-center justify-center">
              {isSpent ? (
                <IconCircleX data-testid="spend-icon" color="red" />
              ) : (
                <IconCircleCheck data-testid="unspent-icon" color="green" />
              )}
            </div>
          );
        },
      },
    ];

    return defaultColumns;
  }, [txos, btcMetric, isOutputModalShowing]);

  const table = useMaterialReactTable({
    columns,
    data: txos,
    enableRowSelection: false,
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
    renderTopToolbarCustomActions: ({ table }) => {
      return (
        <div className="ml-2">
          <p
            style={{
              color: sectionColor,
            }}
            className="text-2xl font-semibold"
          >
            Outputs
          </p>
        </div>
      );
    },
    muiSelectCheckboxProps: {
      color: 'primary',
    },
    initialState: {
      sorting: [
        {
          id: 'amount',
          desc: false,
        },
      ],
    },

    // @ts-ignore
    muiTableBodyRowProps: { classes: { root: { after: 'bg-green-100' } } },
    muiTableBodyCellProps: ({ row }) => {
      return {
        //style: { backgroundColor: color },
      };
    },

    getRowId: (originalRow) => {
      return originalRow.txid;
    },
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
            visible={outputs.isLoading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          <MaterialReactTable table={table} />
        </div>
      </ThemeProvider>
      {isOutputModalShowing && (
        <OutputModal
          output={selectedOutput}
          btcMetric={btcMetric}
          opened={isOutputModalShowing}
          onClose={() => setIsOutputModalShowing(false)}
          labels={getOutputLabelsQuery.data?.labels || []}
        />
      )}
    </div>
  );
};
