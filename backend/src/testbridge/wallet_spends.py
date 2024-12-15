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


def create_and_broadcast_coinjoin_for_bdk_wallet(
    wallet: bdk.Wallet,
    blockchain: bdk.Blockchain,
    amount: int = 50000,
    sats_per_vbyte: int = 10,
    raw_output_scripts: list[str] = [p2sh_raw_output_script],
):
    """Create, sign and broadcast a coinjoin like transaction for the given bdk wallet

    Send an equal amount to each of the given raw_output_scripts which will represent
    wallets other than the user's wallet.

    Send an equal amount to the user's wallet 3 times (hard coded below)
    TODO make it so you can dynamically specificy how many equal outputs the user should have.

    FYI there will also be a change output that is not of equal value to a change address
    for the user's wallet.
    """
    wallets_address_1 = wallet.get_address(bdk.AddressIndex.LAST_UNUSED())

    user_wallet_script_1: bdk.Payload = wallets_address_1.address.script_pubkey()

    wallets_address_2 = wallet.get_address(bdk.AddressIndex.LAST_UNUSED())

    user_wallet_script_2: bdk.Payload = wallets_address_2.address.script_pubkey()

    wallets_address_3 = wallet.get_address(bdk.AddressIndex.LAST_UNUSED())

    user_wallet_script_3: bdk.Payload = wallets_address_3.address.script_pubkey()

    tx_builder = bdk.TxBuilder()

    utxos = wallet.list_unspent()
    # I have no idea how to not select the utxos manually
    # therefore just use all the utxos for now.
    outpoints = [utxo.outpoint for utxo in utxos]
    tx_builder = tx_builder.add_utxos(outpoints)

    tx_builder = tx_builder.fee_rate(sats_per_vbyte)

    for raw_output_script in raw_output_scripts:
        binary_script = bytes.fromhex(raw_output_script)
        script = bdk.Script(binary_script)
        tx_builder = tx_builder.add_recipient(script, amount)

    tx_builder = tx_builder.add_recipient(user_wallet_script_1, amount)
    tx_builder = tx_builder.add_recipient(user_wallet_script_2, amount)
    tx_builder = tx_builder.add_recipient(user_wallet_script_3, amount)

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
