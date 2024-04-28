from src.types.bdk_types import (
    LocalUtxoType,
    TxOutType,
    OutpointType,
    TransactionDetailsType,
    FeeDetails,
)

tx_out_mock = TxOutType(value=1000, script_pubkey="mock_script_pubkey")

outpoint_mock = OutpointType(txid="txid", vout=0)

transaction_details_mock = TransactionDetailsType(
    transaction="mock transaction",
    txid="mock_txid",
    received=1000,
    sent=0,
    fee=100,
    confirmation_time=None,
)

local_utxo_mock = LocalUtxoType(
    outpoint=outpoint_mock, txout=tx_out_mock, keychain="mock_keychain", is_spent=False
)


fee_details_mock = FeeDetails(percent_fee_is_of_utxo=0.1, fee=100)
