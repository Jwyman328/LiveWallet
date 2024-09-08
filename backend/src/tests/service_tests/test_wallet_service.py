from unittest.case import TestCase
import os
from unittest.mock import MagicMock, call, patch, Mock
import pytest
from src.models.wallet import Wallet
from src.services import WalletService
from src.services.wallet.wallet import (
    GetFeeEstimateForUtxoResponseType,
    BuildTransactionResponseType,
)
import bdkpython as bdk
from src.types import (
    FeeDetails,
)
from src.types import GetUtxosRequestDto
from src.types.script_types import ScriptType
from src.tests.mocks import local_utxo_mock, transaction_details_mock
from typing import cast


wallet_descriptor = os.getenv("WALLET_DESCRIPTOR", "")


class TestWalletService(TestCase):
    def setUp(self):
        self.bdk_wallet_mock = MagicMock()
        self.unspent_utxos: list[bdk.LocalUtxo] = [local_utxo_mock]
        self.bdk_wallet_mock.list_unspent.return_value = self.unspent_utxos

        self.outpoint_mock = bdk.OutPoint(txid="txid", vout=0)
        self.utxo_mock = bdk.TxOut(
            value=1000,
            script_pubkey="mock_script_pubkey",
        )
        self.sats_per_vbyte_mock = 4
        self.raw_output_script_mock = ""
        with patch.object(
            WalletService, "connect_wallet", return_value=self.bdk_wallet_mock
        ):
            WalletService.wallet = None
            WalletService.wallet_id = None
            self.wallet_service = WalletService()

    def test_connect_wallet(self):
        descriptor_mock = MagicMock(spec=bdk.Descriptor)

        memory_mock = MagicMock()
        block_chain_config_mock = MagicMock(spec=bdk.BlockchainConfig)
        electrum_config_mock = MagicMock(spec=bdk.ElectrumConfig)
        block_chain_mock = MagicMock(spec=bdk.Blockchain)
        wallet_mock = MagicMock(return_value=self.bdk_wallet_mock)
        wallet_sync_mock = MagicMock()
        wallet_mock.sync = wallet_sync_mock
        wallet_details_mock = MagicMock()
        wallet_details_mock.descriptor = "mock_descriptor"
        wallet_details_mock.change_descriptor = "mock_change_descriptor"
        wallet_details_mock.network = bdk.Network.TESTNET.value
        wallet_details_mock.electrum_url = "mock_url"
        wallet_details_mock.id = "mock_id"
        wallet_details_mock.stop_gap = 100

        with (
            patch.object(
                bdk, "Descriptor", return_value=descriptor_mock
            ) as descriptor_patch,
            patch.object(
                bdk.DatabaseConfig, "MEMORY", return_value=memory_mock
            ) as database_config_memory_patch,
            patch.object(
                bdk.BlockchainConfig, "ELECTRUM", return_value=block_chain_config_mock
            ) as block_chain_config_electrum_mock,
            patch.object(
                bdk, "ElectrumConfig", return_value=electrum_config_mock
            ) as electrum_config_patch,
            patch.object(
                bdk, "Blockchain", return_value=block_chain_mock
            ) as blockchain_patch,
            patch.object(bdk, "Wallet", return_value=wallet_mock) as wallet_patch,
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
        ):
            wallet_model_patch.get_current_wallet.return_value = wallet_details_mock

            response = WalletService.connect_wallet()

            wallet_model_patch.get_current_wallet.assert_called()
            wallet_model_patch.assert_not_called()

            expected_calls = [
                call(
                    wallet_details_mock.descriptor,
                    bdk.Network.TESTNET,
                ),
                call(
                    wallet_details_mock.change_descriptor,
                    bdk.Network.TESTNET,
                ),
            ]
            descriptor_patch.assert_has_calls(expected_calls)

            database_config_memory_patch.assert_called()
            block_chain_config_electrum_mock.assert_called_with(electrum_config_mock)
            electrum_config_patch.assert_called_with(
                wallet_details_mock.electrum_url, None, 2, 30, 100, True
            )

            blockchain_patch.assert_called_with(block_chain_config_mock)
            wallet_patch.assert_called_with(
                descriptor=descriptor_mock,
                change_descriptor=descriptor_mock,
                network=bdk.Network.TESTNET,
                database_config=memory_mock,
            )

            assert WalletService.wallet == wallet_mock

            assert response == wallet_mock
            wallet_sync_mock.assert_called_with(block_chain_mock, None)

    def test_connect_wallet_with_wallet_without_change_descriptor(self):
        descriptor_mock = MagicMock(spec=bdk.Descriptor)

        memory_mock = MagicMock()
        block_chain_config_mock = MagicMock(spec=bdk.BlockchainConfig)
        electrum_config_mock = MagicMock(spec=bdk.ElectrumConfig)
        block_chain_mock = MagicMock(spec=bdk.Blockchain)
        wallet_mock = MagicMock(return_value=self.bdk_wallet_mock)
        wallet_sync_mock = MagicMock()
        wallet_mock.sync = wallet_sync_mock
        wallet_details_mock = MagicMock()
        wallet_details_mock.descriptor = "mock_descriptor"
        wallet_details_mock.change_descriptor = None
        wallet_details_mock.network = bdk.Network.TESTNET.value
        wallet_details_mock.electrum_url = "mock_url"
        wallet_details_mock.id = "mock_id"
        wallet_details_mock.stop_gap = 100

        with (
            patch.object(
                bdk, "Descriptor", return_value=descriptor_mock
            ) as descriptor_patch,
            patch.object(
                bdk.DatabaseConfig, "MEMORY", return_value=memory_mock
            ) as database_config_memory_patch,
            patch.object(
                bdk.BlockchainConfig, "ELECTRUM", return_value=block_chain_config_mock
            ) as block_chain_config_electrum_mock,
            patch.object(
                bdk, "ElectrumConfig", return_value=electrum_config_mock
            ) as electrum_config_patch,
            patch.object(
                bdk, "Blockchain", return_value=block_chain_mock
            ) as blockchain_patch,
            patch.object(bdk, "Wallet", return_value=wallet_mock) as wallet_patch,
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
        ):
            wallet_model_patch.get_current_wallet.return_value = wallet_details_mock

            response = WalletService.connect_wallet()

            wallet_model_patch.get_current_wallet.assert_called()
            wallet_model_patch.assert_not_called()

            expected_calls = [
                call(
                    wallet_details_mock.descriptor,
                    bdk.Network.TESTNET,
                ),
            ]
            descriptor_patch.assert_has_calls(expected_calls)

            database_config_memory_patch.assert_called()
            block_chain_config_electrum_mock.assert_called_with(electrum_config_mock)
            electrum_config_patch.assert_called_with(
                wallet_details_mock.electrum_url, None, 2, 30, 100, True
            )

            blockchain_patch.assert_called_with(block_chain_config_mock)
            wallet_patch.assert_called_with(
                descriptor=descriptor_mock,
                change_descriptor=None,
                network=bdk.Network.TESTNET,
                database_config=memory_mock,
            )

            assert WalletService.wallet == wallet_mock

            assert response == wallet_mock
            wallet_sync_mock.assert_called_with(block_chain_mock, None)

    def test_connect_wallet_with_existing_wallet(
        self,
    ):
        wallet_mock = MagicMock()
        wallet_sync_mock = MagicMock()
        wallet_mock.sync = wallet_sync_mock
        wallet_details_mock = MagicMock()
        wallet_details_mock.descriptor = "mock_descriptor"
        wallet_details_mock.network = bdk.Network.TESTNET.value
        wallet_details_mock.electrum_url = "mock_url"
        wallet_details_mock.id = "mock_id"
        wallet_details_mock.stop_gap = 100

        with (
            patch.object(bdk, "Wallet", return_value=wallet_mock) as bdk_wallet_patch,
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
        ):
            wallet_model_patch.get_current_wallet.return_value = wallet_details_mock
            WalletService.wallet = wallet_mock
            WalletService.wallet_id = wallet_details_mock.id
            response = WalletService.connect_wallet()

            assert response == wallet_mock
            wallet_model_patch.get_current_wallet.assert_called()
            bdk_wallet_patch.assert_not_called()
            wallet_sync_mock.assert_not_called()

    def test_connect_wallet_with_existing_wallet_but_differing_wallet_id_in_db(
        self,
    ):
        descriptor_mock = MagicMock(spec=bdk.Descriptor)

        memory_mock = MagicMock()
        block_chain_config_mock = MagicMock(spec=bdk.BlockchainConfig)
        electrum_config_mock = MagicMock(spec=bdk.ElectrumConfig)
        block_chain_mock = MagicMock(spec=bdk.Blockchain)
        wallet_mock = MagicMock(return_value=self.bdk_wallet_mock)
        wallet_sync_mock = MagicMock()
        wallet_mock.sync = wallet_sync_mock
        wallet_details_mock = MagicMock()
        wallet_details_mock.id = "mock_id"
        wallet_details_mock.descriptor = "mock_descriptor"
        wallet_details_mock.change_descriptor = "mock_change_descriptor"
        wallet_details_mock.network = bdk.Network.TESTNET.value
        wallet_details_mock.electrum_url = "mock_url"
        wallet_details_mock.stop_gap = 100

        with (
            patch.object(
                bdk, "Descriptor", return_value=descriptor_mock
            ) as descriptor_patch,
            patch.object(
                bdk.DatabaseConfig, "MEMORY", return_value=memory_mock
            ) as database_config_memory_patch,
            patch.object(
                bdk.BlockchainConfig, "ELECTRUM", return_value=block_chain_config_mock
            ) as block_chain_config_electrum_mock,
            patch.object(
                bdk, "ElectrumConfig", return_value=electrum_config_mock
            ) as electrum_config_patch,
            patch.object(
                bdk, "Blockchain", return_value=block_chain_mock
            ) as blockchain_patch,
            patch.object(bdk, "Wallet", return_value=wallet_mock) as wallet_patch,
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
        ):
            wallet_model_patch.get_current_wallet.return_value = wallet_details_mock
            WalletService.wallet_id = "different_id"
            response = WalletService.connect_wallet()

            wallet_model_patch.get_current_wallet.assert_called()
            wallet_model_patch.assert_not_called()

            expected_calls = [
                call(
                    wallet_details_mock.descriptor,
                    bdk.Network.TESTNET,
                ),
                call(
                    wallet_details_mock.change_descriptor,
                    bdk.Network.TESTNET,
                ),
            ]
            descriptor_patch.assert_has_calls(expected_calls)

            database_config_memory_patch.assert_called()
            block_chain_config_electrum_mock.assert_called_with(electrum_config_mock)
            electrum_config_patch.assert_called_with(
                wallet_details_mock.electrum_url, None, 2, 30, 100, True
            )

            blockchain_patch.assert_called_with(block_chain_config_mock)
            wallet_patch.assert_called_with(
                descriptor=descriptor_mock,
                change_descriptor=descriptor_mock,
                network=bdk.Network.TESTNET,
                database_config=memory_mock,
            )

            assert WalletService.wallet == wallet_mock

            assert response == wallet_mock
            wallet_sync_mock.assert_called_with(block_chain_mock, None)

    def test_connect_wallet_without_wallet_in_db(
        self,
    ):
        wallet_mock = MagicMock(return_value=self.bdk_wallet_mock)
        wallet_sync_mock = MagicMock()
        wallet_mock.sync = wallet_sync_mock
        wallet_details_mock = MagicMock()
        wallet_details_mock.id = "mock_id"
        wallet_details_mock.descriptor = "mock_descriptor"
        wallet_details_mock.network = bdk.Network.TESTNET.value
        wallet_details_mock.electrum_url = "mock_url"
        wallet_details_mock.stop_gap = 100

        with (
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
        ):
            wallet_model_patch.get_current_wallet.return_value = None
            WalletService.wallet_id = "different_id"
            with pytest.raises(Exception, match="No wallet details in the database"):
                WalletService.connect_wallet()

    def test_create_wallet(self):
        with (
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
            patch("src.services.wallet.wallet.DB") as db_patch,
            patch.object(
                WalletService, "remove_global_wallet_and_details"
            ) as remove_global_wallet_and_details_patch,
        ):
            mock_wallet = MagicMock()
            wallet_model_patch.return_value = mock_wallet
            wallet_model_patch.get_current_wallet = MagicMock(return_value=None)

            add_mock = MagicMock()
            commit_mock = MagicMock()
            db_patch.session.add = add_mock
            db_patch.session.commit = commit_mock

            descriptor = "mock descriptor"
            change_descriptor = "mock change descriptor"
            network = bdk.Network.TESTNET
            electrum_url = "mock electrum url"
            stop_gap = 100

            WalletService.create_wallet(
                descriptor, change_descriptor, network, electrum_url, stop_gap
            )
            wallet_model_patch.get_current_wallet.assert_called()
            remove_global_wallet_and_details_patch.assert_not_called()

            wallet_model_patch.assert_called_with(
                descriptor=descriptor,
                change_descriptor=change_descriptor,
                network=network.value,
                electrum_url=electrum_url,
                stop_gap=stop_gap,
            )

            db_patch.session.add.assert_called_with(mock_wallet)
            db_patch.session.commit.assert_called()

    def test_create_wallet_with_no_change_descriptor(self):
        with (
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
            patch("src.services.wallet.wallet.DB") as db_patch,
            patch.object(
                WalletService, "remove_global_wallet_and_details"
            ) as remove_global_wallet_and_details_patch,
        ):
            mock_wallet = MagicMock()
            wallet_model_patch.return_value = mock_wallet
            wallet_model_patch.get_current_wallet = MagicMock(return_value=None)

            add_mock = MagicMock()
            commit_mock = MagicMock()
            db_patch.session.add = add_mock
            db_patch.session.commit = commit_mock

            descriptor = "mock descriptor"
            change_descriptor = None
            network = bdk.Network.TESTNET
            electrum_url = "mock electrum url"
            stop_gap = 100

            WalletService.create_wallet(
                descriptor, change_descriptor, network, electrum_url, stop_gap
            )
            wallet_model_patch.get_current_wallet.assert_called()
            remove_global_wallet_and_details_patch.assert_not_called()

            wallet_model_patch.assert_called_with(
                descriptor=descriptor,
                change_descriptor=change_descriptor,
                network=network.value,
                electrum_url=electrum_url,
                stop_gap=stop_gap,
            )

            db_patch.session.add.assert_called_with(mock_wallet)
            db_patch.session.commit.assert_called()

    def test_create_wallet_with_existing_current_wallet_in_db(self):
        with (
            patch("src.services.wallet.wallet.Wallet") as wallet_model_patch,
            patch("src.services.wallet.wallet.DB") as db_patch,
            patch.object(
                WalletService, "remove_global_wallet_and_details"
            ) as remove_global_wallet_and_details_patch,
        ):
            mock_wallet = MagicMock()
            wallet_model_patch.return_value = mock_wallet
            wallet_model_patch.get_current_wallet = MagicMock(return_value=MagicMock)

            add_mock = MagicMock()
            commit_mock = MagicMock()
            db_patch.session.add = add_mock
            db_patch.session.commit = commit_mock

            descriptor = "mock descriptor"
            change_descriptor = "change_descriptor descriptor"
            network = bdk.Network.TESTNET
            electrum_url = "mock electrum url"
            stop_gap = 100

            WalletService.create_wallet(
                descriptor, change_descriptor, network, electrum_url, stop_gap
            )
            wallet_model_patch.get_current_wallet.assert_called()
            remove_global_wallet_and_details_patch.assert_called()

            wallet_model_patch.assert_called_with(
                descriptor=descriptor,
                change_descriptor=change_descriptor,
                network=network.value,
                electrum_url=electrum_url,
                stop_gap=stop_gap,
            )

            db_patch.session.add.assert_called_with(mock_wallet)
            db_patch.session.commit.assert_called()

    def test_remove_global_wallet_and_details(self):
        with patch("src.services.wallet.wallet.DB") as db_patch:
            query_mock = MagicMock()
            commit_mock = MagicMock()
            db_patch.session.query = query_mock
            db_patch.session.commit = commit_mock
            WalletService.wallet = MagicMock()
            WalletService.wallet_id = "mock_id"

            WalletService.remove_global_wallet_and_details()

            query_mock.assert_called_with(Wallet)
            commit_mock.assert_called()
            assert WalletService.wallet == None
            assert WalletService.wallet_id == None

    def test_create_spenable_wallet_creates_P2PKH_descriptor(self):
        network = bdk.Network.TESTNET
        script_type = ScriptType.P2PKH
        mock_mnemonic_value = bdk.Mnemonic.from_string(
            "fever win palace mountain sunny conduct boat now modify animal birth train"
        )

        with patch("src.services.wallet.wallet.bdk.Mnemonic") as mnemonic_mock:
            mnemonic_mock.return_value = mock_mnemonic_value
            descriptor = WalletService.create_spendable_descriptor(
                network,
                script_type,
            )
            assert (
                descriptor.as_string()
                == "pkh([5d86ed00/44'/1'/0']tpubDDFWcnN4v2p5ydREdKm7f8FdGZWtAqBBGt95UYW7eAP7YNZPzTgam2kN6TY6hfsjBmvNtDiY8QUxSwevEFC7rZCXqKVKuQjNWRD5tasvXxR/0/*)#vrzscgn4"
            )

    def test_create_spenable_wallet_creates_P2WSH_descriptor(self):
        network = bdk.Network.TESTNET
        script_type = ScriptType.P2WSH
        mock_mnemonic_value = bdk.Mnemonic.from_string(
            "fever win palace mountain sunny conduct boat now modify animal birth train"
        )

        with patch("src.services.wallet.wallet.bdk.Mnemonic") as mnemonic_mock:
            mnemonic_mock.return_value = mock_mnemonic_value
            descriptor = WalletService.create_spendable_descriptor(
                network,
                script_type,
            )
            assert (
                descriptor.as_string()
                == "sh(wpkh([5d86ed00/49'/1'/0']tpubDDeYrnqbRjyvmeuQep4gdXhuXt1XCfTffct4XPgArNRSuqDnMn5QiW3Ky7E3E8o8GUhJqYWT11qeHwK95q7boKCzEhwLCbhA7XvHPqz7RP9/0/*))#zk8kr5gk"
            )

    def test_create_spenable_wallet_creates_P2WPKH_descriptor(self):
        network = bdk.Network.TESTNET
        script_type = ScriptType.P2WPKH
        mock_mnemonic_value = bdk.Mnemonic.from_string(
            "fever win palace mountain sunny conduct boat now modify animal birth train"
        )

        with patch("src.services.wallet.wallet.bdk.Mnemonic") as mnemonic_mock:
            mnemonic_mock.return_value = mock_mnemonic_value
            descriptor = WalletService.create_spendable_descriptor(
                network,
                script_type,
            )
            assert (
                descriptor.as_string()
                == "wpkh([5d86ed00/84'/1'/0']tpubDCL9DkbCYVfZAFtuMNWDnjLy72ZVGe8oDgBwTCVLKQAszo4g551f1Wy2trcxEiFcXWThriVkmF95WE67355UNrqjRb5N4XFzYUvX4pDe19g/0/*)#knjyf0jk"
            )

    def test_create_spenable_wallet_creates_P2TR_descriptor(self):
        network = bdk.Network.TESTNET
        script_type = ScriptType.P2TR
        mock_mnemonic_value = bdk.Mnemonic.from_string(
            "fever win palace mountain sunny conduct boat now modify animal birth train"
        )

        with patch("src.services.wallet.wallet.bdk.Mnemonic") as mnemonic_mock:
            mnemonic_mock.return_value = mock_mnemonic_value
            descriptor = WalletService.create_spendable_descriptor(
                network,
                script_type,
            )
            assert (
                descriptor.as_string()
                == "tr([5d86ed00/86'/1'/0']tpubDDSm8CbpsqR4S6wi3u2sneQUFjAaVXmqh1S42zQEJTBzSi8HqiKheFZxFToXSojnLJLoKMqXCTDHBoy1AM9h8jmCB7Nds19ZFKGgZmJ118V/0/*)#n6ehly9y"
            )

    def test_create_spenable_wallet_returns_none_for_invalid_script_type(self):
        network = bdk.Network.TESTNET
        script_type = "P2ME"
        mock_mnemonic_value = bdk.Mnemonic.from_string(
            "fever win palace mountain sunny conduct boat now modify animal birth train"
        )

        with patch("src.services.wallet.wallet.bdk.Mnemonic") as mnemonic_mock:
            mnemonic_mock.return_value = mock_mnemonic_value
            descriptor = WalletService.create_spendable_descriptor(
                network,
                script_type,
            )
            assert descriptor is None

    def test_get_all_utxos(self):
        utxos = self.wallet_service.get_all_utxos()
        list_unspent: MagicMock = self.bdk_wallet_mock.list_unspent

        list_unspent.assert_called_with()
        assert utxos is self.unspent_utxos

    def test_build_transaction(self):
        tx_builder_mock = MagicMock()
        script_mock = MagicMock()
        with (
            patch.object(bdk, "TxBuilder", return_value=tx_builder_mock),
            patch.object(bdk, "Script", return_value=script_mock),
        ):
            built_transaction_mock = bdk.TxBuilderResult(
                psbt="mock_psbt", transaction_details=transaction_details_mock
            )
            tx_builder_mock.add_utxos.return_value = tx_builder_mock
            tx_builder_mock.manually_selected_only.return_value = tx_builder_mock
            tx_builder_mock.fee_rate.return_value = tx_builder_mock

            tx_builder_mock.add_recipient = Mock()
            tx_builder_mock.add_recipient.return_value = tx_builder_mock

            tx_builder_mock.finish.return_value = built_transaction_mock

            output_count = 2

            build_transaction_response = self.wallet_service.build_transaction(
                [local_utxo_mock],
                self.sats_per_vbyte_mock,
                self.raw_output_script_mock,
                output_count,
            )

            amount_in_each_output = (local_utxo_mock.txout.value / 2) / output_count
            tx_builder_mock.add_recipient.assert_called_with(
                script_mock, amount_in_each_output
            )

            assert tx_builder_mock.add_recipient.call_count == output_count
            assert build_transaction_response.status == "success"
            assert build_transaction_response.data is built_transaction_mock

    def test_build_transaction_with_output_count_of_one(self):
        tx_builder_mock = MagicMock()
        script_mock = MagicMock()
        with (
            patch.object(bdk, "TxBuilder", return_value=tx_builder_mock),
            patch.object(bdk, "Script", return_value=script_mock),
        ):
            built_transaction_mock = bdk.TxBuilderResult(
                psbt="mock_psbt", transaction_details=transaction_details_mock
            )
            tx_builder_mock.add_utxos.return_value = tx_builder_mock
            tx_builder_mock.manually_selected_only.return_value = tx_builder_mock
            tx_builder_mock.fee_rate.return_value = tx_builder_mock

            tx_builder_mock.drain_to = Mock()
            tx_builder_mock.drain_to.return_value = tx_builder_mock

            tx_builder_mock.add_recipient = Mock()
            tx_builder_mock.add_recipient.return_value = tx_builder_mock

            tx_builder_mock.finish.return_value = built_transaction_mock

            output_count = 1

            build_transaction_response = self.wallet_service.build_transaction(
                [local_utxo_mock],
                self.sats_per_vbyte_mock,
                self.raw_output_script_mock,
                output_count,
            )

            tx_builder_mock.add_recipient.assert_not_called()
            tx_builder_mock.drain_to.assert_called_with(script_mock)
            assert build_transaction_response.status == "success"
            assert build_transaction_response.data is built_transaction_mock

    def test_build_transaction_with_insufficientFundsError(self):
        tx_builder_mock = MagicMock()
        with patch.object(bdk, "TxBuilder", return_value=tx_builder_mock):
            tx_builder_mock.add_utxos.return_value = tx_builder_mock
            tx_builder_mock.fee_rate.return_value = tx_builder_mock
            tx_builder_mock.add_recipient.return_value = tx_builder_mock

            tx_builder_mock.manually_selected_only.return_value = tx_builder_mock
            tx_builder_mock.finish.side_effect = bdk.BdkError.InsufficientFunds()
            build_transaction_response = self.wallet_service.build_transaction(
                [local_utxo_mock],
                self.sats_per_vbyte_mock,
                self.raw_output_script_mock,
            )

            assert build_transaction_response.status == "unspendable"
            assert build_transaction_response.data == None

    def test_build_transaction_with_Error(self):
        mock_tx_builder = MagicMock()
        with patch.object(bdk, "TxBuilder", return_value=mock_tx_builder):
            mock_tx_builder.add_utxos.return_value = mock_tx_builder
            mock_tx_builder.fee_rate.return_value = mock_tx_builder

            mock_tx_builder.manually_selected_only.return_value = mock_tx_builder

            mock_tx_builder.add_recipient.return_value = mock_tx_builder
            mock_tx_builder.finish.side_effect = Exception("error")

            build_transaction_response = self.wallet_service.build_transaction(
                [local_utxo_mock],
                self.sats_per_vbyte_mock,
                self.raw_output_script_mock,
            )

            assert build_transaction_response.status == "error"
            assert build_transaction_response.data == None

    def test_get_fee_estimate_for_utxos(self):
        tx_builder_mock = MagicMock()
        with patch.object(
            bdk, "TxBuilder", return_value=tx_builder_mock
        ) as mock_tx_builder:
            built_transaction_mock = bdk.TxBuilderResult(
                psbt="mock_psbt", transaction_details=transaction_details_mock
            )
            tx_builder_mock.add_utxos.return_value = tx_builder_mock
            tx_builder_mock.fee_rate.return_value = tx_builder_mock
            tx_builder_mock.add_recipient.return_value = tx_builder_mock

            tx_builder_mock.manually_selected_only.return_value = tx_builder_mock

            tx_builder_mock.finish.return_value = built_transaction_mock

            mock_tx_builder.return_value = tx_builder_mock
            output_count = 5

            fee_estimate_response = self.wallet_service.get_fee_estimate_for_utxos(
                [local_utxo_mock], ScriptType.P2PKH, 4, output_count
            )

            assert fee_estimate_response.status == "success"
            fee: int = cast(int, transaction_details_mock.fee)
            expected_fee_percent = (fee / (transaction_details_mock.sent + fee)) * 100
            assert fee_estimate_response.data == FeeDetails(expected_fee_percent, fee)
            assert fee_estimate_response.psbt == "mock_psbt"

    def test_get_fee_estimate_for_utxo_with_build_tx_unspendable(self):
        build_transaction_error_response = BuildTransactionResponseType(
            "unspendable", None
        )
        with patch.object(
            WalletService,
            "build_transaction",
            return_value=build_transaction_error_response,
        ):
            get_fee_estimate_response = self.wallet_service.get_fee_estimate_for_utxos(
                [local_utxo_mock], ScriptType.P2PKH, 4
            )

            assert get_fee_estimate_response.status == "unspendable"
            assert get_fee_estimate_response.data == None

    def test_get_fee_estimate_for_utxo_with_build_tx_error(self):
        build_transaction_error_response = BuildTransactionResponseType("error", None)
        with patch.object(
            WalletService,
            "build_transaction",
            return_value=build_transaction_error_response,
        ):
            get_fee_estimate_response = self.wallet_service.get_fee_estimate_for_utxos(
                [local_utxo_mock], ScriptType.P2PKH, 4
            )

            assert get_fee_estimate_response.status == "error"
            assert get_fee_estimate_response.data == None

    def test_get_fee_estimate_for_utxos_from_request(self):
        mock_utxos = [local_utxo_mock]

        fee_rate = "5"
        transactions = [
            {
                "id": f"{local_utxo_mock.outpoint.txid}",
                "vout": f"{local_utxo_mock.outpoint.vout}",
            },
        ]
        mock_get_utxos_request_dto = GetUtxosRequestDto.model_validate(
            dict(transactions=transactions, fee_rate=fee_rate, output_count="2")
        )

        mock_psbt = Mock()
        mock_fee_estimates_response = GetFeeEstimateForUtxoResponseType(
            status="success", data=FeeDetails(0.1, 100), psbt=mock_psbt
        )

        with (
            patch.object(
                WalletService, "get_utxos_info", return_value=mock_utxos
            ) as mock_get_utxos_info,
            patch.object(
                WalletService,
                "get_fee_estimate_for_utxos",
                return_value=mock_fee_estimates_response,
            ) as mock_get_fee_estimate_for_utxos,
        ):
            fee_estimate_response = (
                self.wallet_service.get_fee_estimate_for_utxos_from_request(
                    mock_get_utxos_request_dto
                )
            )
            mock_get_utxos_info.assert_called_with(
                [
                    bdk.OutPoint(
                        local_utxo_mock.outpoint.txid, local_utxo_mock.outpoint.vout
                    )
                ]
            )

            mock_get_fee_estimate_for_utxos.assert_called_with(
                mock_utxos,
                ScriptType.P2PKH,
                int(mock_get_utxos_request_dto.fee_rate),
                int(mock_get_utxos_request_dto.output_count),
            )
            assert fee_estimate_response == mock_fee_estimates_response

    def test_script_type_is_p2wpkh(self):
        mock_wallet = Mock()
        address_info_mock = Mock()
        address_mock = Mock()
        payload_mock = Mock()
        payload_mock.is_witness_program = Mock(return_value=True)
        payload_mock.is_script_hash = Mock(return_value=False)
        address_mock.payload = Mock(return_value=payload_mock)
        address_info_mock.address = address_mock

        mock_wallet.get_address = Mock(return_value=address_info_mock)
        self.wallet_service.wallet = mock_wallet

        script_type = self.wallet_service.get_script_type()

        assert script_type == ScriptType.P2WPKH

    def test_script_type_is_p2sh(self):
        mock_wallet = Mock()
        address_info_mock = Mock()
        address_mock = Mock()
        payload_mock = Mock()
        payload_mock.is_witness_program = Mock(return_value=False)
        payload_mock.is_script_hash = Mock(return_value=True)
        address_mock.payload = Mock(return_value=payload_mock)
        address_info_mock.address = address_mock

        mock_wallet.get_address = Mock(return_value=address_info_mock)
        self.wallet_service.wallet = mock_wallet

        script_type = self.wallet_service.get_script_type()

        assert script_type == ScriptType.P2SH

    def test_script_type_is_p2pkh(self):
        mock_wallet = Mock()
        address_info_mock = Mock()
        address_mock = Mock()
        payload_mock = Mock()
        payload_mock.is_witness_program = Mock(return_value=False)
        payload_mock.is_script_hash = Mock(return_value=False)
        address_mock.payload = Mock(return_value=payload_mock)
        address_info_mock.address = address_mock

        mock_wallet.get_address = Mock(return_value=address_info_mock)
        self.wallet_service.wallet = mock_wallet

        script_type = self.wallet_service.get_script_type()

        assert script_type == ScriptType.P2PKH

    def test_create_spendable_wallet(self):
        descriptor_mock = MagicMock(spec=bdk.Descriptor)
        memory_mock = MagicMock()
        block_chain_config_mock = MagicMock(spec=bdk.BlockchainConfig)
        electrum_config_mock = MagicMock(spec=bdk.ElectrumConfig)
        block_chain_mock = MagicMock(spec=bdk.Blockchain)
        wallet_mock = MagicMock(return_value=self.bdk_wallet_mock)
        wallet_sync_mock = MagicMock()
        wallet_mock.sync = wallet_sync_mock
        electrum_url_mock = "mock_electrum_url"

        with (
            patch.object(
                bdk.DatabaseConfig, "MEMORY", return_value=memory_mock
            ) as database_config_memory_patch,
            patch.object(
                bdk.BlockchainConfig, "ELECTRUM", return_value=block_chain_config_mock
            ) as block_chain_config_electrum_mock,
            patch.object(
                bdk, "ElectrumConfig", return_value=electrum_config_mock
            ) as electrum_config_patch,
            patch.object(
                bdk, "Blockchain", return_value=block_chain_mock
            ) as blockchain_patch,
            patch.object(bdk, "Wallet", return_value=wallet_mock) as wallet_patch,
        ):
            response = WalletService.create_spendable_wallet(
                bdk.Network.TESTNET, descriptor_mock, electrum_url_mock
            )

            database_config_memory_patch.assert_called()
            block_chain_config_electrum_mock.assert_called_with(electrum_config_mock)
            electrum_config_patch.assert_called_with(
                electrum_url_mock, None, 2, 30, 100, True
            )

            blockchain_patch.assert_called_with(block_chain_config_mock)
            wallet_patch.assert_called_with(
                descriptor=descriptor_mock,
                change_descriptor=None,
                network=bdk.Network.TESTNET,
                database_config=memory_mock,
            )

            assert response == wallet_mock
            wallet_sync_mock.assert_called_with(block_chain_mock, None)
