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

export const getScriptTypeFromDerivationPath = (derivationPath: string) => {
  const pattern = /m\/(?<number>\d+)'\/?/;

  const match = derivationPath.match(pattern);

  if (match && match.groups) {
    const scriptTypeNumber = match.groups['number'];

    switch (scriptTypeNumber) {
      case '44':
        return ScriptTypes.P2PKH;
      case '49':
        return ScriptTypes.P2WSH;
      case '84':
        return ScriptTypes.P2WPKH;
      case '86':
        return ScriptTypes.P2TR;
      default:
        return null;
    }
  } else {
    return null;
  }
};
