export type WalletTypes = 'P2WPKH' | 'P2SH' | 'P2PKH';

export enum SingleSigScriptTypes {
  P2WPKH = 'P2WPKH',
  P2PKH = 'P2PKH',
  P2SHP2WPKH = 'P2SHP2WPKH',
  P2TR = 'P2TR',
}

export enum MultiSigScriptTypes {
  P2SH = 'P2SH',
  P2WSH = 'P2WSH',
  P2SHP2WSH = 'P2SHP2WSH',
}
export enum ScriptTypes {
  P2WPKH = 'P2WPKH',
  P2PKH = 'P2PKH',
  P2SHP2WPKH = 'P2SHP2WPKH',
  P2TR = 'P2TR',
  P2SH = 'P2SH',
  P2WSH = 'P2WSH',
  P2SHP2WSH = 'P2SHP2WSH',
}

export const scriptTypeToDescriptorMap = {
  P2PKH: 'pkh',
  P2SHP2WPKH: 'sh(wpkh',
  P2WPKH: 'wpkh',
  P2TR: 'tr',
  P2SH: 'sh',
  P2SHP2WSH: 'sh(wsh',
  P2WSH: 'wsh',
};

export const descriptorTypeToScriptType = {
  wpkh: ScriptTypes.P2WPKH,
  pkh: ScriptTypes.P2PKH,
  tr: ScriptTypes.P2TR,
  'sh(wpkh': ScriptTypes.P2SHP2WPKH,
  sh: ScriptTypes.P2SH,
  wsh: ScriptTypes.P2WSH,
  'sh(wsh': ScriptTypes.P2SHP2WSH,
};

export const getScriptTypeFromDerivationPath = (derivationPath: string) => {
  const pattern = /m\/(?<number>\d+)'\/?/;

  const match = derivationPath.match(pattern);

  if (match && match.groups) {
    const scriptTypeNumber = match.groups['number'];

    switch (scriptTypeNumber) {
      case '44':
        return ScriptTypes.P2PKH;
      case '48':
        return ScriptTypes.P2WSH;
      case '49':
        return ScriptTypes.P2SHP2WPKH;
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

export const getDerivationPathFromScriptType = (scriptType: ScriptTypes) => {
  switch (scriptType) {
    case ScriptTypes.P2PKH:
      return "m/44'/0'/0'";
    case ScriptTypes.P2WSH:
      return "m/48'/0'/0'";
    case ScriptTypes.P2SHP2WSH:
      return "m/49'/0'/0'";
    case ScriptTypes.P2WPKH:
      return "m/84'/0'/0'";
    case ScriptTypes.P2TR:
      return "m/86'/0'/0'";
    case ScriptTypes.P2SH:
      return "m/49'/0'/0'";
    case ScriptTypes.P2SHP2WPKH:
      return "m/49'/1'/0'";
  }
};
