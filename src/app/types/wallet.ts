import { FeeRateColor, ScaleOption } from '../pages/Home';
import { BtcMetric } from './btcSatHandler';
import { Network } from './network';
import { ScriptTypes } from './scriptTypes';

export type Wallet = {
  defaultDescriptor: string;
  defaultChangeDescriptor?: string;
  defaultMasterFingerprint: string;
  defaultDerivationPath: string;
  defaultXpub: string;
  defaultElectrumServerUrl: string;
  backendServerBaseUrl: string;
  defaultNetwork: Network;
  defaultScriptType: ScriptTypes;
  isUsingPublicServer: boolean;
  privateElectrumUrl: string;
  publicElectrumUrl: string;
  btcMetric?: BtcMetric;
  feeRateColorMapValues?: FeeRateColor[];
  feeScale?: ScaleOption;
  minFeeScale?: ScaleOption;
  feeRate?: string | number;
  type?: 'LIVE_WALLET' | 'UNCHAINED'; //TODO do I need this?
};

export type WalletConfigs = {
  btcMetric?: BtcMetric;
  feeRateColorMapValues?: FeeRateColor[];
  feeScale?: ScaleOption;
  minFeeScale?: ScaleOption;
  feeRate?: string | number;
};

interface Quorum {
  requiredSigners: number;
  totalSigners: number;
}

interface UnchainedExtendedPublicKey {
  name: string;
  xpub: string;
  bip32Path: string;
  xfp: string;
}

interface UnchainedClient {
  type: string;
  url: string;
  username: string;
  walletName: string;
}

export type UnchainedWalletConfig = {
  name: string;
  uuid: string;
  addressType: string;
  network: string;
  quorum: Quorum;
  startingAddressIndex: number;
  extendedPublicKeys: UnchainedExtendedPublicKey[];
  client: UnchainedClient;
  ledgerPolicyHmacs: any[];
};
