import React, { useMemo } from 'react';

import { createTheme, ThemeProvider } from '@mui/material';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

import { CopyButton, rem, Tooltip, ActionIcon } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

const sectionColor = 'rgb(1, 67, 97)';

type TxosTableProps = {};

export const TxosTable = ({}: TxosTableProps) => {
  const columns = useMemo(() => {
    const defaultColumns = [
      {
        header: 'Txid',
        size: 100,
        accessorKey: 'txid',
        Cell: ({ row }: { row: any }) => {
          const prefix = row.original.txid.substring(0, 4);
          const suffix = row.original.txid.substring(
            row.original.txid.length - 4,
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
          return (
            <div>
              <p>amount</p>
            </div>
          );
        },
      },
      {
        header: '$ Amount',
        accessorKey: 'amountUSD',
        size: 100,
        Cell: ({ row }: { row: any }) => {
          return (
            <div>
              <p>{'amountUSDDisplay'}</p>
            </div>
          );
        },
      },
      {
        header: '~ Fee %',
        accessorKey: 'selfCost',
        size: 100,
        Cell: ({ row }: { row: any }) => {
          return (
            <div>
              <p> {'hi'}</p>
            </div>
          );
        },
      },
      {
        header: '$ Fee',
        accessorKey: 'feeUSD',
        size: 100,
        Cell: () => {
          return (
            <div>
              <p>{'amountUSDDisplay'}</p>
            </div>
          );
        },
      },
    ];

    return defaultColumns;
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: [],
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
            {'mock title'}
            <span className="text-lg"> (utxos)</span>
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
