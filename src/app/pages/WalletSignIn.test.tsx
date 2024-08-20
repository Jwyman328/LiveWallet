import { fireEvent, render, waitFor, act } from '@testing-library/react';
import { WalletSignIn } from './WalletSignIn';
import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import {
  fiveMultiSigKeyDetailsMock,
  mockHWNoPinNoPassphraseNeeded,
  mockImportedWalletData,
  mockImportedWalletDataWithoutConfigs,
  unchainedConfigFileMock,
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

const xpubPlaceholder =
  'xpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt';

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
      xpubPlaceholder,
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
      xpubPlaceholder,
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
    expect(mOfNSlider).toBeInTheDocument();

    const keyStoreOne = screen.getByText('Keystore 1');
    const keyStoreTwo = screen.getByText('Keystore 2');
    const keyStoreThree = screen.getByText('Keystore 3');
    expect(keyStoreOne).toBeInTheDocument();
    expect(keyStoreTwo).toBeInTheDocument();
    expect(keyStoreThree).toBeInTheDocument();

    // now inputs for all three key stores should be showing
    const derivationPathInputs = screen.getAllByPlaceholderText(
      "m/49'/0'/0'",
    ) as HTMLInputElement[];
    expect(derivationPathInputs.length).toBe(3);

    const xpubInputs = screen.getAllByPlaceholderText(
      xpubPlaceholder,
    ) as HTMLInputElement[];
    expect(xpubInputs.length).toBe(3);

    const masterFingerPrintInputs = screen.getAllByPlaceholderText(
      '00000000',
    ) as HTMLInputElement[];
    expect(masterFingerPrintInputs.length).toBe(3);

    const createMockKeyStore = (i: number) => {
      return {
        derivation: `m/49'/${i}'/0'`,
        xpub: `mockXpub${i}`,
        masterFingerprint: `0000000${i}`,
      };
    };

    // fill out all three Keystores
    for (let i = 0; i < 3; i++) {
      const mockKeystore = createMockKeyStore(i);
      fireEvent.input(derivationPathInputs[i], {
        target: { value: mockKeystore.derivation },
      });
      fireEvent.input(xpubInputs[i], {
        target: { value: mockKeystore.xpub },
      });
      fireEvent.input(masterFingerPrintInputs[i], {
        target: { value: mockKeystore.masterFingerprint },
      });
    }

    let setupButton;
    await waitFor(() => {
      setupButton = screen.getByRole('button', { name: 'Connect' });
      expect(setupButton).toBeEnabled();
    });

    fireEvent.click(setupButton);
    const mockKeyStoreOne = createMockKeyStore(0);
    const mockKeyStoreTwo = createMockKeyStore(1);
    const mockKeyStoreThree = createMockKeyStore(2);
    const mockDescriptor = `wsh(sortedmulti(2,[${
      mockKeyStoreThree.masterFingerprint
    }${mockKeyStoreThree.derivation.replace('m', '')}]${
      mockKeyStoreThree.xpub
    }/0/*,[${
      mockKeyStoreTwo.masterFingerprint
    }${mockKeyStoreTwo.derivation.replace('m', '')}]${
      mockKeyStoreTwo.xpub
    }/0/*,[${
      mockKeyStoreOne.masterFingerprint
    }${mockKeyStoreOne.derivation.replace('m', '')}]${
      mockKeyStoreOne.xpub
    }/0/*))`;

    const mockChangeDescriptor = `wsh(sortedmulti(2,[${
      mockKeyStoreThree.masterFingerprint
    }${mockKeyStoreThree.derivation.replace('m', '')}]${
      mockKeyStoreThree.xpub
    }/1/*,[${
      mockKeyStoreTwo.masterFingerprint
    }${mockKeyStoreTwo.derivation.replace('m', '')}]${
      mockKeyStoreTwo.xpub
    }/1/*,[${
      mockKeyStoreOne.masterFingerprint
    }${mockKeyStoreOne.derivation.replace('m', '')}]${
      mockKeyStoreOne.xpub
    }/1/*))`;

    await waitFor(() => {
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        mockDescriptor,
        'BITCOIN',
        `127.0.0.1:50000`,
        100,
        mockChangeDescriptor,
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
            xpub: mockKeyStoreOne.xpub,
            derivationPath: mockKeyStoreOne.derivation,
            masterFingerprint: mockKeyStoreOne.masterFingerprint,
          },

          {
            xpub: mockKeyStoreTwo.xpub,
            derivationPath: mockKeyStoreTwo.derivation,
            masterFingerprint: mockKeyStoreTwo.masterFingerprint,
          },
          {
            xpub: mockKeyStoreThree.xpub,
            derivationPath: mockKeyStoreThree.derivation,
            masterFingerprint: mockKeyStoreThree.masterFingerprint,
          },
        ],
        defaultChangeDescriptor: mockChangeDescriptor,

        backendServerBaseUrl: 'http://localhost:5011',
        defaultDescriptor: mockDescriptor,
        defaultElectrumServerUrl: '127.0.0.1:50000',
        defaultNetwork: 'BITCOIN',
        defaultScriptType: 'P2WSH',
        isUsingPublicServer: false,
        privateElectrumUrl: '127.0.0.1:50000',
        publicElectrumUrl: 'electrum.blockstream.info',
      },
    );
  });

  it('Test multisig import wallet', async () => {
    const multiSigWallet3Of5 = { ...mockImportedWalletData };
    multiSigWallet3Of5.policyType = policyTypeOptions[1];
    multiSigWallet3Of5.signaturesNeeded = 3;
    multiSigWallet3Of5.numberOfXpubs = 5;
    multiSigWallet3Of5.keyDetails = fiveMultiSigKeyDetailsMock;

    mockElectron.ipcRenderer.on.mockResolvedValue(multiSigWallet3Of5);

    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    // simulate ipcRenderer.on sending the imported wallet to the WalletSignIn component
    act(() => {
      mockElectron.ipcRenderer.on.mock.calls[0][1](multiSigWallet3Of5);
    });

    const policyTypeSelect =
      await screen.findByPlaceholderText('Select policy type');

    // 5 key stores should now be showing
    const keyStoreOne = await screen.findByText('Keystore 1');
    const keyStoreTwo = await screen.findByText('Keystore 2');
    const keyStoreThree = await screen.findByText('Keystore 3');
    const keyStoreFour = await screen.findByText('Keystore 4');
    const keyStoreFive = await screen.findByText('Keystore 5');
    expect(keyStoreOne).toBeInTheDocument();
    expect(keyStoreTwo).toBeInTheDocument();
    expect(keyStoreThree).toBeInTheDocument();
    expect(keyStoreFour).toBeInTheDocument();
    expect(keyStoreFive).toBeInTheDocument();
    expect(policyTypeSelect).toHaveValue('Multi signature');

    // All key stores should be filled out
    for (let i = 0; i < 5; i++) {
      const xpub = await screen.findByText(fiveMultiSigKeyDetailsMock[i].xpub);

      const derivationPathInputs = screen.getAllByPlaceholderText(
        "m/86'/0'/0'",
      ) as HTMLInputElement[];
      const masterFingerPrintInputs = (await screen.findAllByPlaceholderText(
        '00000000',
      )) as HTMLInputElement[];

      expect(xpub).toBeInTheDocument();
      expect(derivationPathInputs[i]).toHaveValue(
        fiveMultiSigKeyDetailsMock[i].derivationPath,
      );

      expect(masterFingerPrintInputs[i]).toHaveValue(
        fiveMultiSigKeyDetailsMock[i].masterFingerprint,
      );
    }
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
        isCreateBatchTx: !!mockImportedWalletData?.isCreateBatchTx,
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
      xpubPlaceholder,
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

  it('Importing unchained config file works successfully', async () => {
    mockElectron.ipcRenderer.on.mockResolvedValue(unchainedConfigFileMock);

    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    // simulate ipcRenderer.on sending the imported wallet to the WalletSignIn component
    act(() => {
      mockElectron.ipcRenderer.on.mock.calls[0][1](unchainedConfigFileMock);
    });

    await waitFor(() => {
      const setupButton = screen.getByRole('button', { name: 'Connect' });
      expect(setupButton).toBeEnabled();
    });

    // Now confirm loaded wallet data is displayed

    const networkSelected = screen.getByText(
      unchainedConfigFileMock.network.toUpperCase(),
    );

    const policyTypeSelect =
      await screen.findByPlaceholderText('Select policy type');

    const scriptTypeSelected = screen.getByText('Legacy (P2SH)');

    const privateElectrumServer = screen.getByLabelText('Private electrum');
    const publicElectrumServer = screen.getByLabelText('Public electrum');

    const privateElectrumUrl = screen.getByPlaceholderText(
      'Enter electrum url',
    ) as HTMLInputElement;

    const publicElectrumUrl = screen.getByPlaceholderText(
      'Enter public electrum url',
    ) as HTMLInputElement;

    const keyStoreOne = screen.getByText('Keystore 1');
    const keyStoreTwo = screen.getByText('Keystore 2');
    const keyStoreThree = screen.getByText('Keystore 3');

    expect(policyTypeSelect).toHaveValue('Multi signature');

    expect(keyStoreOne).toBeInTheDocument();
    expect(keyStoreTwo).toBeInTheDocument();
    expect(keyStoreThree).toBeInTheDocument();
    expect(networkSelected).toBeInTheDocument();
    expect(scriptTypeSelected).toBeInTheDocument();

    for (let i = 0; i < 3; i++) {
      const xpub = await screen.findByText(
        unchainedConfigFileMock.extendedPublicKeys[i].xpub,
      );

      const derivationPathInputs = screen.getAllByPlaceholderText(
        "m/49'/0'/0'",
      ) as HTMLInputElement[];
      const masterFingerPrintInputs = (await screen.findAllByPlaceholderText(
        '00000000',
      )) as HTMLInputElement[];

      expect(xpub).toBeInTheDocument();
      expect(derivationPathInputs[i]).toHaveValue(
        unchainedConfigFileMock.extendedPublicKeys[i].bip32Path,
      );

      expect(masterFingerPrintInputs[i]).toHaveValue(
        unchainedConfigFileMock.extendedPublicKeys[i].xfp,
      );
    }
    expect(publicElectrumServer).toBeInTheDocument();
    expect(privateElectrumServer).toBeInTheDocument();
    expect(privateElectrumUrl.value).toBe('127.0.0.1:50000');
    expect(publicElectrumUrl.value).toBe('electrum.blockstream.info');

    let setupButton = screen.getByRole('button', { name: 'Connect' });
    expect(setupButton).toBeEnabled();

    const mockKeyStoreOne = unchainedConfigFileMock.extendedPublicKeys[0];
    const mockKeyStoreTwo = unchainedConfigFileMock.extendedPublicKeys[1];
    const mockKeyStoreThree = unchainedConfigFileMock.extendedPublicKeys[2];

    const mockDescriptor = `sh(sortedmulti(2,[${
      mockKeyStoreThree.xfp
    }${mockKeyStoreThree.bip32Path.replace('m', '')}]${
      mockKeyStoreThree.xpub
    }/0/*,[${mockKeyStoreTwo.xfp}${mockKeyStoreTwo.bip32Path.replace(
      'm',
      '',
    )}]${mockKeyStoreTwo.xpub}/0/*,[${
      mockKeyStoreOne.xfp
    }${mockKeyStoreOne.bip32Path.replace('m', '')}]${
      mockKeyStoreOne.xpub
    }/0/*))`;

    const mockChangeDescriptor = `sh(sortedmulti(2,[${
      mockKeyStoreThree.xfp
    }${mockKeyStoreThree.bip32Path.replace('m', '')}]${
      mockKeyStoreThree.xpub
    }/1/*,[${mockKeyStoreTwo.xfp}${mockKeyStoreTwo.bip32Path.replace(
      'm',
      '',
    )}]${mockKeyStoreTwo.xpub}/1/*,[${
      mockKeyStoreOne.xfp
    }${mockKeyStoreOne.bip32Path.replace('m', '')}]${
      mockKeyStoreOne.xpub
    }/1/*))`;

    fireEvent.click(setupButton);

    // Confirm loaded wallet data is sent to the backend
    await waitFor(() => {
      expect(initiateWalletSpy).toHaveBeenCalledWith(
        mockDescriptor,
        unchainedConfigFileMock.network.toUpperCase(),
        `127.0.0.1:50000`,
        100,
        mockChangeDescriptor,
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
      xpubPlaceholder,
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

  describe('Test loading wallet data from hardware wallet from keystore tabs', () => {
    // hardware wallet modal spys
    const closeModalSpy = jest.fn();
    let getConnectedHardwareWalletsSpy: jest.SpyInstance;
    let getXpubFromDeviceSpy: jest.SpyInstance;
    let setWalletPassphraseSpy: jest.SpyInstance;
    let unlockWalletSpy: jest.SpyInstance;
    let promptToUnlockWalletSpy: jest.SpyInstance;
    let closeHardwareWalletsSpy: jest.SpyInstance;
    const mockXpub = 'mockXpub';

    beforeEach(() => {
      // hardware wallet modal mocks

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
      promptToUnlockWalletSpy.mockResolvedValue({
        was_prompt_successful: true,
      });
      closeHardwareWalletsSpy = jest.spyOn(
        ApiClient,
        'closeAndRemoveHardwareWallets',
      );

      getConnectedHardwareWalletsSpy.mockResolvedValue({
        wallets: [mockHWNoPinNoPassphraseNeeded],
      });
    });

    afterEach(() => {
      getConnectedHardwareWalletsSpy.mockClear();
      getXpubFromDeviceSpy.mockClear();
      setWalletPassphraseSpy.mockClear();
      unlockWalletSpy.mockClear();
      promptToUnlockWalletSpy.mockClear();
      closeHardwareWalletsSpy.mockClear();
      closeModalSpy.mockClear();
    });

    it('Test loading wallet data from hardware wallet modal for two different keystores of a multisig policy', async () => {
      // start with a multisig policy wallet that is not filled out
      const multiSigWallet3Of5 = { ...mockImportedWalletData };
      multiSigWallet3Of5.policyType = policyTypeOptions[1];
      multiSigWallet3Of5.signaturesNeeded = 3;
      multiSigWallet3Of5.numberOfXpubs = 5;
      // empty key details so we can load them from a hardware wallet
      const emptyKeyDetail = {
        xpub: '',
        derivationPath: '',
        masterFingerprint: '',
      };
      multiSigWallet3Of5.keyDetails = [
        { ...emptyKeyDetail },
        { ...emptyKeyDetail },
        emptyKeyDetail,
      ];

      mockElectron.ipcRenderer.on.mockResolvedValue(multiSigWallet3Of5);

      const screen = render(
        <WrappedInAppWrappers>
          <WalletSignIn />
        </WrappedInAppWrappers>,
      );

      // simulate ipcRenderer.on sending the imported wallet to the WalletSignIn component
      act(() => {
        mockElectron.ipcRenderer.on.mock.calls[0][1](multiSigWallet3Of5);
      });

      let hardwareWalletButton = await screen.findByRole('button', {
        name: 'Import from hardware',
      });
      fireEvent.click(hardwareWalletButton);

      await fillOutHardwareWalletModal(
        screen,
        mockHWNoPinNoPassphraseNeeded.id,
        "m/49'/0'/0'",
      );

      // The hardware wallet modal should no longer be showing
      await waitFor(() => {
        let advanceButton = screen.queryByRole('button', {
          name: 'Advance',
        });
        expect(advanceButton).not.toBeInTheDocument();
      });

      // now all this data from the hardware wallet key should be showing in the form
      let derivationPathInputs = (await screen.findAllByPlaceholderText(
        "m/86'/0'/0'",
      )) as HTMLInputElement[];

      let masterFingerPrintSelected = (await screen.findAllByPlaceholderText(
        '00000000',
      )) as HTMLInputElement[];

      let xpubInput = screen.getAllByPlaceholderText(
        xpubPlaceholder,
      ) as HTMLInputElement[];
      // use 0 since we only did the hardware flow for the first keystore
      expect(derivationPathInputs[0].value).toBe("m/49'/0'/0'");
      expect(masterFingerPrintSelected[0].value).toBe('00000000');
      expect(xpubInput[0].value).toBe(mockXpub);

      // now click on the second keystore tab
      const keystoreTwo = await screen.findByText(/Keystore 2/);
      fireEvent.click(keystoreTwo);
      // Make sure we are starting with am empty xpub for the second keystore
      xpubInput = screen.getAllByPlaceholderText(
        xpubPlaceholder,
      ) as HTMLInputElement[];
      expect(xpubInput[1].value).toBe('');
      expect(xpubInput[1]).toBeVisible();
      // check that the first key store isn't visible anymore now that the second keystore tab is showing.
      expect(xpubInput[0]).not.toBeVisible();

      // mock that a different xpub and id will be returned
      // when we go through the hardware modal flow.
      getXpubFromDeviceSpy.mockResolvedValue({ xpub: 'mockXpub2' });
      getConnectedHardwareWalletsSpy.mockResolvedValue({
        wallets: [{ ...mockHWNoPinNoPassphraseNeeded, id: 'differentId' }],
      });

      // open the hardware wallet modal again
      hardwareWalletButton = await screen.findByRole('button', {
        name: 'Import from hardware',
      });
      fireEvent.click(hardwareWalletButton);

      await fillOutHardwareWalletModal(screen, 'differentId', "m/49'/1'/1'");

      // now all this data for this hardware wallet key should be showing in the form
      derivationPathInputs = (await screen.findAllByPlaceholderText(
        "m/86'/0'/0'",
      )) as HTMLInputElement[];

      masterFingerPrintSelected = (await screen.findAllByPlaceholderText(
        '00000000',
      )) as HTMLInputElement[];

      xpubInput = screen.getAllByPlaceholderText(
        xpubPlaceholder,
      ) as HTMLInputElement[];
      // use index 2 since we just did the hardware flow for the second keystore
      expect(derivationPathInputs[1].value).toBe("m/49'/1'/1'");
      expect(masterFingerPrintSelected[1].value).toBe('00000000');
      expect(xpubInput[1].value).toBe('mockXpub2');
    });
  });
});

const fillOutHardwareWalletModal = async (
  screen: any,
  hwwId: string,
  derivationPath: string,
) => {
  const scanButton = await screen.findByRole('button', { name: 'scan' });

  fireEvent.click(scanButton);

  // unlocked wallet
  const walletUnlockedTitle = await screen.findByText('Mock model');
  const selectedAccountNumber = await screen.findByText('Account #0');

  expect(walletUnlockedTitle).toBeInTheDocument();
  expect(selectedAccountNumber).toBeInTheDocument();

  // set derivation
  const showDerivationButton = await screen.findByRole('button', {
    name: 'Show derivation',
  });
  fireEvent.click(showDerivationButton);
  const derivationInput = await screen.findByTestId(`derivation-path-${hwwId}`);
  await waitFor(() => {
    expect(derivationInput).toBeVisible();
  });
  fireEvent.input(derivationInput, { target: { value: derivationPath } });

  // set account number
  const accountOptionOne = await screen.findByText('Account #1');
  fireEvent.click(accountOptionOne);
  // set network,2 of them one from modal one from form
  const bitcoinNetworks = await screen.findAllByText('BITCOIN');
  fireEvent.click(bitcoinNetworks[0]);

  // select unlocked wallet
  const unlockedWalletCheckbox = await screen.findByTestId(
    `hardware-walletcheckbox-${hwwId}`,
  );
  fireEvent.click(unlockedWalletCheckbox);

  // hit advance button
  let advanceButton = await screen.findByRole('button', {
    name: 'Advance',
  });
  expect(advanceButton).toBeEnabled();

  fireEvent.click(advanceButton);
};
