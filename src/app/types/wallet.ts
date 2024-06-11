import { FeeRateColor, ScaleOption } from '../pages/Home';
import { BtcMetric } from './btcSatHandler';
import { Network } from './network';
import { ScriptTypes } from './scriptTypes';

export type Wallet = {
  defaultDescriptor: string;
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
};

export type WalletConfigs = {
  btcMetric?: BtcMetric;
  feeRateColorMapValues?: FeeRateColor[];
  feeScale?: ScaleOption;
  minFeeScale?: ScaleOption;
  feeRate?: string | number;
};
