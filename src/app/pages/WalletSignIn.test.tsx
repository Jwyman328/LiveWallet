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
        'BITCOIN',
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
        defaultNetwork: 'BITCOIN',
        defaultScriptType: 'P2WPKH',
        isUsingPublicServer: false,
        privateElectrumUrl: defaultElectrumUrl,
        publicElectrumUrl: 'electrum.blockstream.info',
      },
    );
  });

  it('Test multisig policy type selection works correctly', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const policyTypeMultiOption = await screen.findByText('Multi signature');
    fireEvent.click(policyTypeMultiOption);

    // multisig script types
    const scriptTypeLegacy = screen.getByText('Legacy (P2SH)');
    const scriptTypeNested = screen.getByText('Nested Segwit (P2SH-P2WSH)');
    const scriptTypeNative = screen.getByText('Native Segwit (P2WSH)');
    expect(scriptTypeLegacy).toBeInTheDocument();
    expect(scriptTypeNested).toBeInTheDocument();
    expect(scriptTypeNative).toBeInTheDocument();

    const scriptTypeSelected = screen.getByTestId('script-type-select');
    expect(scriptTypeSelected).toHaveValue('Native Segwit (P2WSH)');

    const policyTypeSelect =
      await screen.findByPlaceholderText('Select policy type');
    expect(policyTypeSelect).toHaveValue('Multi signature');

    // M of N label and range slider should now be showing
    const mOfNLabel = screen.getByText('M of N');
    expect(mOfNLabel).toBeInTheDocument();
    const mOfNSlider = screen.getByTestId('m-of-n-slider');
    console.log('mOfNSlider', mOfNSlider);
    // test default 2 of 3 another way
    expect(mOfNSlider).toBeInTheDocument();

    const keyStoreOne = screen.getByText('Keystore 1');
    const keyStoreTwo = screen.getByText('Keystore 2');
    const keyStoreThree = screen.getByText('Keystore 3');
    expect(keyStoreOne).toBeInTheDocument();
    expect(keyStoreTwo).toBeInTheDocument();
    expect(keyStoreThree).toBeInTheDocument();

    // fill out all three forms


    // now inputs for all three key stores should be showing
    const derivationPathInputs = screen.getAllByPlaceholderText(
      "m/49'/0'/0'",
    ) as HTMLInputElement[];
    expect(derivationPathInputs.length).toBe(3);

    const xpubInputs = screen.getAllByPlaceholderText(
      'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
    ) as HTMLInputElement[];
    expect(xpubInputs.length).toBe(3);

    const masterFingerPrintInputs = screen.getAllByPlaceholderText(
      '00000000',
    ) as HTMLInputElement[];

    expect(masterFingerPrintInputs.length).toBe(3);


    //TODO make all the entered values and there use in the expect calls below reusable not always hard coded

    // fill out all three Keystores
    for (let i = 0; i < 3; i++) {
      fireEvent.input(derivationPathInputs[i], {
        target: { value: `m/49'/${i}'/0'` },
      });
      fireEvent.input(xpubInputs[i], {
        target: { value: `mockXpub${i}` },
      });
      fireEvent.input(masterFingerPrintInputs[i], {
        target: { value: `0000000${i}` },
      });
    }

    let setupButton;
    await waitFor(() => {
      setupButton = screen.getByRole('button', { name: 'Connect' });
      expect(setupButton).toBeEnabled();
    });

    fireEvent.click(setupButton);
    await waitFor(() => {
      console.log('initiateWalletSpy calls', initiateWalletSpy.mock.calls[0]);
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        "wsh(sortedmulti(2,[00000002/49'/2'/0']mockXpub2/0/*,[00000001/49'/1'/0']mockXpub1/0/*,[00000000/49'/0'/0']mockXpub0/0/*))",
        'BITCOIN',
        `127.0.0.1:50000`,
        100,
        "wsh(sortedmulti(2,[00000002/49'/2'/0']mockXpub2/1/*,[00000001/49'/1'/0']mockXpub1/1/*,[00000000/49'/0'/0']mockXpub0/1/*))",
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/home', {
      state: { signaturesNeeded: 2, numberOfXpubs: 3 },
    });

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'save-wallet',
      {
        policyType: policyTypeOptions[1],
        signaturesNeeded: 2,
        numberOfXpubs: 3,
        keyDetails: [
          {
            xpub: 'mockXpub0',
            derivationPath: "m/49'/0'/0'",
            masterFingerprint: '00000000',
          },

          {
            xpub: 'mockXpub1',
            derivationPath: "m/49'/1'/0'",
            masterFingerprint: '00000001',
          },
          {
            xpub: 'mockXpub2',
            derivationPath: "m/49'/2'/0'",
            masterFingerprint: '00000002',
          },
        ],
        defaultChangeDescriptor:
          "wsh(sortedmulti(2,[00000002/49'/2'/0']mockXpub2/1/*,[00000001/49'/1'/0']mockXpub1/1/*,[00000000/49'/0'/0']mockXpub0/1/*))",

        backendServerBaseUrl: 'http://localhost:5011',
        defaultDescriptor:
          "wsh(sortedmulti(2,[00000002/49'/2'/0']mockXpub2/0/*,[00000001/49'/1'/0']mockXpub1/0/*,[00000000/49'/0'/0']mockXpub0/0/*))",
        defaultElectrumServerUrl: '127.0.0.1:50000',
        defaultNetwork: 'BITCOIN',
        defaultScriptType: 'P2WSH',
        isUsingPublicServer: false,
        privateElectrumUrl: '127.0.0.1:50000',
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
