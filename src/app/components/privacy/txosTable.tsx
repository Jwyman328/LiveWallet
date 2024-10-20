import React, { useMemo } from 'react';

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
  ChipGroup,
} from '@mantine/core';
import { MdLabelOutline } from 'react-icons/md';

import {
  IconCheck,
  IconCircleCheck,
  IconCircleX,
  IconCopy,
} from '@tabler/icons-react';
import { BtcMetric, btcSatHandler } from '../../types/btcSatHandler';

const sectionColor = 'rgb(1, 67, 97)';

type TxosTableProps = {
  txos: any;
  btcMetric: BtcMetric;
};

export const TxosTable = ({ txos, btcMetric }: TxosTableProps) => {
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
              <Tooltip label={row.original.txid}>
                <p className="mr-2">{abrv}</p>
              </Tooltip>
              <CopyButton value={row.original.txid} timeout={2000}>
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
        header: 'Labels',
        accessorKey: 'label',
        size: 250,
        Cell: () => {
          // mock labels for now
          const allLabels = ['do not spend', 'bad change', "another"];
          return (
            <div className="flex flex-row flex-wrap">
              {allLabels.map((label) => (
                <Chip
                  icon={<MdLabelOutline />}
                  color="red"
                  checked={true}
                  variant="light"
                  className="mr-1"
                  classNames={{
                    checkIcon: 'h-0 hidden',
                  }}
                >
                  {label}
                </Chip>
              ))}
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
  }, [txos, btcMetric]);

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
        <MaterialReactTable table={table} />
      </ThemeProvider>
    </div>
  );
};
