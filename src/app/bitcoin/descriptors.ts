import { PolicyTypes } from '../types/policyTypes';
import { ScriptTypes, scriptTypeToDescriptorMap } from '../types/scriptTypes';
import { KeyDetails, UnchainedWalletConfig } from '../types/wallet';

// TODO write unit tests for these functions

type Descriptors = {
  descriptor: string;
  changeDescriptor: string;
};

// Create singlesig or multisig descriptors
export const generateDescriptor = (
  scriptType: ScriptTypes,
  policyType: PolicyTypes,
  keyDetails: KeyDetails[],
  signaturesNeeded: number,
): Descriptors => {
  // take the inputs from the various fields and create a descriptor
  let scriptTypeDescription = scriptTypeToDescriptorMap[scriptType];

  const isNestedSegWit =
    scriptTypeDescription === scriptTypeToDescriptorMap.P2SHP2WPKH ||
    scriptTypeDescription === scriptTypeToDescriptorMap.P2SHP2WSH;
  const closingParam = isNestedSegWit ? '))' : ')';

  if (policyType === PolicyTypes.SINGLE_SIGNATURE) {
    const xpub = keyDetails[0].xpub;
    const derivationPath = keyDetails[0].derivationPath;
    const masterFingerPrint = keyDetails[0].masterFingerprint;

    let derivationWithoutPrefix = derivationPath.replace(/^m\//, '');

    const computedDescriptor = `${scriptTypeDescription}([${masterFingerPrint}/${derivationWithoutPrefix}]${xpub}/0/*${closingParam}`;

    return {
      descriptor: computedDescriptor,
      changeDescriptor: undefined,
    };
  }

  if (policyType === PolicyTypes.MULTI_SIGNATURE) {
    const sortedMultiParts = keyDetails
      .map((key) => {
        return `[${key.masterFingerprint}${key.derivationPath}]${key.xpub}/0/*`.replace(
          /m\//,
          '/',
        );
      })
      .reverse()
      .join(',');

    const sortedMultiPartsChange = keyDetails
      .map((key) => {
        return `[${key.masterFingerprint}${key.derivationPath}]${key.xpub}/1/*`.replace(
          /m\//,
          '/',
        );
      })
      .reverse()
      .join(',');

    const multisigDescriptor = `${scriptTypeDescription}(sortedmulti(${signaturesNeeded},${sortedMultiParts})${closingParam}`;
    const multisigChangeDescriptor = `${scriptTypeDescription}(sortedmulti(${signaturesNeeded},${sortedMultiPartsChange})${closingParam}`;

    return {
      descriptor: multisigDescriptor,
      changeDescriptor: multisigChangeDescriptor,
    };
  }
};

type UnchainedDescriptors = {
  unchainedDescriptor: string;
  unchainedChangeDescriptor: string;
};
export const generateDescriptorFromUnchainedWalletConfig = (
  walletData: UnchainedWalletConfig,
): UnchainedDescriptors => {
  const { quorum, extendedPublicKeys } = walletData;
  const sortedMultiParts = extendedPublicKeys
    .map((key) => {
      return `[${key.xfp}${key.bip32Path}]${key.xpub}/0/*`.replace(/m\//, '/');
    })
    .reverse()
    .join(',');

  const sortedMultiPartsChange = extendedPublicKeys
    .map((key) => {
      return `[${key.xfp}${key.bip32Path}]${key.xpub}/1/*`.replace(/m\//, '/');
    })
    .reverse()
    .join(',');

  return {
    unchainedDescriptor: `sh(sortedmulti(${quorum.requiredSigners},${sortedMultiParts}))`,
    unchainedChangeDescriptor: `sh(sortedmulti(${quorum.requiredSigners},${sortedMultiPartsChange}))`,
  };
};
