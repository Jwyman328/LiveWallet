from unittest import TestCase
from unittest.mock import MagicMock, patch

from bdkpython import bdk

from src.services import WalletService
from src.app import AppCreator
import json

from src.types.script_types import ScriptType


class TestWalletController(TestCase):
    def setUp(self):
        app_creator = AppCreator()
        self.app = app_creator.create_app()
        self.test_client = self.app.test_client()

    def test_wallet_controller_success(self):
        with patch("src.controllers.wallet.WalletService") as wallet_service_mock:
            wallet_service_mock.create_wallet = MagicMock()

            descriptor = "mock_descriptor"
            network = "TESTNET"
            electrum_url = "mock_electrum_url"
            wallet_response = self.test_client.post(
                "/wallet/",
                json={
                    "descriptor": descriptor,
                    "network": network,
                    "electrumUrl": electrum_url,
                },
            )
            wallet_service_mock.create_wallet.assert_called_once_with(
                descriptor, bdk.Network.TESTNET, electrum_url
            )

            wallet_service_mock.assert_called_once()

            assert wallet_response.status == "200 OK"
            assert json.loads(wallet_response.data) == {
                "message": "wallet created successfully",
                "descriptor": descriptor,
                "network": network,
                "electrumUrl": electrum_url,
            }

    def test_wallet_controller_request_validation_error(self):
        wallet_response = self.test_client.post(
            "/wallet/",
            json={},
        )

        assert wallet_response.status == "400 BAD REQUEST"
        response_data = json.loads(wallet_response.data)
        assert response_data["message"] == "Error creating wallet"
        # an error for each required field descriptor, network, and electrumUrl
        assert len(response_data["errors"]) == 3

    def test_get_wallet_type_success(self):
        self.mock_wallet_service = MagicMock(WalletService)

        self.mock_wallet_class = MagicMock(
            WalletService, return_value=self.mock_wallet_service
        )
        self.mock_wallet_service.get_script_type.return_value = ScriptType.P2PKH

        with self.app.container.wallet_service.override(self.mock_wallet_service):
            wallet_response = self.test_client.get(
                "/wallet/type",
            )

            assert wallet_response.status == "200 OK"
            assert json.loads(wallet_response.data) == {
                "message": "Wallet type",
                "type": ScriptType.P2PKH.value,
            }

            self.mock_wallet_service.get_script_type.assert_called_once()

    def test_get_wallet_type_error(self):
        self.mock_wallet_service = MagicMock(WalletService)

        self.mock_wallet_class = MagicMock(
            WalletService, return_value=self.mock_wallet_service
        )
        self.mock_wallet_service.get_script_type.return_value = "Invalid Type"

        with self.app.container.wallet_service.override(self.mock_wallet_service):
            wallet_response = self.test_client.get(
                "/wallet/type",
            )

            assert wallet_response.status == "400 BAD REQUEST"

            response_data = json.loads(wallet_response.data)
            assert len(response_data["errors"]) == 1

            self.mock_wallet_service.get_script_type.assert_called_once()

    def test_remove_wallet_success(self):
        with patch("src.controllers.wallet.WalletService") as wallet_service_mock:
            wallet_service_mock.remove_global_wallet_and_details = MagicMock()

            wallet_response = self.test_client.delete(
                "/wallet/remove",
            )
            wallet_service_mock.remove_global_wallet_and_details.assert_called_once()
            assert wallet_response.status == "200 OK"
            assert json.loads(wallet_response.data) == {
                "message": "wallet successfully deleted",
            }

    def test_spendable_success(self):
        self.mock_wallet_service = MagicMock(WalletService)

        spendable_descriptor_mock = MagicMock(bdk.Descriptor)
        spendable_descriptor_mock.as_string = MagicMock(
            return_value="mock_descriptor")
        self.mock_wallet_service.create_spendable_descriptor = MagicMock(
            return_value=spendable_descriptor_mock
        )
        wallet_mock = MagicMock(bdk.Wallet)
        get_address_mock = MagicMock()
        address_mock = MagicMock(return_value=get_address_mock)
        get_address_mock.address.as_string = MagicMock(
            return_value="mock_address")
        wallet_mock.get_address = address_mock
        self.mock_wallet_service.create_spendable_wallet = MagicMock(
            return_value=wallet_mock
        )

        with (
            patch(
                "src.controllers.wallet.randomly_fund_mock_wallet"
            ) as randomly_fund_mock_wallet_mock,
            patch("src.controllers.wallet.sleep", return_value=None),
            patch.object(
                WalletService,
                "create_spendable_descriptor",
                return_value=spendable_descriptor_mock,
            ) as create_spendable_descriptor_mock,
            patch.object(
                WalletService, "create_spendable_wallet", return_value=wallet_mock
            ) as create_spendable_wallet_mock,
        ):
            wallet_response = self.test_client.post(
                "/wallet/spendable",
                json={
                    "network": "TESTNET",
                    "type": "P2PK",
                    "utxoCount": "4",
                    "minUtxoAmount": "1",
                    "maxUtxoAmount": "2",
                },
            )
            create_spendable_descriptor_mock.assert_called_once_with(
                bdk.Network.TESTNET, "P2PK"
            )
            create_spendable_wallet_mock.assert_called_once_with(
                bdk.Network.TESTNET, spendable_descriptor_mock
            )
            wallet_mock.get_address.assert_called_once_with(
                bdk.AddressIndex.LAST_UNUSED()
            )
            randomly_fund_mock_wallet_mock.assert_called_once_with(
                "mock_address", 1.0, 2.0, 4
            )
            assert json.loads(wallet_response.data) == {
                "message": "wallet created successfully",
                "descriptor": "mock_descriptor",
                "network": "TESTNET",
            }
            assert wallet_response.status == "200 OK"

    def test_spendable_descriptor_error(self):
        self.mock_wallet_service = MagicMock(WalletService)

        spendable_descriptor_mock = MagicMock(bdk.Descriptor)
        spendable_descriptor_mock.as_string = MagicMock(
            return_value="mock_descriptor")
        self.mock_wallet_service.create_spendable_descriptor = MagicMock(
            return_value=spendable_descriptor_mock
        )
        wallet_mock = MagicMock(bdk.Wallet)
        get_address_mock = MagicMock()
        address_mock = MagicMock(return_value=get_address_mock)
        get_address_mock.address.as_string = MagicMock(
            return_value="mock_address")
        wallet_mock.get_address = address_mock
        self.mock_wallet_service.create_spendable_wallet = MagicMock(
            return_value=wallet_mock
        )

        with (
            patch(
                "src.controllers.wallet.randomly_fund_mock_wallet"
            ) as randomly_fund_mock_wallet_mock,
            patch("src.controllers.wallet.sleep", return_value=None),
            patch.object(
                WalletService,
                "create_spendable_descriptor",
                return_value=None,
            ) as create_spendable_descriptor_mock,
            patch.object(
                WalletService, "create_spendable_wallet", return_value=wallet_mock
            ) as create_spendable_wallet_mock,
        ):
            wallet_response = self.test_client.post(
                "/wallet/spendable",
                json={
                    "network": "TESTNET",
                    "type": "P2PK",
                    "utxoCount": "4",
                    "minUtxoAmount": "1",
                    "maxUtxoAmount": "2",
                },
            )
            create_spendable_descriptor_mock.assert_called_once_with(
                bdk.Network.TESTNET, "P2PK"
            )
            create_spendable_wallet_mock.assert_not_called()
            wallet_mock.get_address.assert_not_called()
            randomly_fund_mock_wallet_mock.assert_not_called()
            assert json.loads(wallet_response.data) == {
                "message": "Error creating wallet",
            }
            assert wallet_response.status == "400 BAD REQUEST"

    def test_spendable_randomly_fund_mock_wallet_error(self):
        self.mock_wallet_service = MagicMock(WalletService)

        spendable_descriptor_mock = MagicMock(bdk.Descriptor)
        spendable_descriptor_mock.as_string = MagicMock(
            return_value="mock_descriptor")
        self.mock_wallet_service.create_spendable_descriptor = MagicMock(
            return_value=spendable_descriptor_mock
        )
        wallet_mock = MagicMock(bdk.Wallet)
        get_address_mock = MagicMock()
        address_mock = MagicMock(return_value=get_address_mock)
        get_address_mock.address.as_string = MagicMock(
            return_value="mock_address")
        wallet_mock.get_address = address_mock
        self.mock_wallet_service.create_spendable_wallet = MagicMock(
            return_value=wallet_mock
        )

        with (
            patch(
                "src.controllers.wallet.randomly_fund_mock_wallet"
            ) as randomly_fund_mock_wallet_mock,
            patch("src.controllers.wallet.sleep", return_value=None),
            patch.object(
                WalletService,
                "create_spendable_descriptor",
                return_value=spendable_descriptor_mock,
            ) as create_spendable_descriptor_mock,
            patch.object(
                WalletService, "create_spendable_wallet", return_value=wallet_mock
            ) as create_spendable_wallet_mock,
        ):
            randomly_fund_mock_wallet_mock.side_effect = Exception(
                "mock exception")
            wallet_response = self.test_client.post(
                "/wallet/spendable",
                json={
                    "network": "TESTNET",
                    "type": "P2PK",
                    "utxoCount": "4",
                    "minUtxoAmount": "1",
                    "maxUtxoAmount": "2",
                },
            )
            create_spendable_descriptor_mock.assert_called_once_with(
                bdk.Network.TESTNET, "P2PK"
            )
            create_spendable_wallet_mock.assert_called_once_with(
                bdk.Network.TESTNET, spendable_descriptor_mock
            )
            wallet_mock.get_address.assert_called()
            randomly_fund_mock_wallet_mock.assert_called()
            assert json.loads(wallet_response.data) == {
                "message": "Error funding wallet",
            }
            assert wallet_response.status == "400 BAD REQUEST"

    def test_spendable_request_error(self):
        self.mock_wallet_service = MagicMock(WalletService)

        spendable_descriptor_mock = MagicMock(bdk.Descriptor)
        spendable_descriptor_mock.as_string = MagicMock(
            return_value="mock_descriptor")
        self.mock_wallet_service.create_spendable_descriptor = MagicMock(
            return_value=spendable_descriptor_mock
        )
        wallet_mock = MagicMock(bdk.Wallet)
        get_address_mock = MagicMock()
        address_mock = MagicMock(return_value=get_address_mock)
        get_address_mock.address.as_string = MagicMock(
            return_value="mock_address")
        wallet_mock.get_address = address_mock
        self.mock_wallet_service.create_spendable_wallet = MagicMock(
            return_value=wallet_mock
        )

        with (
            patch(
                "src.controllers.wallet.randomly_fund_mock_wallet"
            ) as randomly_fund_mock_wallet_mock,
            patch("src.controllers.wallet.sleep", return_value=None),
            patch.object(
                WalletService,
                "create_spendable_descriptor",
                return_value=None,
            ) as create_spendable_descriptor_mock,
            patch.object(
                WalletService, "create_spendable_wallet", return_value=wallet_mock
            ) as create_spendable_wallet_mock,
        ):
            wallet_response = self.test_client.post(
                "/wallet/spendable",
                json={"bad": "data"},
            )
            create_spendable_descriptor_mock.assert_not_called()
            create_spendable_wallet_mock.assert_not_called()
            wallet_mock.get_address.assert_not_called()
            randomly_fund_mock_wallet_mock.assert_not_called()
            wallet_response_data = json.loads(wallet_response.data)
            assert wallet_response_data["message"] == "Error creating wallet"

            assert (
                wallet_response_data["errors"] is not None
            ), "Errors array does not exist"
            assert wallet_response.status == "400 BAD REQUEST"
