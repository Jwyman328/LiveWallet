// Most of this code was cloned from
// https://github.com/jlopp/bitcoin-transaction-size-calculator

import { ScriptTypes } from '../types/scriptTypes';

const P2PKH_IN_SIZE = 148;
const P2PKH_OUT_SIZE = 34;

const P2SH_OUT_SIZE = 32;
const P2SH_P2WPKH_OUT_SIZE = 32;
const P2SH_P2WSH_OUT_SIZE = 32;

// All segwit input sizes are reduced by 1 WU to account for the witness item counts being added for every input per the transaction header
const P2SH_P2WPKH_IN_SIZE = 90.75;

const P2WPKH_IN_SIZE = 67.75;
const P2WPKH_OUT_SIZE = 31;

const P2WSH_OUT_SIZE = 43;
const P2TR_OUT_SIZE = 43;

const P2TR_IN_SIZE = 57.25;

const PUBKEY_SIZE = 33;
const SIGNATURE_SIZE = 72;

const INPUT_TXID_SIZE = 32;
const INPUT_VOUT_SIZE = 4;
const INPUT_SEQUENCE_SIZE = 4;

const SEGWIT_INPUT_DISCOUNT = 4;
const HEADER_VERSION_SIZE = 4;
const HEADER_LOCKTIME_SIZE = 4;

const ONE_BYTE_MAX_SIZE = 0xff;
const TWO_BYTE_MAX_SIZE = 0xffff;
const FOUR_BYTE_MAX_SIZE = 0xffffffff;

const P2WPKH_INPUT_WITNESS_SIZE = 107; // size(signature) + signature + size(pubkey) + pubkey

const P2TR_INPUT_WITNESS_SIZE = 65; // getSizeOfVarInt(schnorrSignature) + schnorrSignature;

function getSizeOfScriptLengthElement(length: number) {
  if (length < 75) {
    return 1;
  } else if (length <= ONE_BYTE_MAX_SIZE) {
    return 2;
  } else if (length <= TWO_BYTE_MAX_SIZE) {
    return 3;
  } else if (length <= FOUR_BYTE_MAX_SIZE) {
    return 5;
  } else {
    alert('Size of redeem script is too large');
  }
}

function getSizeOfVarInt(length: number) {
  if (length < 253) {
    return 1;
  } else if (length < TWO_BYTE_MAX_SIZE) {
    return 3;
  } else if (length < FOUR_BYTE_MAX_SIZE) {
    return 5;
  } else if (length < 18446744073709551615) {
    return 9;
  } else {
    alert('Invalid var int');
  }
}

function getWitnessVbytes(input_script: ScriptTypes, input_count: number) {
  if (input_script == 'P2PKH' || input_script == 'P2SH') {
    var witness_vbytes = 0;
  } else {
    // Transactions with segwit inputs have extra overhead
    var witness_vbytes =
      0.25 + // segwit marker
      0.25 + // segwit flag
      input_count / SEGWIT_INPUT_DISCOUNT; // witness element count per input
  }

  return witness_vbytes;
}

function getTxOverheadVBytes(
  input_script: ScriptTypes,
  input_count: number,
  output_count: number,
) {
  return (
    HEADER_VERSION_SIZE + // nVersion
    getSizeOfVarInt(input_count) + // number of inputs
    getSizeOfVarInt(output_count) + // number of outputs
    HEADER_LOCKTIME_SIZE + // nLockTime
    getWitnessVbytes(input_script, input_count)
  );
}

function getTxOverheadExtraRawBytes(
  input_script: ScriptTypes,
  input_count: number,
) {
  // Returns the remaining 3/4 bytes per witness bytes
  return getWitnessVbytes(input_script, input_count) * 3;
}

function getRedeemScriptSize(input_n: number) {
  return (
    1 + // OP_M
    input_n * (1 + PUBKEY_SIZE) + // OP_PUSH33 <pubkey>
    1 + // OP_N
    1
  ); // OP_CHECKMULTISIG
}

function getScriptSignatureSize(input_m: number, redeemScriptSize: number) {
  return (
    1 + // size(0)
    input_m * (1 + SIGNATURE_SIZE) + // size(SIGNATURE_SIZE) + signature
    getSizeOfScriptLengthElement(redeemScriptSize) +
    redeemScriptSize
  );
}

export function createTxFeeEstimate(
  input_count: number,
  input_script: ScriptTypes,
  input_m: number,
  input_n: number,
  output_count: number,
) {
  // In most cases the input size is predictable. For multisig inputs we need to perform a detailed calculation
  var inputSize = 0; // in virtual bytes
  var inputWitnessSize = 0;
  switch (input_script) {
    case 'P2PKH':
      inputSize = P2PKH_IN_SIZE;
      break;
    case 'P2SHP2WPKH':
      inputSize = P2SH_P2WPKH_IN_SIZE;
      inputWitnessSize = P2WPKH_INPUT_WITNESS_SIZE; // size(signature) + signature + size(pubkey) + pubkey
      break;
    case 'P2WPKH':
      inputSize = P2WPKH_IN_SIZE;
      inputWitnessSize = P2WPKH_INPUT_WITNESS_SIZE; // size(signature) + signature + size(pubkey) + pubkey
      break;
    case 'P2TR': // Only consider the cooperative taproot signing path; assume multisig is done via aggregate signatures
      inputSize = P2TR_IN_SIZE;
      inputWitnessSize = P2TR_INPUT_WITNESS_SIZE; // getSizeOfVarInt(schnorrSignature) + schnorrSignature;
      break;
    case 'P2SH':
      var redeemScriptSize = getRedeemScriptSize(input_n);
      var scriptSigSize = getScriptSignatureSize(input_m, redeemScriptSize);
      inputSize =
        INPUT_TXID_SIZE +
        INPUT_VOUT_SIZE +
        getSizeOfVarInt(scriptSigSize) +
        scriptSigSize +
        INPUT_SEQUENCE_SIZE;
      break;
    case 'P2SHP2WSH':
    case 'P2WSH':
      var redeemScriptSize = getRedeemScriptSize(input_n);
      inputWitnessSize = getScriptSignatureSize(input_m, redeemScriptSize);
      inputSize =
        INPUT_TXID_SIZE + // outpoint (spent UTXO ID)
        INPUT_VOUT_SIZE +
        inputWitnessSize / SEGWIT_INPUT_DISCOUNT + // witness program
        INPUT_SEQUENCE_SIZE; // nSequence
      if (input_script == 'P2SHP2WSH') {
        inputSize += INPUT_TXID_SIZE + 3; // P2SH wrapper (redeemscript hash) + overhead?
      }
  }
  //  since we aren't allowing choosing outputs
  //  we don't know how many bytes we should use for the output
  //  therefore pick one between the smallest 32 and the largest 43
  const AVG_OUTPUT_SIZE = 37;
  var txVBytes =
    getTxOverheadVBytes(input_script, input_count, output_count) +
    inputSize * input_count +
    AVG_OUTPUT_SIZE * output_count;

  txVBytes = Math.ceil(txVBytes);

  var txBytes =
    getTxOverheadExtraRawBytes(input_script, input_count) +
    txVBytes +
    (inputWitnessSize * input_count * 3) / 4;
  var txWeight = txVBytes * 4;

  // return { txBytes, txVBytes, txWeight };
  return txVBytes;
}
