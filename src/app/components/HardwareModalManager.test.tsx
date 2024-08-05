import { fireEvent, render, waitFor } from '@testing-library/react';
import { WrappedInAppWrappers } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import { HardwareModalManager } from './HardwareModalManager';
import {
  mockHWPinNeeded,
  mockHWPassphraseNeeded,
  mockHWNoPinNoPassphraseNeeded,
  mockTrezorPinAndPassNeeded,
} from '../../__tests__/mocks';
import { ScriptTypes } from '../types/scriptTypes';
import { policyTypeOptions } from './formOptions';

const mockNavigate = jest.fn();
const closeModalSpy = jest.fn();
let getConnectedHardwareWalletsSpy: jest.SpyInstance;
let getXpubFromDeviceSpy: jest.SpyInstance;
let setWalletPassphraseSpy: jest.SpyInstance;
let unlockWalletSpy: jest.SpyInstance;
let promptToUnlockWalletSpy: jest.SpyInstance;
let closeHardwareWalletsSpy: jest.SpyInstance;
const mockXpub = 'mockXpub';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HardwareWalletModalManager', () => {
  beforeEach(() => {
    getConnectedHardwareWalletsSpy = jest.spyOn(
      ApiClient,
      'getConnectedHardwareWallets',
    );

    getXpubFromDeviceSpy = jest.spyOn(ApiClient, 'getXpubFromDevice');
    getXpubFromDeviceSpy.mockResolvedValue({ xpub: mockXpub });

    setWalletPassphraseSpy = jest.spyOn(ApiClient, 'setWalletPassphrase');
    setWalletPassphraseSpy.mockResolvedValue({ was_passphrase_set: true });
    unlockWalletSpy = jest.spyOn(ApiClient, 'unlockWallet');
    unlockWalletSpy.mockResolvedValue({ was_unlock_successful: true });

    promptToUnlockWalletSpy = jest.spyOn(ApiClient, 'promptToUnlockWallet');
    promptToUnlockWalletSpy.mockResolvedValue({ was_prompt_successful: true });
    closeHardwareWalletsSpy = jest.spyOn(
      ApiClient,
      'closeAndRemoveHardwareWallets',
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
    getConnectedHardwareWalletsSpy.mockClear();
    getXpubFromDeviceSpy.mockClear();
    setWalletPassphraseSpy.mockClear();
    unlockWalletSpy.mockClear();
    promptToUnlockWalletSpy.mockClear();
    closeHardwareWalletsSpy.mockClear();
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
      'This device implements the supported interface but its support has not been confirmed via manual testing.',
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

  it('Test close modal makes api request to close all connected hardware wallets', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const closeButton = await screen.findAllByRole('button');
    fireEvent.click(closeButton[1]);

    await waitFor(() => {
      expect(closeModalSpy).toHaveBeenCalled();
      expect(closeHardwareWalletsSpy).toHaveBeenCalled();
    });
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
    const showDerivationButton = await screen.findByRole('button', {
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
    const sendPassphraseButton = await screen.findByRole('button', {
      name: 'Send',
    });

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
    expect(showDerivationButton).toBeEnabled();
    // needs passphrase wallet
    expect(walletUnLockedAndNeedsPassphraseTitle).toBeInTheDocument();
    expect(passphraseInput.length).toBe(3);
    expect(passphraseRequiredText).toBeInTheDocument();
    expect(passphraseInput[0]).not.toBeVisible();
    expect(passphraseInput[1]).not.toBeVisible();
    expect(passphraseInput[2]).toBeVisible();
    expect(sendPassphraseButton).toBeEnabled();
    // global hw ui
    expect(networkLabel).toBeInTheDocument();
    expect(defaultSelectedNetwork).toBeInTheDocument();
    expect(advanceButton).toBeDisabled();
  });

  it('Test advance with unlocked wallet', async () => {
    getConnectedHardwareWalletsSpy.mockResolvedValue({
      wallets: [mockHWNoPinNoPassphraseNeeded],
    });
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const scanButton = await screen.findByRole('button', { name: 'scan' });

    fireEvent.click(scanButton);

    // unlocked wallet
    const walletUnlockedTitle = await screen.findByText('Mock model');
    const selectedAccountNumber = await screen.findByText('Account #0');

    expect(walletUnlockedTitle).toBeInTheDocument();
    expect(selectedAccountNumber).toBeInTheDocument();
    const unlockedWalletCheckbox = await screen.findByTestId(
      `hardware-walletcheckbox-${mockHWNoPinNoPassphraseNeeded.id}`,
    );
    fireEvent.click(unlockedWalletCheckbox);

    // set derivation
    const showDerivationButton = await screen.findByRole('button', {
      name: 'Show derivation',
    });
    fireEvent.click(showDerivationButton);
    const derivationInput = await screen.findByTestId(
      `derivation-path-${mockHWNoPinNoPassphraseNeeded.id}`,
    );
    await waitFor(() => {
      expect(derivationInput).toBeVisible();
    });
    fireEvent.input(derivationInput, { target: { value: "m/86'/0'/0'" } });

    // set account number
    const accountOptionOne = await screen.findByText('Account #1');
    fireEvent.click(accountOptionOne);
    // set network
    const bitcoinNetwork = await screen.findByText('BITCOIN');
    fireEvent.click(bitcoinNetwork);

    // select unlocked wallet
    // hit advance button
    const advanceButton = await screen.findByRole('button', {
      name: 'Advance',
    });
    expect(advanceButton).toBeEnabled();

    fireEvent.click(advanceButton);

    await waitFor(() =>
      expect(getXpubFromDeviceSpy).toHaveBeenCalledWith(
        mockHWNoPinNoPassphraseNeeded.id,
        '1',
        "m/86'/0'/0'",
        'BITCOIN',
      ),
    );

    expect(mockNavigate).toHaveBeenCalledWith('/sign-in', {
      state: {
        walletData: {
          policyType: policyTypeOptions[0],
          signaturesNeeded: 1,
          numberOfXpubs: 1,
          keyDetails: [
            {
              derivationPath: "m/86'/0'/0'",
              xpub: mockXpub,
              masterFingerprint: '00000000',
            },
          ],
          defaultNetwork: 'BITCOIN',
          defaultScriptType: ScriptTypes.P2TR,
          defaultDescriptor: '',
          defaultElectrumServerUrl: '',
          backendServerBaseUrl: '',
          isUsingPublicServer: false,
          privateElectrumUrl: '',
          publicElectrumUrl: '',
        },
      },
    });
  });

  it('Test advance with wallet needs passphrase', async () => {
    getConnectedHardwareWalletsSpy.mockResolvedValue({
      wallets: [mockHWPassphraseNeeded],
    });
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const scanButton = await screen.findByRole('button', { name: 'scan' });

    fireEvent.click(scanButton);

    // needs passphrase wallet
    const walletUnLockedAndNeedsPassphraseTitle =
      await screen.findByText('Mock model3');
    const passphraseRequiredText = await screen.findByText(
      'passphrase required',
    );
    const passphraseInput =
      await screen.findByPlaceholderText('Enter passphrase');

    expect(walletUnLockedAndNeedsPassphraseTitle).toBeInTheDocument();
    expect(passphraseRequiredText).toBeInTheDocument();

    fireEvent.input(passphraseInput, {
      target: { value: 'mockPassphrase' },
    });

    const sendPassphraseButton = await screen.findByRole('button', {
      name: 'Send',
    });
    fireEvent.click(sendPassphraseButton);

    await waitFor(() =>
      expect(setWalletPassphraseSpy).toHaveBeenCalledWith(
        mockHWPassphraseNeeded.id,
        'mockPassphrase',
      ),
    );

    const unlockedWalletCheckbox = await screen.findByTestId(
      `hardware-walletcheckbox-${mockHWPassphraseNeeded.id}`,
    );
    fireEvent.click(unlockedWalletCheckbox);

    // set derivation
    const showDerivationButton = await screen.findByRole('button', {
      name: 'Show derivation',
    });
    fireEvent.click(showDerivationButton);
    const derivationInput = await screen.findByTestId(
      `derivation-path-${mockHWPassphraseNeeded.id}`,
    );
    await waitFor(() => {
      expect(derivationInput).toBeVisible();
    });
    fireEvent.input(derivationInput, { target: { value: "m/86'/0'/0'" } });

    // set account number
    const accountOptionOne = await screen.findByText('Account #1');
    fireEvent.click(accountOptionOne);
    // set network
    const bitcoinNetwork = await screen.findByText('BITCOIN');
    fireEvent.click(bitcoinNetwork);

    // select unlocked wallet
    // hit advance button
    const advanceButton = await screen.findByRole('button', {
      name: 'Advance',
    });
    expect(advanceButton).toBeEnabled();

    fireEvent.click(advanceButton);

    await waitFor(() =>
      expect(getXpubFromDeviceSpy).toHaveBeenCalledWith(
        mockHWPassphraseNeeded.id,
        '1',
        "m/86'/0'/0'",
        'BITCOIN',
      ),
    );

    expect(mockNavigate).toHaveBeenCalledWith('/sign-in', {
      state: {
        walletData: {
          policyType: policyTypeOptions[0],
          signaturesNeeded: 1,
          numberOfXpubs: 1,
          keyDetails: [
            {
              derivationPath: "m/86'/0'/0'",
              xpub: mockXpub,
              masterFingerprint: '00000000',
            },
          ],
          defaultNetwork: 'BITCOIN',
          defaultScriptType: ScriptTypes.P2TR,
          defaultDescriptor: '',
          defaultElectrumServerUrl: '',
          backendServerBaseUrl: '',
          isUsingPublicServer: false,
          privateElectrumUrl: '',
          publicElectrumUrl: '',
        },
      },
    });
  });

  it('Test advance with locked wallet(needs pin), doesnt need passphrase', async () => {
    getConnectedHardwareWalletsSpy.mockResolvedValue({
      wallets: [mockHWPinNeeded],
    });
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const scanButton = await screen.findByRole('button', { name: 'scan' });

    fireEvent.click(scanButton);

    // needs pin wallet
    const walletNeedsPinSet = await screen.findByText('Mock model2');
    expect(walletNeedsPinSet).toBeInTheDocument();

    const walletUnlockButton = await screen.findByRole('button', {
      name: 'Unlock',
    });
    fireEvent.click(walletUnlockButton);
    await waitFor(() => {
      expect(promptToUnlockWalletSpy).toHaveBeenCalledWith(mockHWPinNeeded.id);
    });

    const pinInput = await screen.findByPlaceholderText('Enter pin');
    fireEvent.input(pinInput, { target: { value: '1234' } });

    const enterPinButton = await screen.findByRole('button', {
      name: /Enter Pin/i,
    });
    expect(enterPinButton).toBeEnabled();
    fireEvent.click(enterPinButton);

    await waitFor(() =>
      expect(unlockWalletSpy).toHaveBeenCalledWith(mockHWPinNeeded.id, '1234'),
    );

    const unlockedWalletCheckbox = await screen.findByTestId(
      `hardware-walletcheckbox-${mockHWPinNeeded.id}`,
    );
    fireEvent.click(unlockedWalletCheckbox);

    // set derivation
    const showDerivationButton = await screen.findByRole('button', {
      name: 'Show derivation',
    });
    fireEvent.click(showDerivationButton);
    const derivationInput = await screen.findByTestId(
      `derivation-path-${mockHWPinNeeded.id}`,
    );
    await waitFor(() => {
      expect(derivationInput).toBeVisible();
    });
    fireEvent.input(derivationInput, { target: { value: "m/86'/0'/0'" } });

    // set account number
    const accountOptionOne = await screen.findByText('Account #1');
    fireEvent.click(accountOptionOne);
    // set network
    const bitcoinNetwork = await screen.findByText('BITCOIN');
    fireEvent.click(bitcoinNetwork);

    // select unlocked wallet
    // hit advance button
    const advanceButton = await screen.findByRole('button', {
      name: 'Advance',
    });
    expect(advanceButton).toBeEnabled();

    fireEvent.click(advanceButton);

    await waitFor(() =>
      expect(getXpubFromDeviceSpy).toHaveBeenCalledWith(
        mockHWPinNeeded.id,
        '1',
        "m/86'/0'/0'",
        'BITCOIN',
      ),
    );

    expect(mockNavigate).toHaveBeenCalledWith('/sign-in', {
      state: {
        walletData: {
          policyType: policyTypeOptions[0],
          signaturesNeeded: 1,
          numberOfXpubs: 1,
          keyDetails: [
            {
              derivationPath: "m/86'/0'/0'",
              xpub: mockXpub,
              masterFingerprint: '00000000',
            },
          ],
          defaultNetwork: 'BITCOIN',
          defaultScriptType: ScriptTypes.P2TR,
          defaultDescriptor: '',
          defaultElectrumServerUrl: '',
          backendServerBaseUrl: '',
          isUsingPublicServer: false,
          privateElectrumUrl: '',
          publicElectrumUrl: '',
        },
      },
    });
  });

  it('Test trezor needs pin and passphrase flow using the keypay.', async () => {
    getConnectedHardwareWalletsSpy.mockResolvedValue({
      wallets: [mockTrezorPinAndPassNeeded],
    });
    const screen = render(
      <WrappedInAppWrappers>
        <HardwareModalManager isOpen={true} closeModal={closeModalSpy} />
      </WrappedInAppWrappers>,
    );

    const scanButton = await screen.findByRole('button', { name: 'scan' });

    fireEvent.click(scanButton);

    // needs pin wallet
    const walletNeedsPinSet = await screen.findByText('Mock model trezor');
    expect(walletNeedsPinSet).toBeInTheDocument();

    const walletUnlockButton = await screen.findByRole('button', {
      name: 'Unlock',
    });
    fireEvent.click(walletUnlockButton);
    await waitFor(() => {
      expect(promptToUnlockWalletSpy).toHaveBeenCalledWith(
        mockTrezorPinAndPassNeeded.id,
      );
    });
    const keyPadTopLeft = await screen.findByTestId('keypad-top-left');
    const keyPadTopMiddle = await screen.findByTestId('keypad-top-middle');
    const keyPadTopRight = await screen.findByTestId('keypad-top-right');
    const keyPadMiddleLeft = await screen.findByTestId('keypad-middle-left');
    const keyPadMiddleMiddle = await screen.findByTestId(
      'keypad-middle-middle',
    );
    const keyPadMiddleRight = await screen.findByTestId('keypad-middle-right');
    const keyPadBottomLeft = await screen.findByTestId('keypad-bottom-left');
    const keyPadBottomMiddle = await screen.findByTestId(
      'keypad-bottom-middle',
    );
    const keyPadBottomRight = await screen.findByTestId('keypad-bottom-right');
    fireEvent.click(keyPadTopLeft);
    fireEvent.click(keyPadTopMiddle);
    fireEvent.click(keyPadTopRight);
    fireEvent.click(keyPadMiddleLeft);
    fireEvent.click(keyPadMiddleMiddle);
    fireEvent.click(keyPadMiddleRight);
    fireEvent.click(keyPadBottomLeft);
    fireEvent.click(keyPadBottomMiddle);
    fireEvent.click(keyPadBottomRight);

    const enterPinButton = await screen.findByRole('button', {
      name: /Enter Pin/i,
    });
    expect(enterPinButton).toBeEnabled();
    fireEvent.click(enterPinButton);

    await waitFor(() =>
      expect(unlockWalletSpy).toHaveBeenCalledWith(
        mockTrezorPinAndPassNeeded.id,
        '789456123',
      ),
    );

    const passphraseRequiredText = await screen.findByText(
      'passphrase required',
    );
    expect(passphraseRequiredText).toBeInTheDocument();
    const passphraseInput =
      await screen.findByPlaceholderText('Enter passphrase');

    fireEvent.input(passphraseInput, {
      target: { value: 'mockPassphrase' },
    });

    const sendPassphraseButton = await screen.findByRole('button', {
      name: 'Send',
    });
    fireEvent.click(sendPassphraseButton);

    await waitFor(() =>
      expect(setWalletPassphraseSpy).toHaveBeenCalledWith(
        mockTrezorPinAndPassNeeded.id,
        'mockPassphrase',
      ),
    );

    const unlockedWalletCheckbox = await screen.findByTestId(
      `hardware-walletcheckbox-${mockTrezorPinAndPassNeeded.id}`,
    );
    fireEvent.click(unlockedWalletCheckbox);

    // set derivation
    const showDerivationButton = await screen.findByRole('button', {
      name: 'Show derivation',
    });
    fireEvent.click(showDerivationButton);
    const derivationInput = await screen.findByTestId(
      `derivation-path-${mockTrezorPinAndPassNeeded.id}`,
    );
    await waitFor(() => {
      expect(derivationInput).toBeVisible();
    });
    fireEvent.input(derivationInput, { target: { value: "m/44'/0'/0'" } });

    // set account number
    const accountOptionOne = await screen.findByText('Account #2');
    fireEvent.click(accountOptionOne);
    // set network
    const bitcoinNetwork = await screen.findByText('BITCOIN');
    fireEvent.click(bitcoinNetwork);

    // select unlocked wallet
    // hit advance button
    const advanceButton = await screen.findByRole('button', {
      name: 'Advance',
    });
    expect(advanceButton).toBeEnabled();

    fireEvent.click(advanceButton);

    await waitFor(() =>
      expect(getXpubFromDeviceSpy).toHaveBeenCalledWith(
        mockTrezorPinAndPassNeeded.id,
        '2',
        "m/44'/0'/0'",
        'BITCOIN',
      ),
    );

    expect(mockNavigate).toHaveBeenCalledWith('/sign-in', {
      state: {
        walletData: {
          policyType: policyTypeOptions[0],
          signaturesNeeded: 1,
          numberOfXpubs: 1,
          keyDetails: [
            {
              derivationPath: "m/44'/0'/0'",
              xpub: mockXpub,
              masterFingerprint: '00000000',
            },
          ],
          defaultNetwork: 'BITCOIN',
          defaultScriptType: ScriptTypes.P2PKH,
          defaultDescriptor: '',
          defaultElectrumServerUrl: '',
          backendServerBaseUrl: '',
          isUsingPublicServer: false,
          privateElectrumUrl: '',
          publicElectrumUrl: '',
        },
      },
    });
  });
});
