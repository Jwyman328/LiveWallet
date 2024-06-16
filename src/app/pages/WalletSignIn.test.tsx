import { fireEvent, render, waitFor, act } from '@testing-library/react';
import { WalletSignIn } from './WalletSignIn';
import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import { Network } from '../types/network';
import { ScriptTypes } from '../types/scriptTypes';
import { Wallet } from '../types/wallet';
import { BtcMetric } from '../types/btcSatHandler';
import { ScaleOption } from './Home';

const mockNavigate = jest.fn();
let initiateWalletSpy: jest.SpyInstance;
let getServerHealthStatusSpy: jest.SpyInstance;

initiateWalletSpy = jest.spyOn(ApiClient, 'initiateWallet');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

fdescribe('WalletSignIn', () => {
  beforeEach(() => {
    getServerHealthStatusSpy = jest.spyOn(ApiClient, 'getServerHealthStatus');
    getServerHealthStatusSpy.mockResolvedValue({ status: 'good' });

    initiateWalletSpy.mockResolvedValue({
      message: 'Wallet created successfully',
      descriptor: 'mockDescriptor',
      network: 'REGTEST',
      electrumUrl: 'mockElectrumUrl',
    });
  });

  afterEach(() => {
    mockElectron.ipcRenderer.sendMessage.mockClear();
    mockElectron.ipcRenderer.on.mockClear();
    initiateWalletSpy.mockClear();
    getServerHealthStatusSpy.mockClear();
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
    const privateElectrumServer = screen.getByLabelText(
      'Private electrum server',
    );
    const publicElectrumServer = screen.getByLabelText(
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
    expect(privateElectrumServer).toBeChecked();
    expect(publicElectrumServer).not.toBeChecked();
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
  test('Test initial ipcRenderer messages', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Setup wallet');

    expect(title).toBeInTheDocument();

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'current-route',
      '/signin',
    );

    expect(mockElectron.ipcRenderer.on).toHaveBeenCalledWith(
      'json-wallet',
      expect.any(Function),
    );
  });

  test('Importing wallet via the json-wallet ipcRenderer on works successfully by setting the walletData', async () => {
    const mockImportedWalletData: Wallet = {
      defaultDescriptor: 'mockDefaultDescriptor',
      defaultMasterFingerprint: '11111111',
      defaultDerivationPath: "m/44'/0'/0'",
      defaultXpub: 'mockXpub',
      defaultElectrumServerUrl: 'mockElectrumServer',
      backendServerBaseUrl: 'mockBackendServer',
      defaultNetwork: Network.BITCOIN,
      defaultScriptType: ScriptTypes.P2TR,
      isUsingPublicServer: true,
      privateElectrumUrl: 'mockPrivateElectrum',
      publicElectrumUrl: 'bitcoin.aranguren.org',

      btcMetric: BtcMetric.BTC,
      feeRateColorMapValues: [
        [1, 'green'],
        [20, 'yellow'],
      ],
      feeScale: { value: '200', label: '200' } as ScaleOption,
      minFeeScale: { value: '100', label: '100' } as ScaleOption,
      feeRate: '20',
    };
    mockElectron.ipcRenderer.on.mockResolvedValue(mockImportedWalletData);

    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    // simulate ipcRenderer.on sending the imported wallet to the WalletSignIn component
    act(() => {
      mockElectron.ipcRenderer.on.mock.calls[0][1](mockImportedWalletData);
    });

    // tell main thread about wallet config data as well that is saved along with the wallet data
    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'save-wallet-configs',
      {
        btcMetric: mockImportedWalletData.btcMetric,
        feeRateColorMapValues: mockImportedWalletData.feeRateColorMapValues,
        feeScale: mockImportedWalletData.feeScale,
        minFeeScale: mockImportedWalletData.minFeeScale,
        feeRate: mockImportedWalletData.feeRate,
      },
    );

    await waitFor(() => {
      const setupButton = screen.getByRole('button', { name: 'Setup' });
      expect(setupButton).toBeEnabled();
    });

    // Now confirm loaded wallet data is displayed

    const networkSelected = screen.getByText(
      mockImportedWalletData.defaultNetwork,
    );
    const scriptTypeSelected = screen.getByText('Taproot (P2TR)');
    const masterFingerPrintSelected = (await screen.findByPlaceholderText(
      '00000000',
    )) as HTMLInputElement;

    const derivationPathInput = screen.getByPlaceholderText(
      "m/49'/0'/0'",
    ) as HTMLInputElement;

    const xpubInput = screen.getByPlaceholderText(
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
    ) as HTMLInputElement;

    const privateElectrumServer = screen.getByLabelText(
      'Private electrum server',
    );
    const publicElectrumServer = screen.getByLabelText(
      'Public electrum server',
    );

    const privateElectrumUrl = screen.getByPlaceholderText(
      'Enter electrum url',
    ) as HTMLInputElement;

    const publicElectrumUrl = screen.getByPlaceholderText(
      'Enter public electrum url',
    ) as HTMLInputElement;

    expect(networkSelected).toBeInTheDocument();
    expect(scriptTypeSelected).toBeInTheDocument();
    expect(masterFingerPrintSelected.value).toBe(
      mockImportedWalletData.defaultMasterFingerprint,
    );
    expect(derivationPathInput.value).toBe(
      mockImportedWalletData.defaultDerivationPath,
    );
    expect(xpubInput.value).toBe(mockImportedWalletData.defaultXpub);
    expect(publicElectrumServer).toBeChecked();
    expect(privateElectrumServer).not.toBeChecked();
    expect(privateElectrumUrl.value).toBe(
      mockImportedWalletData.privateElectrumUrl,
    );
    expect(publicElectrumUrl.value).toBe(
      mockImportedWalletData.publicElectrumUrl,
    );

    let setupButton = screen.getByRole('button', { name: 'Setup' });
    expect(setupButton).toBeEnabled();

    // Confirm loaded wallet data is sent to the backend
    fireEvent.click(setupButton);
    await waitFor(() => {
      fireEvent.click(setupButton);
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        "tr([11111111/44'/0'/0']mockXpub/0/*)",
        mockImportedWalletData.defaultNetwork,
        `${mockImportedWalletData.publicElectrumUrl}:50001`,
      );
    });
  });

  it('When server health check request returns bad status', async () => {
    getServerHealthStatusSpy.mockResolvedValue({ status: 'bad' });
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    await waitFor(() => {
      const errorMsg = screen.getByText(
        'There is a problem connecting with the server, please restart the app and try again.',
      );
      expect(errorMsg).toBeInTheDocument();
    });
  });

  it('When server health check request returns error', async () => {
    getServerHealthStatusSpy.mockResolvedValue({
      ok: false as any,
      status: 404 as any,
      json: () => Promise.resolve({ error: 'Not found' }),
    } as any) as any;

    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );
    await waitFor(() => {
      const errorMsg = screen.getByText(
        'There is a problem connecting with the server, please restart the app and try again.',
      );
      expect(errorMsg).toBeInTheDocument();
    });
  });
  it('Make sure Create dev mocks button does not show in production', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    await waitFor(() => {
      const title = screen.getByText('Setup wallet');
      expect(title).toBeInTheDocument();

      const createMockButton = screen.queryByRole('button', {
        name: 'Create dev mocks',
      });

      expect(createMockButton).not.toBeInTheDocument();
    });
  });
});
