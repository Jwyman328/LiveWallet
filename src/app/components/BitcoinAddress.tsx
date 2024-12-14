import { CopyButton, rem, Tooltip, ActionIcon } from '@mantine/core';

import { IconCheck, IconCopy } from '@tabler/icons-react';
import { ReactNode } from 'react';
type BitcoinAddressProps = {
  address: string;
  splitCount?: number;
  tooltipLabel?: ReactNode;
  className?: string;
  fontColor?: string;
};
export const BitcoinAddress = ({
  address,
  splitCount = 4,
  tooltipLabel,
  className,
  fontColor,
}: BitcoinAddressProps) => {
  const prefix = address.substring(0, splitCount);
  const suffix = address.substring(address?.length - splitCount);
  const abrv = `${prefix}....${suffix}`;
  const tooltip = tooltipLabel || address;
  return (
    <div className={`flex justify-center items-center mt-2 ${className}`}>
      <Tooltip label={tooltip}>
        <p className={`mr-2 ${fontColor}`}>{abrv}</p>
      </Tooltip>
      <CopyButton value={address} timeout={2000}>
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
};
