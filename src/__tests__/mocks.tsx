import { ScaleOption } from '../app/pages/Home';
import { BtcMetric } from '../app/types/btcSatHandler';
import { Network } from '../app/types/network';
import { ScriptTypes } from '../app/types/scriptTypes';
import { Wallet } from '../app/types/wallet';

describe('Mocks', () => {
  it('mock true', () => {
    expect(true).toBeTruthy();
  });
});
export const mockImportedWalletData: Wallet = {
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
    [1, 'rgb(299, 200, 200)'],
    [20, 'rgb(199, 100, 100)'],
  ],
  feeScale: { value: '10000', label: '10,000' } as ScaleOption,
  minFeeScale: { value: '100', label: '100' } as ScaleOption,
  feeRate: '20',
};

export const mockImportedWalletDataWithoutConfigs: Wallet = {
  ...mockImportedWalletData,
  btcMetric: undefined,
  feeRateColorMapValues: undefined,
  feeScale: undefined,
  minFeeScale: undefined,
  feeRate: undefined,
};
