import { Network } from '../types/network';
import { ScriptTypes } from '../types/scriptTypes';

export const networkOptions = [
  { value: Network.TESTNET, label: Network.TESTNET },
  { value: Network.REGTEST, label: Network.REGTEST },
  { value: Network.BITCOIN, label: Network.BITCOIN },
];

export const scriptTypeOptions = [
  { value: ScriptTypes.P2WPKH, label: 'Native Segwit (P2WPKH)' },
  { value: ScriptTypes.P2PKH, label: 'Legacy (P2PKH)' },
  { value: ScriptTypes.P2WSH, label: 'Nested Segwit (P2SH-P2WPKH)' },
  { value: ScriptTypes.P2TR, label: 'Taproot (P2TR)' },
];
