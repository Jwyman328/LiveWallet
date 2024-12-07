from dataclasses import dataclass
from datetime import datetime
import bdkpython as bdk
from sqlalchemy.orm import aliased
from bitcoinlib.transactions import Output, Transaction
from sqlalchemy import func, or_
from src.models.transaction import Transaction as TransactionModel
from src.models.label import Label
from src.models.outputs import Output as OutputModel
from typing import Literal, Optional, List, Dict, Tuple
from src.api import electrum_request, parse_electrum_url

from src.api.electrum import (
    ElectrumMethod,
    GetTransactionsRequestParams,
)
from src.database import DB
from src.models.wallet import Wallet
from src.my_types import (
    ScriptType,
    FeeDetails,
    GetUtxosRequestDto,
)
from src.my_types.controller_types.utxos_dtos import (
    OutputLabelDto,
    PopulateOutputLabelsRequestDto,
)
from src.my_types.transactions import LiveWalletOutput
from src.services.last_fetched.last_fetched_service import LastFetchedService
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
    data: Optional[bdk.TxBuilderResult]


@dataclass(frozen=True)
class GetFeeEstimateForUtxoResponseType:
    status: Literal["success", "unspendable", "error"]
    data: Optional[FeeDetails]
    psbt: Optional[bdk.PartiallySignedTransaction]


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
    def create_wallet(
        cls,
        descriptor: str,
        change_descriptor: Optional[str],
        network: bdk.Network,
        electrum_url: str,
        stop_gap: Optional[int] = 100,
    ):
        """Store the wallet details in the database.
        There should ever only be one wallet in the db at a time. If a new wallet is created, the old one should be removed.
        """
        if Wallet.get_current_wallet():
            cls.remove_global_wallet_and_details()

        new_wallet = Wallet(
            descriptor=descriptor,
            change_descriptor=change_descriptor,
            network=network.value,
            electrum_url=electrum_url,
            stop_gap=stop_gap,
        )
        DB.session.add(new_wallet)
        DB.session.commit()

    @classmethod
    def remove_output_and_related_label_data(cls):
        # make this reusable since it is used twice?
        outputs_with_label = (
            DB.session.query(OutputModel)
            .join(OutputModel.labels)
            .group_by(OutputModel.id)
            .having(func.count(Label.id) > 0)
            .all()
        )
        # remove all rows in the output_labels table
        for output in outputs_with_label:
            output.labels = []
            DB.session.flush()
        # remove all rows in the OutputModel table
        DB.session.query(OutputModel).delete()
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
        change_descriptor = wallet_details.change_descriptor
        network = wallet_details.network
        electrum_url = wallet_details.electrum_url
        stop_gap = wallet_details.stop_gap

        wallet_descriptor = bdk.Descriptor(
            descriptor, bdk.Network._value2member_map_[network]
        )

        wallet_change_descriptor = (
            bdk.Descriptor(change_descriptor, bdk.Network._value2member_map_[network])
            if change_descriptor
            else None
        )

        db_config = bdk.DatabaseConfig.MEMORY()
        cls.url = electrum_url

        blockchain_config = bdk.BlockchainConfig.ELECTRUM(
            bdk.ElectrumConfig(electrum_url, None, 2, 30, stop_gap, True)
        )

        blockchain = bdk.Blockchain(blockchain_config)
        cls.blockchain = blockchain

        wallet = bdk.Wallet(
            descriptor=wallet_descriptor,
            change_descriptor=wallet_change_descriptor,
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
    ) -> Tuple[bdk.Wallet, bdk.Blockchain]:
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

        return (wallet, blockchain)

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

    def get_all_utxos(self) -> List[bdk.LocalUtxo]:
        """Get all utxos for the current wallet."""
        if self.wallet is None:
            return []

        utxos = self.wallet.list_unspent()
        return utxos

    @classmethod
    def get_all_transactions(
        cls,
    ) -> List[Transaction]:
        """Get all transactions for the current wallet.

        Add the transaction to the database.
        Add to the database that the transactions have been fetched
        via the LastFetched model.
        """
        wallet_details = Wallet.get_current_wallet()
        if cls.wallet is None or wallet_details is None:
            LOGGER.error("No electrum wallet or wallet details found.")
            return []

        transactions: list[bdk.TransactionDetails] = cls.wallet.list_transactions(False)

        all_tx_details: List[Transaction] = []

        for index, transaction in enumerate(transactions):
            transaction_response = cls.get_transaction(transaction.txid, index)
            if transaction_response is not None:
                # add the transaction to the database
                # use the bdk transaction details since it contains
                # the sent and received amounts relative to the users wallet
                # instead of just agnostic values that electrum returns
                new_tx = cls.add_transaction_to_db(transaction)
                transaction_response.date = new_tx.confirmed_date_time
                all_tx_details.append(transaction_response)
            else:
                LOGGER.error(f"Error getting transaction {transaction.txid}")

        # mark transactions as fetched
        LastFetchedService.update_last_fetched_transaction_type()

        return all_tx_details

    @classmethod
    def get_transaction(cls, txid, index=1) -> Optional[Transaction]:
        "Get an individual transaction from the wallet by the txid."
        wallet_details = Wallet.get_current_wallet()
        if wallet_details is None:
            LOGGER.error(
                "No wallet_details found, therefore the request to get the transaction can not be made."
            )
            return None

        electrum_url = wallet_details.electrum_url

        if electrum_url is None:
            LOGGER.error("No electrum url found in the wallet details")
            return None

        url, port = parse_electrum_url(electrum_url)
        if url is None or port is None:
            LOGGER.error("No electrum url or port found in the wallet details")
            return None

        electrum_response = electrum_request(
            url,
            int(port),
            ElectrumMethod.GET_TRANSACTIONS,
            GetTransactionsRequestParams(txid, False),
            index,
        )

        if electrum_response.status == "success" and electrum_response.data is not None:
            transaction: Transaction = electrum_response.data
            return transaction
        else:
            return None

    @classmethod
    def get_transaction_details(cls, txid) -> Optional[TransactionModel]:
        """Get the transaction details from the database."""
        transaction = DB.session.query(TransactionModel).filter_by(txid=txid).first()
        return transaction

    @classmethod
    def add_transaction_to_db(
        cls, transaction_details: bdk.TransactionDetails
    ) -> TransactionModel:
        existing_transaction = (
            DB.session.query(TransactionModel)
            .filter_by(txid=transaction_details.txid)
            .first()
        )
        if existing_transaction is None:
            block_height = (
                transaction_details.confirmation_time.height
                if transaction_details.confirmation_time
                else None
            )

            timestamp = (
                transaction_details.confirmation_time.timestamp
                if transaction_details.confirmation_time
                else None
            )
            new_transaction = TransactionModel(
                txid=transaction_details.txid,
                received_amount=transaction_details.received,
                sent_amount=transaction_details.sent,
                fee=transaction_details.fee,
                confirmed_block_height=block_height,
                confirmed_date_time=datetime.fromtimestamp(timestamp),
            )
            DB.session.add(new_transaction)
            DB.session.commit()
            return new_transaction
        return existing_transaction

    @classmethod
    def get_all_outputs(cls) -> List[LiveWalletOutput]:
        """Get all spent and unspent transaction outputs for the current wallet and mutate them as needed.
        Calculate the annominity set for each output.
        Attach the txid to each output.
        Attach all labels to each output.
        Sync the database with the incoming outputs.
        """
        all_transactions = cls.get_all_transactions()
        all_outputs: List[LiveWalletOutput] = []
        for transaction in all_transactions:
            annominity_sets = cls.calculate_output_annominity_sets(transaction.outputs)
            for output in transaction.outputs:
                script = bdk.Script(output.script.raw)
                if cls.wallet and cls.wallet.is_mine(script):
                    db_output = cls.sync_local_db_with_incoming_output(
                        txid=transaction.txid,
                        vout=output.output_n,
                        address=output.address,
                        value=output.value,
                    )
                    LastFetchedService.update_last_fetched_outputs_type()
                    annominity_set = annominity_sets.get(output.value, 1)

                    extended_output = LiveWalletOutput(
                        annominity_set=annominity_set,
                        base_output=output,
                        txid=transaction.txid,
                        labels=[label.display_name for label in db_output.labels],
                    )

                    all_outputs.append(extended_output)

        # since the transactions don't come back in order we have to
        # loop through them all again to mark the outputs
        # that were used as inputs.
        for transaction in all_transactions:
            for input in transaction.inputs:
                # if the input is one of my outputs then add it to the inputs
                input = input.as_dict()
                user_output = cls.get_output_from_db(
                    txid=input["prev_txid"], vout=input["output_n"]
                )
                if user_output is None:
                    # not the users output therefore don't put it in the db
                    LOGGER.info("output is not the users")
                else:
                    # add the output to the db?
                    # or just update the output as spend and then add what txid it was spent in?
                    cls.add_spend_tx_to_output(
                        output=user_output, txid=transaction.txid
                    )

        return all_outputs

    @classmethod
    def get_all_change_outputs_from_db(
        cls,
        vout: Optional[int] = None,
        query_result_type: Literal["count", "all"] = "all",
    ) -> List[OutputModel] | int:
        """Get all the change outputs for the current wallet.

        If a vout is supplied get all change outputs with the vout


        This will either return a count of the change outputs or all the change outputs
        depending on the query_result_type.
        """
        output_alias = aliased(OutputModel)

        query = (
            DB.session.query(OutputModel)
            .join(TransactionModel, TransactionModel.txid == OutputModel.txid)
            .outerjoin(output_alias, output_alias.txid == OutputModel.txid)
            .group_by(OutputModel.txid)
            .filter(
                TransactionModel.sent_amount
                > 0,  # Sent amount is greater than 0 so we know the user is creating change
                TransactionModel.received_amount
                > 0,  # Received amount is greater than 0, so we know the user is getting change
            )
            .having(func.count(output_alias.id) == 1)
            # Only one output for the transaction because we want simple change, not any "change" from a complex tx
        )

        if vout is not None:
            # only get the change outputs for a specific vout
            query = query.filter(OutputModel.vout == vout)

        if query_result_type == "count":
            return query.count()
        else:
            return query.all()

    @classmethod
    def add_spend_tx_to_output(cls, output: OutputModel, txid: str):
        output.spent_txid = txid
        DB.session.commit()

    # TODO add a better name since this is just adding the output to the db
    @classmethod
    def sync_local_db_with_incoming_output(
        cls,
        txid: str,
        vout: int,
        address: str,
        value: Optional[int] = None,
    ) -> OutputModel:
        """Sync the local database with the incoming output.

        If the output is not in the database, add it.
        """

        db_output = OutputModel.query.filter_by(
            txid=txid, vout=vout, address=address
        ).first()
        if not db_output:
            db_output = cls.add_output_to_db(
                txid=txid, vout=vout, address=address, value=value
            )
        return db_output

    @classmethod
    def add_output_to_db(
        cls, vout: int, txid: str, address: str, value: Optional[int]
    ) -> OutputModel:
        db_output = OutputModel(
            txid=txid, vout=vout, address=address, value=value, labels=[]
        )
        DB.session.add(db_output)
        DB.session.commit()
        return db_output

    @classmethod
    def calculate_output_annominity_sets(
        self, transaction_outputs: List[Output]
    ) -> dict[str, int]:  # -> {"value": count }
        """Calculate the annominity set for a given output in a transaction.

        The annominity set is the number of outputs with the same btc value in a transaction.
        """
        # loop through the transaction outputs and
        # count how many equal outputs there are for each amount
        # {"value": equal_output_count}
        output_count = {}
        for output in transaction_outputs:
            if output_count.get(output.value):
                output_count[output.value] += 1
            else:
                output_count[output.value] = 1
        return output_count

    def get_output_labels(self) -> List[OutputLabelDto]:
        """Get all the possible labels."""
        labels = Label.query.all()
        return [
            OutputLabelDto(
                label=label.name,
                display_name=label.display_name,
                description=label.description,
            )
            for label in labels
        ]

    # TODO name this better
    def get_output_labels_unique(
        self,
    ) -> Dict[str, List[OutputLabelDto]]:
        """Get all the labels for the outputs in the wallet
        and return them as a dictionary of the key-id
        mapped to an array of labels.
        """
        outputs_with_label = (
            DB.session.query(OutputModel)
            .join(OutputModel.labels)
            .group_by(OutputModel.id)
            .having(func.count(Label.id) > 0)
            .all()
        )

        result = {}

        for output in outputs_with_label:
            for label in output.labels:
                key = f"{output.txid}-{output.vout}-{output.address}"
                if result.get(key, None) is None:
                    result[key] = [
                        OutputLabelDto(
                            label=label.name,
                            display_name=label.display_name,
                            description=label.description,
                        )
                    ]
                else:
                    result[key].append(
                        OutputLabelDto(
                            label=label.name,
                            display_name=label.display_name,
                            description=label.description,
                        )
                    )

        return result

    @classmethod
    def populate_outputs_and_labels(
        cls, populate_output_labels: PopulateOutputLabelsRequestDto
    ) -> None:  # TODO maybe a success of fail reutn type?
        try:
            model_dump = populate_output_labels.model_dump()
            for unique_output_txid_vout in model_dump.keys():
                txid, vout, address = unique_output_txid_vout.split("-")
                cls.sync_local_db_with_incoming_output(txid, int(vout), address)
                output_labels = model_dump[unique_output_txid_vout]
                for label in output_labels:
                    display_name = label["display_name"]
                    cls.add_label_to_output(txid, int(vout), display_name)
        except Exception as e:
            LOGGER.error("Error populating outputs and labels", error=e)
            DB.session.rollback()

    @classmethod
    def get_output_from_db(
        cls,
        txid: str,
        vout: int,
    ) -> Optional[OutputModel]:
        """Get an output from the database by the txid and vout."""
        output = OutputModel.query.filter_by(txid=txid, vout=vout).first()

        return output

    @classmethod
    def get_transaction_outputs_from_db(
        cls,
        txid: str,
    ) -> List[OutputModel]:
        """Get all the wallet's outputs in the db associated with a txid"""
        outputs = OutputModel.query.filter_by(
            txid=txid,
        ).all()

        return outputs

    @classmethod
    def get_transaction_inputs_from_db(
        cls,
        txid: str,
    ) -> list[OutputModel]:
        """Get all the outputs that were used as inputs for a txid in the db."""
        outputs_used_as_inputs = (
            OutputModel.query.join(
                TransactionModel, TransactionModel.txid == OutputModel.spent_txid
            )
            .filter(TransactionModel.txid == txid)
            .all()
        )

        return outputs_used_as_inputs

    @classmethod
    def get_all_unspent_outputs_from_db_before_blockheight(
        cls, blockheight: int
    ) -> List[OutputModel]:
        """Get all outputs that had not been spent yet before or at a
        certain block height.

        This is useful for determining which utxos were available to a wallet
        at a certain blockheight when a tx was made.
        """
        transaction_created = aliased(TransactionModel)
        transaction_spent = aliased(TransactionModel)
        unspent_outputs = (
            OutputModel.query.join(
                transaction_created, transaction_created.txid == OutputModel.txid
            )
            .join(transaction_spent, transaction_spent.txid == OutputModel.spent_txid)
            .filter(
                or_(
                    # use equal to as well to include all outputs used in a tx in this block
                    transaction_spent.confirmed_block_height <= blockheight,
                    transaction_spent.confirmed_block_height
                    == None,  # Equivalent to IS NULL in SQL. # noqa: E711
                )
            )
            .all()
        )
        return unspent_outputs

    # TODO should this even go here or in its own service?
    @classmethod
    def add_label_to_output(
        cls, txid: str, vout: int, label_display_name: str
    ) -> list[Label]:
        """Add a label to an output in the db."""
        db_output = OutputModel.query.filter_by(txid=txid, vout=vout).first()
        label = Label.query.filter_by(display_name=label_display_name).first()
        if db_output is None or label is None:
            return []
        db_output.labels.append(label)
        DB.session.commit()
        return db_output.labels

    def remove_label_from_output(
        self, txid: str, vout: int, label_display_name: str
    ) -> list[Label]:
        """Remove a label from an output in the db."""
        db_output = OutputModel.query.filter_by(txid=txid, vout=vout).first()
        label = Label.query.filter_by(display_name=label_display_name).first()
        # Remove the label from the output's labels collection
        if label in db_output.labels:
            db_output.labels.remove(label)
        DB.session.commit()

        return db_output.labels

    def get_utxos_info(self, utxos_wanted: List[bdk.OutPoint]) -> List[bdk.LocalUtxo]:
        """Get only the specified utxos from the users entire set of utxos.

        The wanted utxos are specificed via a list of Outpoints which are just the txid and vout.
        """
        existing_utxos = self.get_all_utxos()
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
        utxos: List[bdk.LocalUtxo],
        sats_per_vbyte: int,
        raw_output_script: str,
        # 2 by default, one for the recipient and one for the change
        output_count: int = 2,
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

            if output_count == 1:
                # if there is only one output then drain the utxos
                # to the new output
                tx_builder = tx_builder.drain_to(script)
            else:
                # use half the amount of the utxos value so that the transaction can be
                #  input amount can cover both the amount and the fees
                total_utxos_amount = sum(utxo.txout.value for utxo in utxos)
                transaction_amount = total_utxos_amount / 2
                for _ in range(output_count):
                    # divide the amount by the number of outputs to get the amount per output
                    # this is done just to ensure that the tx is still in a spendable range.
                    amount_per_recipient_output = transaction_amount / output_count
                    tx_builder = tx_builder.add_recipient(
                        script, amount_per_recipient_output
                    )

            built_transaction: bdk.TxBuilderResult = tx_builder.finish(self.wallet)

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
        local_utxos: List[bdk.LocalUtxo],
        script_type: ScriptType,
        sats_per_vbyte: int,
        # 2 by default, one for the recipient and one for the change
        output_count: int = 2,
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
            local_utxos, sats_per_vbyte, example_script, output_count
        )

        if tx_response.status == "success" and tx_response.data is not None:
            built_transaction = tx_response.data
            fee = built_transaction.transaction_details.fee
            psbt = built_transaction.psbt

            if fee is not None:
                total = fee + built_transaction.transaction_details.sent
                percent_fee_is_of_utxo: float = (fee / total) * 100
                return GetFeeEstimateForUtxoResponseType(
                    "success", FeeDetails(percent_fee_is_of_utxo, fee), psbt
                )
            else:
                return GetFeeEstimateForUtxoResponseType("error", None, None)
        else:
            return GetFeeEstimateForUtxoResponseType(tx_response.status, None, None)

    def get_fee_estimate_for_utxos_from_request(
        self, get_utxos_request_dto: GetUtxosRequestDto
    ):
        utxos_wanted = []
        for tx in get_utxos_request_dto.transactions:
            utxos_wanted.append(bdk.OutPoint(tx.id, int(tx.vout)))

        utxos = self.get_utxos_info(utxos_wanted)

        # todo: get this value from query param
        mock_script_type = ScriptType.P2PKH
        fee_estimate_response = self.get_fee_estimate_for_utxos(
            utxos,
            mock_script_type,
            int(get_utxos_request_dto.fee_rate),
            int(get_utxos_request_dto.output_count),
        )

        return fee_estimate_response

    @classmethod
    def is_address_reused(self, address: str) -> bool:
        """Check if the address has been used in the wallet more than once."""
        outputs_with_this_address = OutputModel.query.filter_by(address=address).all()
        address_used_count = len(outputs_with_this_address)

        if address_used_count > 1:
            return True
        else:
            return False
