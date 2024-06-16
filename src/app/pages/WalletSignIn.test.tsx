import { fireEvent, render, waitFor } from '@testing-library/react';
import { WalletSignIn } from './WalletSignIn';
import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';

const mockNavigate = jest.fn();
let initiateWalletSpy: jest.SpyInstance;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('WalletSignIn', () => {
  beforeEach(() => {
    jest
      .spyOn(ApiClient, 'getServerHealthStatus')
      .mockResolvedValue({ status: 'good' });

    initiateWalletSpy = jest
      .spyOn(ApiClient, 'initiateWallet')
      .mockResolvedValue({
        message: 'Wallet created successfully',
        descriptor: 'mockDescriptor',
        network: 'REGTEST',
        electrumUrl: 'mockElectrumUrl',
      });
  });

  afterEach(() => {
    mockElectron.ipcRenderer.sendMessage.mockRestore();
  });

  test('Default Wallet sign displays correctly', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Setup wallet');
    const networkLabel = screen.getByText('Network');
    const networkSelected = screen.getByText('REGTEST');
    const scriptTypeLabel = screen.getByText('Script type');
    const scriptTypeSelected = screen.getByText('Native Segwit (P2WPKH)');
    const masterFingerPrintLabel = screen.getByText('Master fingerprint');
    const masterFingerPrintSelected = (await screen.findByPlaceholderText(
      '00000000',
    )) as HTMLInputElement;

    const derivationPathLabel = screen.getByText('Derivation path');
    const derivationPathInput = screen.getByPlaceholderText(
      "m/49'/0'/0'",
    ) as HTMLInputElement;

    const xpubLabel = screen.getByText('xpub');
    const xpubInput = screen.getByPlaceholderText(
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
    ) as HTMLInputElement;

    const serverTypeLabel = screen.getByText('Server type');
    const serverTypeSelected = screen.getByLabelText('Private electrum server');
    const serverTypeNotSelected = screen.getByLabelText(
      'Public electrum server',
    );

    const privateElectrumUrl = screen.getByPlaceholderText(
      'Enter electrum url',
    ) as HTMLInputElement;

    const setupButton = screen.getByRole('button', { name: 'Setup' });

    expect(title).toBeInTheDocument();
    expect(networkLabel).toBeInTheDocument();
    expect(networkSelected).toBeInTheDocument();
    expect(scriptTypeLabel).toBeInTheDocument();
    expect(scriptTypeSelected).toBeInTheDocument();
    expect(masterFingerPrintLabel).toBeInTheDocument();
    expect(masterFingerPrintSelected.value).toBe('00000000');
    expect(derivationPathLabel).toBeInTheDocument();
    expect(derivationPathInput.value).toBe('');
    expect(xpubLabel).toBeInTheDocument();
    expect(xpubInput.value).toBe('');
    expect(serverTypeLabel).toBeInTheDocument();
    expect(serverTypeSelected).toBeChecked();
    expect(serverTypeNotSelected).not.toBeChecked();
    expect(privateElectrumUrl.value).toBe('127.0.0.1:50000');
    expect(setupButton).toBeDisabled();
  });

  it('Complete form and press setup button works successfully', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Setup wallet');

    expect(title).toBeInTheDocument();
    let setupButton = screen.getByRole('button', { name: 'Setup' });

    expect(setupButton).toBeDisabled();

    const derivationPathInput = screen.getByPlaceholderText(
      "m/49'/0'/0'",
    ) as HTMLInputElement;

    const derivationPath = "m/84'/0'/0'";
    fireEvent.input(derivationPathInput, { target: { value: derivationPath } });

    const xpubInput = screen.getByPlaceholderText(
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
    ) as HTMLInputElement;

    const mockXpub =
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPtMock';
    fireEvent.input(xpubInput, {
      target: {
        value: mockXpub,
      },
    });

    await waitFor(() => {
      setupButton = screen.getByRole('button', { name: 'Setup' });

      expect(setupButton).toBeEnabled();
    });

    setupButton = screen.getByRole('button', { name: 'Setup' });
    const createdDescriptor = `wpkh([00000000/84'/0'/0']${mockXpub}/0/*)`;
    const defaultElectrumUrl = '127.0.0.1:50000';
    await waitFor(() => {
      fireEvent.click(setupButton);
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        createdDescriptor,
        'REGTEST',
        defaultElectrumUrl,
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/home');

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'save-wallet',
      {
        backendServerBaseUrl: 'http://localhost:5011',
        defaultDerivationPath: derivationPath,
        defaultDescriptor: createdDescriptor,
        defaultElectrumServerUrl: defaultElectrumUrl,
        defaultMasterFingerprint: '00000000',
        defaultNetwork: 'REGTEST',
        defaultScriptType: 'P2WPKH',
        defaultXpub: mockXpub,
        isUsingPublicServer: false,
        privateElectrumUrl: defaultElectrumUrl,
        publicElectrumUrl: 'electrum.blockstream.info',
      },
    );
  });
});
