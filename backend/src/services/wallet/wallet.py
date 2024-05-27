from dataclasses import dataclass
import bdkpython as bdk
from typing import Literal, Optional, cast, List


from src.database import DB
from src.models.wallet import Wallet
from src.types import (
    OutpointType,
    ScriptType,
    LocalUtxoType,
    TxBuilderResultType,
    FeeDetails,
    GetUtxosRequestDto,
)
from src.services.wallet.raw_output_script_examples import (
    p2pkh_raw_output_script,
    p2pk_raw_output_script,
    p2sh_raw_output_script,
    p2wpkh_raw_output_script,
    p2wsh_raw_output_script,
)
from dependency_injector.wiring import inject

import structlog


LOGGER = structlog.get_logger()


@dataclass(frozen=True)
class BuildTransactionResponseType:
    status: Literal["success", "unspendable", "error"]
    data: Optional[TxBuilderResultType]


@dataclass(frozen=True)
class GetFeeEstimateForUtxoResponseType:
    status: Literal["success", "unspendable", "error"]
    data: Optional[FeeDetails]


class WalletService:
    """Initiate a wallet using the bdk library and offer various methods to interact with it.
    The wallet will use an electrum server to obtain data around it's transaction history and current utxos.
    In order to initiate a wallet, a valid wallet descriptor is required.
    Use the wallet details in the database to initiate the wallet.
    Store the wallet details uuid as the wallet_id, if the wallet_id is ever not the same
    as the wallet details id in the database then initiate a new wallet and set it as the current wallet in the class.
    """

    wallet: Optional[bdk.Wallet] = None
    wallet_id: Optional[str] = None

    def __init__(
        self,
    ):
        self.wallet = WalletService.connect_wallet()

    @classmethod
    def create_wallet(cls, descriptor: str, network: bdk.Network, electrum_url: str):
        """Store the wallet details in the database.
        There should ever only be one wallet in the db at a time. If a new wallet is created, the old one should be removed.
        """
        if Wallet.get_current_wallet():
            cls.remove_global_wallet_and_details()
        new_wallet = Wallet(
            descriptor=descriptor, network=network.value, electrum_url=electrum_url
        )
        DB.session.add(new_wallet)
        DB.session.commit()

    @classmethod
    def remove_global_wallet_and_details(cls):
        DB.session.query(Wallet).delete()
        DB.session.commit()
        cls.wallet = None
        cls.wallet_id = None

    @classmethod
    @inject
    def connect_wallet(
        cls,
    ) -> bdk.Wallet:
        """Connect to an electrum server and return the bdk wallet. If a wallet is already connected and it is the same one as the one in the database, return that instead."""

        wallet_details = Wallet.get_current_wallet()
        wallet_details_id = wallet_details.id if wallet_details else None

        current_wallet_id = cls.wallet_id if cls.wallet is not None else None

        if current_wallet_id == wallet_details_id and cls.wallet is not None:
            LOGGER.info(
                "A wallet is already connected, therefore use that instead of connecting another one."
            )
            return cls.wallet

        if current_wallet_id is not None and current_wallet_id != wallet_details_id:
            LOGGER.info(
                f"Wallet {current_wallet_id} is connected to the electrum server but the wallet in the database is {wallet_details_id}. There we shall remove the current wallet and connect to the new one."
            )

        if wallet_details is None:
            LOGGER.error(
                """There are no wallet details in the database.
                  And a user is trying to use the wallet details from the database
                  to create a bdk wallet and connect to an electrum server,
                  clearly something is wrong here."""
            )
            raise Exception("No wallet details in the database")

        descriptor = wallet_details.descriptor
        network = wallet_details.network
        electrum_url = wallet_details.electrum_url

        wallet_descriptor = bdk.Descriptor(
            descriptor, bdk.Network._value2member_map_[network]
        )

        db_config = bdk.DatabaseConfig.MEMORY()

        blockchain_config = bdk.BlockchainConfig.ELECTRUM(
            bdk.ElectrumConfig(electrum_url, None, 2, 30, 100, True)
        )

        blockchain = bdk.Blockchain(blockchain_config)

        wallet = bdk.Wallet(
            descriptor=wallet_descriptor,
            change_descriptor=None,
            network=bdk.Network._value2member_map_[network],
            database_config=db_config,
        )

        LOGGER.info(f"Connecting a new wallet to electrum server {wallet_details_id}")
        LOGGER.info(f"xpub {wallet_descriptor.as_string()}")

        wallet.sync(blockchain, None)

        cls.wallet = wallet
        cls.wallet_id = wallet_details_id

        return wallet

    @classmethod
    def create_spendable_wallet(
        cls,
        network: bdk.Network,
        wallet_descriptor: bdk.Descriptor,
        # TODO get this url from a config file
        electrum_url="127.0.0.1:50000",
    ) -> bdk.Wallet:
        """Create a new wallet and sync it to the electrum server."""
        db_config = bdk.DatabaseConfig.MEMORY()

        blockchain_config = bdk.BlockchainConfig.ELECTRUM(
            bdk.ElectrumConfig(electrum_url, None, 2, 30, 100, True)
        )

        blockchain = bdk.Blockchain(blockchain_config)

        wallet = bdk.Wallet(
            descriptor=wallet_descriptor,
            change_descriptor=None,
            network=network,
            database_config=db_config,
        )

        wallet.sync(blockchain, None)

        return wallet

    @classmethod
    def create_spendable_descriptor(
        cls,
        network: bdk.Network,
        script_type: ScriptType,
    ) -> Optional[bdk.Descriptor]:
        """Create a new wallet descriptor"""

        twelve_word_secret = bdk.Mnemonic(bdk.WordCount.WORDS12)

        # xpriv
        descriptor_secret_key = bdk.DescriptorSecretKey(network, twelve_word_secret, "")

        wallet_descriptor = None
        if script_type == ScriptType.P2PKH:
            # public key has pkh(
            wallet_descriptor = bdk.Descriptor.new_bip44(
                descriptor_secret_key, bdk.KeychainKind.EXTERNAL, network
            )
        elif script_type == ScriptType.P2WSH:
            # wrapped segwit (sh(wpkh(
            wallet_descriptor = bdk.Descriptor.new_bip49(
                descriptor_secret_key, bdk.KeychainKind.EXTERNAL, network
            )

        elif script_type == ScriptType.P2WPKH:
            # native segwit (P2WPKH) wpkh(
            wallet_descriptor = bdk.Descriptor.new_bip84(
                descriptor_secret_key, bdk.KeychainKind.EXTERNAL, network
            )

        elif script_type == ScriptType.P2TR:
            # https://docs.rs/bdk_wallet/latest/bdk_wallet/descriptor/template/struct.Bip86.html
            wallet_descriptor = bdk.Descriptor.new_bip86(
                descriptor_secret_key, bdk.KeychainKind.EXTERNAL, network
            )
        else:
            LOGGER.error("Invalid script type", script_type=script_type)

        if wallet_descriptor is not None:
            LOGGER.info(f"new wallet created: {wallet_descriptor.as_string()}")

        return wallet_descriptor

    def get_script_type(
        self,
    ) -> ScriptType:
        "Get the script type for the current wallet."
        address: bdk.AddressInfo = self.wallet.get_address(
            bdk.AddressIndex.LAST_UNUSED()
        )
        payload: bdk.Payload = address.address.payload()
        if payload.is_witness_program():
            return ScriptType.P2WPKH
        elif payload.is_script_hash():
            return ScriptType.P2SH
        else:
            return ScriptType.P2PKH

    def get_all_utxos(self) -> List[LocalUtxoType]:
        """Get all utxos for the current wallet."""
        utxos = self.wallet.list_unspent()
        return utxos

    def get_utxos_info(self, utxos_wanted: List[OutpointType]) -> List[LocalUtxoType]:
        """For a given set of  txids and the vout pointing to a utxo, return the utxos"""
        existing_utxos = cast(List[LocalUtxoType], self.get_all_utxos())
        utxo_dict = {
            f"{utxo.outpoint.txid}_{utxo.outpoint.vout}": utxo
            for utxo in existing_utxos
        }

        utxos_wanted_that_exist = []
        for utxo in utxos_wanted:
            utxo_key = f"{utxo.txid}_{utxo.vout}"
            if utxo_dict[utxo_key]:
                utxos_wanted_that_exist.append(utxo_dict[utxo_key])

        return utxos_wanted_that_exist

    def build_transaction(
        self,
        utxos: List[LocalUtxoType],
        sats_per_vbyte: int,
        raw_output_script: str,
    ) -> BuildTransactionResponseType:
        """
        Build an unsigned psbt, using the given utxos as inputs, sats_per_vbyte as the fee rate, and raw_output_script as the locking script.
        """
        try:
            tx_builder = bdk.TxBuilder()

            tx_builder = tx_builder.manually_selected_only()
            outpoints = [utxo.outpoint for utxo in utxos]
            tx_builder = tx_builder.add_utxos(outpoints)

            tx_builder = tx_builder.fee_rate(sats_per_vbyte)
            binary_script = bytes.fromhex(raw_output_script)

            script = bdk.Script(binary_script)

            # use half the amount of the utxo so that the transaction can be
            # created used alone for a single transaction
            # in other words so that the input amount can cover both
            # the amount and the fees
            total_utxos_amount = sum(utxo.txout.value for utxo in utxos)
            transaction_amount = total_utxos_amount / 2

            tx_builder = tx_builder.add_recipient(script, transaction_amount)
            built_transaction: TxBuilderResultType = tx_builder.finish(self.wallet)

            built_transaction.transaction_details.transaction
            return BuildTransactionResponseType(
                "success",
                built_transaction,
            )

        except bdk.BdkError.InsufficientFunds:
            return BuildTransactionResponseType("unspendable", None)
        except Exception as e:
            LOGGER.error(
                "Error building transaction",
                utxos=utxos,
                error=e,
            )
            return BuildTransactionResponseType("error", None)

    def get_fee_estimate_for_utxos(
        self,
        local_utxos: List[LocalUtxoType],
        script_type: ScriptType,
        sats_per_vbyte: int,
    ) -> GetFeeEstimateForUtxoResponseType:
        """Create a tx using the given utxos, script type and fee rate, and return the total fee and fee percentage of the tx."""
        example_scripts = {
            ScriptType.P2PKH: p2pkh_raw_output_script,
            ScriptType.P2SH: p2sh_raw_output_script,
            ScriptType.P2WPKH: p2wpkh_raw_output_script,
            ScriptType.P2WSH: p2wsh_raw_output_script,
            ScriptType.P2PK: p2pk_raw_output_script,
        }

        example_script = example_scripts[script_type]
        tx_response = self.build_transaction(
            local_utxos, sats_per_vbyte, example_script
        )

        if tx_response.status == "success" and tx_response.data is not None:
            built_transaction = tx_response.data
            fee = built_transaction.transaction_details.fee

            if fee is not None:
                total = fee + built_transaction.transaction_details.sent
                percent_fee_is_of_utxo: float = (fee / total) * 100
                return GetFeeEstimateForUtxoResponseType(
                    "success", FeeDetails(percent_fee_is_of_utxo, fee)
                )
            else:
                return GetFeeEstimateForUtxoResponseType("error", None)
        else:
            return GetFeeEstimateForUtxoResponseType(tx_response.status, None)

    def get_fee_estimate_for_utxos_from_request(
        self, get_utxos_request_dto: GetUtxosRequestDto
    ):
        utxos_wanted = []
        for tx in get_utxos_request_dto.transactions:
            utxos_wanted.append(OutpointType(tx.id, int(tx.vout)))

        utxos = self.get_utxos_info(utxos_wanted)

        # todo: get this value from query param
        mock_script_type = ScriptType.P2PKH
        fee_estimate_response = self.get_fee_estimate_for_utxos(
            utxos, mock_script_type, int(get_utxos_request_dto.fee_rate)
        )

        return fee_estimate_response
