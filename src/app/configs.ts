import { Network } from './types/network';
import { ScriptTypes } from './types/scriptTypes';

// treat test environment like production
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
export const configs = {
  defaultDescriptor: isProduction
    ? ''
    : 'wpkh(tprv8ZgxMBicQKsPcx5nBGsR63Pe8KnRUqmbJNENAfGftF3yuXoMMoVJJcYeUw5eVkm9WBPjWYt6HMWYJNesB5HaNVBaFc1M6dRjWSYnmewUMYy/84h/0h/0h/0/*)',
  defaultMasterFingerprint: isProduction ? '00000000' : '34b00776',
  defaultDerivationPath: isProduction ? '' : "m/84'/0'/0'",
  defaultXpub: isProduction
    ? ''
    : 'tpubDD9A9r18sJyyMPGaEMp1LMkv4cy43Kmb7kuP6kcdrMmuDvj7oxLrMe8Bk6pCvPihgddJmJ8GU3WLPgCCYXu2HZ2JAgMH5dbP1zvZm7QzcPt',
  defaultElectrumServerUrl: isProduction
    ? '127.0.0.1:50000'
    : '127.0.0.1:50000',
  backendServerBaseUrl: 'http://localhost:5011',
  defaultNetwork: Network.REGTEST,
  defaultScriptType: ScriptTypes.P2WPKH,
};
