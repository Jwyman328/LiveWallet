import { GetBTCPriceResponseType } from '../app/api/types';
import { policyTypeOptions } from '../app/components/formOptions';
import { ScaleOption } from '../app/pages/Home';
import { BtcMetric } from '../app/types/btcSatHandler';
import { Network } from '../app/types/network';
import { ScriptTypes } from '../app/types/scriptTypes';
import { UnchainedWalletConfig, Wallet } from '../app/types/wallet';

describe('Mocks', () => {
  it('mock true', () => {
    expect(true).toBeTruthy();
  });
});
const signleSigKeyDetailsMock = {
  xpub: 'mockXpub',
  derivationPath: "m/44'/0'/0'",
  masterFingerprint: '11111111',
};
export const fiveMultiSigKeyDetailsMock = [
  {
    xpub: 'mockXpub1',
    derivationPath: "m/44'/1'/0'",
    masterFingerprint: '11111111',
  },
  {
    xpub: 'mockXpub2',
    derivationPath: "m/44'/2'/0'",
    masterFingerprint: '22222222',
  },
  {
    xpub: 'mockXpub3',
    derivationPath: "m/44'/3'/0'",
    masterFingerprint: '33333333',
  },
  {
    xpub: 'mockXpub4',
    derivationPath: "m/44'/4'/0'",
    masterFingerprint: '44444444',
  },
  {
    xpub: 'mockXpub5',
    derivationPath: "m/44'/5'/0'",
    masterFingerprint: '55555555',
  },
];
export const mockImportedWalletData: Wallet = {
  //single sig
  policyType: policyTypeOptions[0],
  signaturesNeeded: 1,
  numberOfXpubs: 1,
  defaultDescriptor: 'mockDefaultDescriptor',
  keyDetails: [signleSigKeyDetailsMock],
  defaultElectrumServerUrl: 'mockElectrumServer',
  backendServerBaseUrl: 'mockBackendServer',
  defaultNetwork: Network.BITCOIN,
  defaultScriptType: ScriptTypes.P2TR,
  isUsingPublicServer: true,
  privateElectrumUrl: 'mockPrivateElectrum',
  publicElectrumUrl: 'bitcoin.aranguren.org',

  btcMetric: BtcMetric.BTC,
  feeRateColorMapValues: [
    [1, 'rgb(299, 200, 200)'],
    [20, 'rgb(199, 100, 100)'],
  ],
  feeScale: { value: '10000', label: '10,000' } as ScaleOption,
  minFeeScale: { value: '100', label: '100' } as ScaleOption,
  feeRate: '20',
};

export const unchainedConfigFileMock: UnchainedWalletConfig = {
  name: 'Mock name',
  uuid: 'mockUuid',
  addressType: 'P2SH',
  network: 'regtest',
  quorum: {
    requiredSigners: 2,
    totalSigners: 3,
  },
  startingAddressIndex: 0,
  extendedPublicKeys: [
    {
      name: 'Unchained',
      xpub: 'mockXpub',
      bip32Path: 'm/0/0/0/0',
      xfp: '12345678',
    },
    {
      name: 'mock name 2',
      xpub: 'mockXpub2',
      bip32Path: "m/45'/2'/12'/3",
      xfp: '87654321',
    },
    {
      name: 'mock name 3',
      xpub: 'mockXpub3',
      bip32Path: "m/45'/4'/1'/9",
      xfp: '12348765',
    },
  ],
  client: {
    type: 'public',
    url: '',
    username: 'username',
    walletName: 'fake wallet',
  },
  ledgerPolicyHmacs: [],
};

export const mockImportedWalletDataWithoutConfigs: Wallet = {
  ...mockImportedWalletData,
  btcMetric: undefined,
  feeRateColorMapValues: undefined,
  feeScale: undefined,
  minFeeScale: undefined,
  feeRate: undefined,
};

export const mockHWNoPinNoPassphraseNeeded = {
  id: 'mockId',
  path: 'mockPath',
  label: 'Mock-Label',
  type: 'Mock type',
  model: 'Mock model',
  needs_pin_sent: false,
  needs_passphrase_sent: false,
  fingerprint: 'mock finger print',
};

export const mockHWPinNeeded = {
  id: 'mockId2',
  path: 'mockPath2',
  label: 'Mock-Label2',
  type: 'Mock type2',
  model: 'Mock model2',
  needs_pin_sent: true,
  needs_passphrase_sent: false,
  fingerprint: 'mock finger print2',
};

export const mockTrezorPinAndPassNeeded = {
  id: 'mockTrezor',
  path: 'mockTrezor',
  label: 'Mock-TrezorLabel',
  type: 'trezor',
  model: 'Mock model trezor',
  needs_pin_sent: true,
  needs_passphrase_sent: true,
  fingerprint: 'trezor fp',
};

export const mockHWPassphraseNeeded = {
  id: 'mockId3',
  path: 'mockPath3',
  label: 'Mock-Label3',
  type: 'Mock type3',
  model: 'Mock model3',
  needs_pin_sent: false,
  needs_passphrase_sent: true,
  fingerprint: 'mock finger print3',
};

export const mockGetBtcPriceResponse: GetBTCPriceResponseType = {
  time: 1703252411,
  USD: 100000,
  EUR: 40545,
  GBP: 37528,
  CAD: 58123,
  CHF: 37438,
  AUD: 64499,
  JPY: 6218915,
};
