import { Network } from '../types/network';
import { PolicyTypes } from '../types/policyTypes';
import { ScriptTypes } from '../types/scriptTypes';

export type NetworkTypeOption = {
  value: Network;
  label: Network;
};
export const networkOptions = [
  { value: Network.TESTNET, label: Network.TESTNET },
  { value: Network.REGTEST, label: Network.REGTEST },
  { value: Network.BITCOIN, label: Network.BITCOIN },
];

export type ScriptTypeOption = {
  value: ScriptTypes;
  label: string;
};
export const scriptTypeOptions: ScriptTypeOption[] = [
  { value: ScriptTypes.P2WPKH, label: 'Native Segwit (P2WPKH)' },
  { value: ScriptTypes.P2PKH, label: 'Legacy (P2PKH)' },
  { value: ScriptTypes.P2SHP2WPKH, label: 'Nested Segwit (P2SH-P2WPKH)' },
  { value: ScriptTypes.P2TR, label: 'Taproot (P2TR)' },
  { value: ScriptTypes.P2SH, label: 'Legacy (P2SH)' },
  { value: ScriptTypes.P2SHP2WSH, label: 'Nested Segwit (P2SH-P2WSH)' },
  { value: ScriptTypes.P2WSH, label: 'Native Segwit (P2WSH)' },
];

export const singleSigScriptTypeOptions: ScriptTypeOption[] = [
  { value: ScriptTypes.P2PKH, label: 'Legacy (P2PKH)' },
  { value: ScriptTypes.P2SHP2WPKH, label: 'Nested Segwit (P2SH-P2WPKH)' },
  { value: ScriptTypes.P2WPKH, label: 'Native Segwit (P2WPKH)' },
  { value: ScriptTypes.P2TR, label: 'Taproot (P2TR)' },
];

export const multiSigScriptTypeOptions: ScriptTypeOption[] = [
  { value: ScriptTypes.P2SH, label: 'Legacy (P2SH)' },
  { value: ScriptTypes.P2SHP2WSH, label: 'Nested Segwit (P2SH-P2WSH)' },
  { value: ScriptTypes.P2WSH, label: 'Native Segwit (P2WSH)' },
];

export type AccountTypeOption = {
  label: string;
  value: string;
};

export type PolicyTypeOption = {
  value: PolicyTypes;
  label: PolicyTypes;
};
export const policyTypeOptions = [
  { value: PolicyTypes.SINGLE_SIGNATURE, label: PolicyTypes.SINGLE_SIGNATURE },
  { value: PolicyTypes.MULTI_SIGNATURE, label: PolicyTypes.MULTI_SIGNATURE },
];
