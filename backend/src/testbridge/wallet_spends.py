import bdkpython as bdk
from src.services.wallet.raw_output_script_examples import (
    p2sh_raw_output_script,
)

import structlog


LOGGER = structlog.get_logger()


def create_and_broadcast_transaction_for_bdk_wallet(
    wallet: bdk.Wallet,
    blockchain: bdk.Blockchain,
    amount: int = 50000,
    sats_per_vbyte: int = 10,
    raw_output_script: str = p2sh_raw_output_script,
):
    "Create, sign and broadcast a transaction for the given bdk wallet"
    tx_builder = bdk.TxBuilder()

    utxos = wallet.list_unspent()
    # I have no idea how to not select the utxos manually
    # therefore just use all the utxos for now.
    outpoints = [utxo.outpoint for utxo in utxos]
    tx_builder = tx_builder.add_utxos(outpoints)

    tx_builder = tx_builder.fee_rate(sats_per_vbyte)
    binary_script = bytes.fromhex(raw_output_script)

    script = bdk.Script(binary_script)

    tx_builder = tx_builder.add_recipient(script, amount)

    built_transaction: bdk.TxBuilderResult = tx_builder.finish(wallet)
    signed = wallet.sign(built_transaction.psbt, sign_options=None)
    if signed:
        transaction = built_transaction.psbt.extract_tx()
        LOGGER.info(f"broadcasting {built_transaction.transaction_details}")
        blockchain.broadcast(transaction)
    else:
        LOGGER.error(
            "Failed to sign the transaction, therefore it can not be broadcast"
        )
