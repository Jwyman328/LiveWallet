import { ReactNode, useState } from 'react';
import { ConnectHardwareModal } from './ConnectHardwareModal';
import { SupportedHardwareWallets } from './SupportedHardwareWallets';
import { MultiSigWalletData } from '../types/wallet';

type HardwareModalManagerProps = {
  isOpen: boolean;
  closeModal: () => void;
  onGetXpubFromHardwareWalletSuccess?: (
    keyDetails: MultiSigWalletData,
  ) => void;
};
export const HardwareModalManager = ({
  isOpen,
  closeModal,
  onGetXpubFromHardwareWalletSuccess,
}: HardwareModalManagerProps) => {
  const [currentModalIndex, setCurrentModalIndex] = useState(0);

  const modals = [
    <ConnectHardwareModal
      nextModal={() => setCurrentModalIndex(1)}
      isOpen={isOpen}
      closeModal={closeModal}
      onGetXpubFromHardwareWalletSuccess={onGetXpubFromHardwareWalletSuccess}
    />,
    <SupportedHardwareWallets
      height="400px"
      onClose={closeModal}
      onBack={() => setCurrentModalIndex(0)}
    />,
  ];

  const displayModal = () => {
    return modals[currentModalIndex] as ReactNode;
  };
  return displayModal();
};
