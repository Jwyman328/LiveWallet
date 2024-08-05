import { Button, Modal, ScrollArea, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react';

let coldCardLogo: any;
let trezorLogo: any;
let ledgerLogo: any;

if (process.env.NODE_ENV === 'test') {
  coldCardLogo = require('');
  trezorLogo = require('');
  ledgerLogo = require('');
} else {
  coldCardLogo = require('../images/coldcard-split-2.png');
  trezorLogo = require('../images/trezor-2.png');
  ledgerLogo = require('../images/ledger.png');
}

type HardwareWAlletOptionsModalProps = {
  onBack: () => void;
  onClose: () => void;
  height: string;
};
export const SupportedHardwareWallets = ({
  onBack,
  height = '400px',
  onClose,
}: HardwareWAlletOptionsModalProps) => {
  const supportedWallets = [
    { name: 'Coldcard', icon: coldCardLogo, isConfirmed: true },
    { name: 'Trezor', icon: trezorLogo, isConfirmed: true },
    {
      name: 'Ledger',
      icon: ledgerLogo,
      isConfirmed: false,
      iconClassName: 'ml-3',
    },
  ];
  const supportedWalletsDisplay = supportedWallets.map((wallet) => {
    return (
      <SupportedWallet
        iconClassName={wallet.iconClassName}
        isConfirmed={wallet.isConfirmed}
        name={wallet.name}
        icon={wallet.icon}
      />
    );
  });
  const getHeader = () => {
    return (
      <div className="w-full flex flex-row justify-center items-center">
        <Button
          leftSection={<IconArrowLeft />}
          variant="transparent"
          onClick={onBack}
          data-testid="back-button"
        ></Button>
        <p className="ml-16 font-bold text-lg">Supported devices</p>
      </div>
    );
  };
  return (
    <Modal
      styles={{
        header: { minHeight: '0px !important' },
        title: { fontWeight: '700' },
      }}
      opened={true}
      onClose={onClose}
      centered
      size="md"
      title={getHeader()}
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <div style={{ height: height, overflow: 'scroll' }}>
        {supportedWalletsDisplay}
      </div>
    </Modal>
  );
};

type SupportedWalletProps = {
  name: string;
  icon?: any;
  iconClassName?: string;
  isConfirmed?: boolean;
};
const SupportedWallet = ({
  name,
  icon,
  iconClassName,
  isConfirmed,
}: SupportedWalletProps) => {
  const isConfirmedStyles = !isConfirmed ? 'bg-gray-300' : 'bg-gray-50';
  return (
    <div
      className={`border-gray-100 border-2 ${isConfirmedStyles} rounded h-16 flex flex-row items-center p-2 mt-2`}
    >
      <div className={`flex-1`}>
        <img src={icon} className={`w-26 h-12 flex-1 ${iconClassName}`} />
      </div>

      <div className="flex-1  flex flex-row items-center">
        <p className="font-semibold text-lg">{name}</p>
        {!isConfirmed ? (
          <Tooltip
            multiline
            w={250}
            withArrow
            label="This device implements the supported interface but its support has not been confirmed via manual testing."
          >
            <IconInfoCircle
              style={{ marginLeft: '4px', width: '14px', height: '14px' }}
            />
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
};
