import { ScaleOption } from '../app/pages/Home';
import { BtcMetric } from '../app/types/btcSatHandler';
import { Network } from '../app/types/network';
import { ScriptTypes } from '../app/types/scriptTypes';
import { Wallet } from '../app/types/wallet';

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
    [1, 'green'],
    [20, 'yellow'],
  ],
  feeScale: { value: '200', label: '200' } as ScaleOption,
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
