import { PolicyTypeOption } from '../components/formOptions';
import { FeeRateColor, ScaleOption } from '../pages/Home';
import { BtcMetric } from './btcSatHandler';
import { Network } from './network';
import { ScriptTypes } from './scriptTypes';

export type Wallet = {
  policyType: PolicyTypeOption;
  signaturesNeeded: number;
  numberOfXpubs: number;
  keyDetails: MultiSigWalletData[];
  defaultDescriptor: string;
  defaultChangeDescriptor?: string;
  defaultScriptType: ScriptTypes;
  defaultElectrumServerUrl: string;
  backendServerBaseUrl: string;
  defaultNetwork: Network;
  isUsingPublicServer: boolean;
  privateElectrumUrl: string;
  publicElectrumUrl: string;
  btcMetric?: BtcMetric;
  isCreateBatchTx?: boolean;
  feeRateColorMapValues?: FeeRateColor[];
  feeScale?: ScaleOption;
  minFeeScale?: ScaleOption;
  feeRate?: string | number;
};

export type WalletConfigs = {
  btcMetric?: BtcMetric;
  feeRateColorMapValues?: FeeRateColor[];
  feeScale?: ScaleOption;
  minFeeScale?: ScaleOption;
  feeRate?: string | number;
  isCreateBatchTx?: boolean;
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

export type MultiSigWalletData = {
  xpub: string;
  derivationPath: string;
  masterFingerprint: string;
};
