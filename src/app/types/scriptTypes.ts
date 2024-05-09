export type WalletTypes = 'P2WPKH' | 'P2SH' | 'P2PKH';

export enum ScriptTypes {
  P2WPKH = 'P2WPKH',
  P2PKH = 'P2PKH',
  P2SHP2WPKH = 'P2SHP2WPKH',
  P2TR = 'P2TR',
}

export const scriptTypeToDescriptorMap = {
  P2WPKH: 'wpkh',
  P2PKH: 'pkh',
  P2TR: 'tr',
  P2SHP2WPKH: 'sh(wpkh',
};
