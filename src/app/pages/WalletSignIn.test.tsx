import { fireEvent, render, waitFor, act } from '@testing-library/react';
import { WalletSignIn } from './WalletSignIn';
import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import {
  mockImportedWalletData,
  mockImportedWalletDataWithoutConfigs,
} from '../../__tests__/mocks';
import { Wallet } from '../types/wallet';
import { ScriptTypes } from '../types/scriptTypes';
import { Network } from '../types/network';
import { policyTypeOptions } from '../components/formOptions';
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const mockNavigate = jest.fn();
let mockUseLocation = {};
let initiateWalletSpy: jest.SpyInstance;
let getServerHealthStatusSpy: jest.SpyInstance;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation,
}));

describe('WalletSignIn', () => {
  beforeEach(() => {
    initiateWalletSpy = jest.spyOn(ApiClient, 'initiateWallet');
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
    mockUseLocation = {};
  });

  it('Default Wallet sign displays correctly', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const basicTab = await screen.findByText('Basic');
    const policyTypeLabel = screen.getByText('Policy type');
    const policyTypeSelect =
      await screen.findByPlaceholderText('Select policy type');
    const policyTypeSingleOption = screen.getByText('Single signature');
    const policyTypeMultiOption = screen.getByText('Multi signature');
    const networkLabel = screen.getByText('Network');
    const networkSelected = screen.getByText('REGTEST');
    const scriptTypeLabel = screen.getByText('Script type');
    const scriptTypeSelected = screen.getByText('Native Segwit (P2WPKH)');

    const derivationPathLabel = screen.getByText('Derivation path');
    const derivationPathInput = screen.getByPlaceholderText(
      "m/84'/0'/0'",
    ) as HTMLInputElement;

    const keyStoreLabel = await screen.findByText('Keystore');
    const xpubLabel = await screen.findByText('xpub');
    const xpubInput = screen.getByPlaceholderText(
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
    ) as HTMLInputElement;

    const privateElectrumServer = screen.getByLabelText('Private electrum');
    const publicElectrumServer = screen.getByLabelText('Public electrum');

    const privateElectrumUrl = screen.getByPlaceholderText(
      'Enter electrum url',
    ) as HTMLInputElement;

    const setupButton = screen.getByRole('button', { name: 'Connect' });

    // Advanced options
    const advancedTab = screen.getByText('Advanced');
    fireEvent.click(advancedTab);
    const masterFingerPrintLabel =
      await screen.findByText('Master fingerprint');
    const masterFingerPrintSelected = (await screen.findByPlaceholderText(
      '00000000',
    )) as HTMLInputElement;

    const gapLimitLabel = await screen.findByText('Gap limit');
    const gapLimit = await screen.findByDisplayValue('100');

    expect(basicTab).toBeInTheDocument();
    expect(policyTypeLabel).toBeInTheDocument();
    expect(policyTypeSingleOption).toBeInTheDocument();
    expect(policyTypeMultiOption).toBeInTheDocument();
    expect(policyTypeSelect).toHaveValue('Single signature');
    expect(networkLabel).toBeInTheDocument();
    expect(networkSelected).toBeInTheDocument();
    expect(scriptTypeLabel).toBeInTheDocument();
    expect(scriptTypeSelected).toBeInTheDocument();
    expect(masterFingerPrintLabel).toBeInTheDocument();
    expect(masterFingerPrintSelected.value).toBe('00000000');
    expect(derivationPathLabel).toBeInTheDocument();
    expect(derivationPathInput.value).toBe('');
    expect(keyStoreLabel).toBeInTheDocument();
    expect(xpubLabel).toBeInTheDocument();
    expect(xpubInput.value).toBe('');
    expect(privateElectrumServer).toBeInTheDocument();
    expect(publicElectrumServer).toBeInTheDocument();
    expect(privateElectrumUrl.value).toBe('127.0.0.1:50000');
    expect(gapLimitLabel).toBeInTheDocument();
    expect(gapLimit).toBeInTheDocument();
    expect(setupButton).toBeDisabled();
  });

  it('Complete form and press setup button works successfully', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const basicTab = await screen.findByText('Basic');

    expect(basicTab).toBeInTheDocument();
    let setupButton = screen.getByRole('button', { name: 'Connect' });

    expect(setupButton).toBeDisabled();

    const derivationPathInput = screen.getByPlaceholderText(
      "m/84'/0'/0'",
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
      setupButton = screen.getByRole('button', { name: 'Connect' });

      expect(setupButton).toBeEnabled();
    });

    setupButton = screen.getByRole('button', { name: 'Connect' });
    const createdDescriptor = `wpkh([00000000/84'/0'/0']${mockXpub}/0/*)`;
    const defaultElectrumUrl = '127.0.0.1:50000';
    await waitFor(() => {
      fireEvent.click(setupButton);
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        createdDescriptor,
        'REGTEST',
        defaultElectrumUrl,
        100,
        undefined,
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/home', {
      state: { signaturesNeeded: 1, numberOfXpubs: 1 },
    });

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'save-wallet',
      {
        policyType: policyTypeOptions[0],
        signaturesNeeded: 1,
        numberOfXpubs: 1,
        keyDetails: [
          {
            xpub: mockXpub,
            derivationPath: derivationPath,
            masterFingerprint: '00000000',
          },
        ],
        backendServerBaseUrl: 'http://localhost:5011',
        defaultDescriptor: createdDescriptor,
        defaultElectrumServerUrl: defaultElectrumUrl,
        defaultNetwork: 'REGTEST',
        defaultScriptType: 'P2WPKH',
        isUsingPublicServer: false,
        privateElectrumUrl: defaultElectrumUrl,
        publicElectrumUrl: 'electrum.blockstream.info',
      },
    );
  });
  it('Test initial ipcRenderer messages', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const basicTab = await screen.findByText('Basic');

    expect(basicTab).toBeInTheDocument();

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'current-route',
      '/signin',
    );

    expect(mockElectron.ipcRenderer.on).toHaveBeenCalledWith(
      'json-wallet',
      expect.any(Function),
    );
  });

  it('Importing wallet via the json-wallet ipcRenderer on works successfully by setting the walletData', async () => {
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
      const setupButton = screen.getByRole('button', { name: 'Connect' });
      expect(setupButton).toBeEnabled();
    });

    // Now confirm loaded wallet data is displayed

    const networkSelected = screen.getByText(
      mockImportedWalletData.defaultNetwork,
    );

    const policyTypeSelect =
      await screen.findByPlaceholderText('Select policy type');

    const scriptTypeSelected = screen.getByText('Taproot (P2TR)');
    const masterFingerPrintSelected = (await screen.findByPlaceholderText(
      '00000000',
    )) as HTMLInputElement;

    const derivationPathInput = screen.getByPlaceholderText(
      "m/86'/0'/0'",
    ) as HTMLInputElement;

    const xpubInput = screen.getByPlaceholderText(
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
    ) as HTMLInputElement;

    const privateElectrumServer = screen.getByLabelText('Private electrum');
    const publicElectrumServer = screen.getByLabelText('Public electrum');

    const privateElectrumUrl = screen.getByPlaceholderText(
      'Enter electrum url',
    ) as HTMLInputElement;

    const publicElectrumUrl = screen.getByPlaceholderText(
      'Enter public electrum url',
    ) as HTMLInputElement;

    expect(policyTypeSelect).toHaveValue(
      mockImportedWalletData.policyType.value,
    );
    expect(networkSelected).toBeInTheDocument();
    expect(scriptTypeSelected).toBeInTheDocument();
    expect(masterFingerPrintSelected.value).toBe(
      mockImportedWalletData.keyDetails[0].masterFingerprint,
    );
    expect(derivationPathInput.value).toBe(
      mockImportedWalletData.keyDetails[0].derivationPath,
    );
    expect(xpubInput.value).toBe(mockImportedWalletData.keyDetails[0].xpub);
    expect(publicElectrumServer).toBeInTheDocument();
    expect(privateElectrumServer).toBeInTheDocument();
    expect(privateElectrumUrl.value).toBe(
      mockImportedWalletData.privateElectrumUrl,
    );
    expect(publicElectrumUrl.value).toBe(
      mockImportedWalletData.publicElectrumUrl,
    );

    let setupButton = screen.getByRole('button', { name: 'Connect' });
    expect(setupButton).toBeEnabled();

    // Confirm loaded wallet data is sent to the backend
    fireEvent.click(setupButton);
    await waitFor(() => {
      fireEvent.click(setupButton);
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        "tr([11111111/44'/0'/0']mockXpub/0/*)",
        mockImportedWalletData.defaultNetwork,
        `${mockImportedWalletData.publicElectrumUrl}:50001`,
        100,
        undefined,
      );
    });
  });

  it('Importing wallet via navigation state props works.', async () => {
    const walletDataFromHwWallet: Wallet = {
      policyType: policyTypeOptions[0],
      signaturesNeeded: 1,
      numberOfXpubs: 1,
      keyDetails: [
        {
          xpub: 'mockXpub',
          derivationPath: "m/84'/0'/0'",
          masterFingerprint: '00000000',
        },
      ],
      defaultNetwork: Network.BITCOIN,
      defaultScriptType: ScriptTypes.P2SHP2WPKH,
      defaultDescriptor: '',
      defaultElectrumServerUrl: 'electrum.blockstream.info',
      backendServerBaseUrl: '',
      isUsingPublicServer: true,
      privateElectrumUrl: '',
      publicElectrumUrl: 'electrum.blockstream.info',
    };

    mockUseLocation = {
      state: { walletData: walletDataFromHwWallet },
    };

    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    await waitFor(() => {
      const setupButton = screen.getByRole('button', { name: 'Connect' });
      expect(setupButton).toBeEnabled();
    });

    // Now confirm loaded wallet data is displayed

    const policyTypeSelect =
      await screen.findByPlaceholderText('Select policy type');
    const networkSelected = screen.getByText(
      walletDataFromHwWallet.defaultNetwork,
    );
    const scriptTypeSelected = screen.getByText('Taproot (P2TR)');
    const masterFingerPrintSelected = (await screen.findByPlaceholderText(
      '00000000',
    )) as HTMLInputElement;

    const derivationPathInput = (await screen.findByTestId(
      'derivation-path',
    )) as HTMLInputElement;

    const xpubInput = screen.getByPlaceholderText(
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
    ) as HTMLInputElement;

    const privateElectrumServer = screen.getByLabelText('Private electrum');
    const publicElectrumServer = screen.getByLabelText('Public electrum');

    const privateElectrumUrl = screen.getByPlaceholderText(
      'Enter electrum url',
    ) as HTMLInputElement;

    const publicElectrumUrl = screen.getByPlaceholderText(
      'Enter public electrum url',
    ) as HTMLInputElement;

    expect(policyTypeSelect).toHaveValue(
      walletDataFromHwWallet.policyType.value,
    );
    expect(networkSelected).toBeInTheDocument();
    expect(scriptTypeSelected).toBeInTheDocument();
    expect(masterFingerPrintSelected.value).toBe(
      walletDataFromHwWallet.keyDetails[0].masterFingerprint,
    );
    expect(derivationPathInput.value).toBe(
      walletDataFromHwWallet.keyDetails[0].derivationPath,
    );
    expect(xpubInput.value).toBe(walletDataFromHwWallet.keyDetails[0].xpub);
    expect(publicElectrumServer).toBeInTheDocument();
    expect(privateElectrumServer).toBeInTheDocument();
    expect(privateElectrumUrl.value).toBe(
      walletDataFromHwWallet.privateElectrumUrl,
    );
    expect(publicElectrumUrl.value).toBe(
      walletDataFromHwWallet.publicElectrumUrl,
    );

    let setupButton = screen.getByRole('button', { name: 'Connect' });
    expect(setupButton).toBeEnabled();

    // Confirm loaded wallet data is sent to the backend
    fireEvent.click(setupButton);
    await waitFor(() => {
      fireEvent.click(setupButton);
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        "sh(wpkh([00000000/84'/0'/0']mockXpub/0/*))",
        walletDataFromHwWallet.defaultNetwork,
        `${walletDataFromHwWallet.publicElectrumUrl}:50001`,
        100,
        undefined,
      );
    });
  });

  it('Test error message displays when initating wallet request fails', async () => {
    initiateWalletSpy.mockRejectedValue({
      ok: false as any,
      status: 404 as any,
      json: () => Promise.resolve({ error: 'Error initiating wallet' }),
    } as any) as any;

    mockElectron.ipcRenderer.on.mockResolvedValue(
      mockImportedWalletDataWithoutConfigs,
    );

    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    // simulate ipcRenderer.on sending the imported wallet to the WalletSignIn component
    act(() => {
      mockElectron.ipcRenderer.on.mock.calls[0][1](
        mockImportedWalletDataWithoutConfigs,
      );
    });

    await waitFor(() => {
      let setupButton = screen.getByRole('button', { name: 'Connect' });
      expect(setupButton).toBeEnabled();

      fireEvent.click(setupButton);
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        "tr([11111111/44'/0'/0']mockXpub/0/*)",
        mockImportedWalletDataWithoutConfigs.defaultNetwork,
        `${mockImportedWalletDataWithoutConfigs.publicElectrumUrl}:50001`,
        100,
        undefined,
      );
    });
    // get error toast
    await waitFor(() => {
      const errorToast = screen.getByText(/Error initiating wallet/i);
      expect(errorToast).toBeInTheDocument();
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
    getServerHealthStatusSpy.mockRejectedValue({
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
      const basicTab = screen.getByText('Basic');
      expect(basicTab).toBeInTheDocument();

      const createMockButton = screen.queryByRole('button', {
        name: 'Create dev mocks',
      });

      expect(createMockButton).not.toBeInTheDocument();
    });
  });
  it('Derivation path placeholder changes as script type changes', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const basicTab = await screen.findByText('Basic');
    let scriptTypeSelect = screen.getByTestId('script-type-select');
    let scriptTypeSelected = screen.getByText('Native Segwit (P2WPKH)');
    let derivationPathSegwit = screen.getByPlaceholderText(
      "m/84'/0'/0'",
    ) as HTMLInputElement;
    expect(basicTab).toBeInTheDocument();
    expect(scriptTypeSelected).toBeInTheDocument();
    expect(derivationPathSegwit).toBeInTheDocument();

    // open dropdown
    fireEvent.click(scriptTypeSelect);
    let option = await screen.findByRole('option', {
      name: /Legacy \(P2PKH\)/,
    });
    fireEvent.click(option);
    let derivationLegacy = (await screen.findByPlaceholderText(
      "m/44'/0'/0'",
    )) as HTMLInputElement;
    expect(derivationLegacy).toBeInTheDocument();

    // open dropdown
    fireEvent.click(scriptTypeSelect);
    option = await screen.findByRole('option', {
      name: /Nested Segwit \(P2SH-P2WPKH\)/,
    });
    fireEvent.click(option);
    let derivationWrappedSegit = (await screen.findByPlaceholderText(
      "m/49'/1'/0'",
    )) as HTMLInputElement;
    expect(derivationWrappedSegit).toBeInTheDocument();

    // open dropdown
    fireEvent.click(scriptTypeSelect);
    option = await screen.findByRole('option', {
      name: /Taproot \(P2TR\)/,
    });
    fireEvent.click(option);
    let derivationTaproot = (await screen.findByPlaceholderText(
      "m/86'/0'/0'",
    )) as HTMLInputElement;
    expect(derivationTaproot).toBeInTheDocument();
  });
});
