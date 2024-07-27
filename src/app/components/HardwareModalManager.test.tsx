import { fireEvent, render } from '@testing-library/react';
import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import { HardwareModalManager } from './HardwareModalManager';

const mockNavigate = jest.fn();
const closeModalSpy = jest.fn();
let getConnectedHardwareWalletsSpy: jest.SpyInstance;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
const mockHWNoPinNoPassphraseNeeded = {
  id: 'mockId',
  path: 'mockPath',
  label: 'Mock-Label',
  type: 'Mock type',
  model: 'Mock model',
  needs_pin_sent: false,
  needs_passphrase_sent: false,
  fingerprint: 'mock finger print',
};

const mockHWPinNeeded = {
  id: 'mockId2',
  path: 'mockPath2',
  label: 'Mock-Label2',
  type: 'Mock type2',
  model: 'Mock model2',
  needs_pin_sent: true,
  needs_passphrase_sent: false,
  fingerprint: 'mock finger print2',
};

const mockHWPassphraseNeeded = {
  id: 'mockId2',
  path: 'mockPath3',
  label: 'Mock-Label3',
  type: 'Mock type3',
  model: 'Mock model3',
  needs_pin_sent: false,
  needs_passphrase_sent: true,
  fingerprint: 'mock finger print3',
};

describe('HardwareWalletModalManager', () => {
  beforeEach(() => {
    getConnectedHardwareWalletsSpy = jest.spyOn(
      ApiClient,
      'getConnectedHardwareWallets',
    );
    getConnectedHardwareWalletsSpy.mockImplementation(() => {
      return new Promise((resolve) => {
        // implement slight delay for testing the loading state
        setTimeout(() => {
          resolve({
            wallets: [
              mockHWNoPinNoPassphraseNeeded,
              mockHWPinNeeded,
              mockHWPassphraseNeeded,
            ],
          });
        }, 100);
      });
    });
  });

  afterEach(() => {
    mockElectron.ipcRenderer.sendMessage.mockClear();
    mockElectron.ipcRenderer.on.mockClear();
    getConnectedHardwareWalletsSpy.mockClear();
  });

  it('Test ConntectHardwareModal landing screen', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Connect a Hardware Wallet');
    const supportedDevicesButton = await screen.findByText('Supported devices');
    const scanButton = await screen.findByRole('button', { name: 'scan' });
    expect(title).toBeInTheDocument();
    expect(supportedDevicesButton).toBeInTheDocument();
    expect(scanButton).toBeInTheDocument();
  });

  it('Test ConntectHardwareModal -> Supported Devices', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const supportedDevicesButton = await screen.findByText('Supported devices');
    fireEvent.click(supportedDevicesButton);

    const coldcard = await screen.findByText('Coldcard');
    const trezor = await screen.findByText('Trezor');
    const ledger = await screen.findByText('Ledger');
    const ledgerWarningTooltip = ledger.nextSibling as HTMLElement;

    expect(coldcard).toBeInTheDocument();
    expect(trezor).toBeInTheDocument();
    expect(ledger).toBeInTheDocument();

    fireEvent.click(ledgerWarningTooltip);
    fireEvent.mouseEnter(ledgerWarningTooltip);

    const notManuallyTestedMessage = await screen.findByText(
      'This device implements the supported interface but its supported has not been confirmed via manual testing.',
    );
    expect(notManuallyTestedMessage).toBeInTheDocument();

    const backButton = await screen.findByTestId('back-button');
    fireEvent.click(backButton);

    // should now be back on the first modal
    const initialModalTitle = await screen.findByText(
      'Connect a Hardware Wallet',
    );
    expect(initialModalTitle).toBeInTheDocument();
  });

  it('Test ConntectHardwareModal scan button opens loading state and lands on display wallets modal, displaying all found hardware wallets.', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Connect a Hardware Wallet');
    const scanButton = await screen.findByRole('button', { name: 'scan' });
    expect(title).toBeInTheDocument();
    expect(scanButton).toBeInTheDocument();

    fireEvent.click(scanButton);

    const loadingMessage = await screen.findByText(
      'Check your hardware device',
    );
    expect(loadingMessage);
    expect(getConnectedHardwareWalletsSpy).toHaveBeenCalled();

    const walletDisplayTitle = await screen.findByText('Complete wallet setup');
    const walletDisplaySubTitle = await screen.findByText('Connected wallets');

    // unlocked wallet
    const walletUnlockedTitle = await screen.findByText('Mock model');
    const selectedAccountNumber = await screen.findByText('Account #0');
    const showDestinationButton = await screen.findByRole('button', {
      name: 'Show derivation',
    });

    // locked wallet
    const walletLockedAndNeedPassphraseTitle =
      await screen.findByText(/Mock model2/);
    const walletUnlockButton = await screen.findByRole('button', {
      name: 'Unlock',
    });

    // needs passphrase wallet
    const walletUnLockedAndNeedsPassphraseTitle =
      await screen.findByText('Mock model3');
    const passphraseRequiredText = await screen.findByText(
      'passphrase required',
    );
    const passphraseInput =
      await screen.findAllByPlaceholderText('Enter passphrase');

    // global hw Ui
    const networkLabel = await screen.findByText('Network');
    const defaultSelectedNetwork = await screen.findByText('REGTEST');

    const advanceButton = await screen.findByRole('button', {
      name: 'Advance',
    });

    expect(walletDisplayTitle).toBeInTheDocument();
    expect(walletDisplaySubTitle).toBeInTheDocument();

    // locked wallet
    expect(walletLockedAndNeedPassphraseTitle).toBeInTheDocument();
    expect(walletUnlockButton).toBeInTheDocument();
    // unlocked wallet
    expect(walletUnlockedTitle).toBeInTheDocument();
    expect(selectedAccountNumber).toBeInTheDocument();
    expect(showDestinationButton).toBeEnabled();
    // needs passphrase wallet
    expect(walletUnLockedAndNeedsPassphraseTitle).toBeInTheDocument();
    expect(passphraseInput.length).toBe(3);
    expect(passphraseRequiredText).toBeInTheDocument();
    expect(passphraseInput[0]).not.toBeVisible();
    expect(passphraseInput[1]).not.toBeVisible();
    expect(passphraseInput[2]).toBeVisible();
    // global hw ui
    expect(networkLabel).toBeInTheDocument();
    expect(defaultSelectedNetwork).toBeInTheDocument();
    expect(advanceButton).toBeDisabled();
  });
});
