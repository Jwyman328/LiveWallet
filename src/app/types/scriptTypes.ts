export type WalletTypes = 'P2WPKH' | 'P2SH' | 'P2PKH';

export enum ScriptTypes {
  P2WPKH = 'P2WPKH',
  P2PKH = 'P2PKH',
  P2WSH = 'P2WSH',
  P2TR = 'P2TR',
}

export const scriptTypeToDescriptorMap = {
  P2WPKH: 'wpkh',
  P2PKH: 'pkh',
  P2TR: 'tr',
  P2WSH: 'sh(wpkh',
};

export const descriptorTypeToScriptType = {
  wpkh: ScriptTypes.P2WPKH,
  pkh: ScriptTypes.P2PKH,
  tr: ScriptTypes.P2TR,
  'sh(wpkh': ScriptTypes.P2WSH,
};
