from bitcoinlib.transactions import Transaction
from src.my_types import (
    FeeDetails,
)
import json
import bdkpython as bdk

tx_out_mock = bdk.TxOut(value=1000, script_pubkey="mock_script_pubkey")

outpoint_mock = bdk.OutPoint(txid="txid", vout=0)

transaction_details_mock = bdk.TransactionDetails(
    transaction="mock transaction",
    txid="mock_txid",
    received=1000,
    sent=0,
    fee=100,
    confirmation_time=None,
)

local_utxo_mock = bdk.LocalUtxo(
    outpoint=outpoint_mock, txout=tx_out_mock, keychain="mock_keychain", is_spent=False
)


fee_details_mock = FeeDetails(percent_fee_is_of_utxo=0.1, fee=100)


mock_electrum_get_transactions_response = {
    "id": 7,
    "jsonrpc": "2.0",
    "result": "02000000000101b0d9cd7e4b900ef0ab43c5a215d6a523a4a422e8a19de488cf948bf797ba31260000000000feffffff0249138727010000001600141c96f2fd3abc46a6161500fed55765a32e31a6d32ade7e020000000016001405de346b6fd81b848f5be779e0b59e26283279400247304402206b89fefa04aa1a132b166c098c8b597974492532ac6162b7561d514ddea12b1d02207d9f3444a00429ea9c935ff4f4eb9a31d641e2df1c0cbff3c55be5ed13731b200121028a993097d51522ee09207cbf299fcadfebb6fe7889348aab99d4f25eff40d9b66c000000",
}
mock_electrum_get_transactions_response_json = json.dumps(
    mock_electrum_get_transactions_response
)
mock_electrum_get_transactions_response_parsed = Transaction.parse(
    mock_electrum_get_transactions_response["result"], strict=True
)


all_transactions_mock = [
    Transaction.parse(mock_electrum_get_transactions_response["result"], strict=True)
]
