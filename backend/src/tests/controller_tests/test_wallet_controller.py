from unittest import TestCase
from unittest.mock import MagicMock, patch


from src.services import WalletService
from src.app import AppCreator
from src.services.global_data_store.global_data_store import GlobalDataStore
import json

from src.types.script_types import ScriptType


class TestWalletController(TestCase):
    def setUp(self):
        app_creator = AppCreator()
        self.app = app_creator.create_app()
        self.test_client = self.app.test_client()

    def test_wallet_controller_success(self):
        with patch.object(
            GlobalDataStore, "set_global_descriptor"
        ) as set_global_descriptor_mock, patch.object(
            GlobalDataStore, "set_global_network"
        ) as set_global_network_mock, patch.object(
            GlobalDataStore, "set_global_electrum_url"
        ) as set_global_eletrum_url_mock:
            descriptor = "mock_descriptor"
            network = "mock_network"
            electrum_url = "mock_electrum_url"
            wallet_response = self.test_client.post(
                "/wallet/",
                json={
                    "descriptor": descriptor,
                    "network": network,
                    "electrumUrl": electrum_url,
                },
            )

            set_global_descriptor_mock.assert_called_with(descriptor)
            set_global_network_mock.assert_called_with(network)
            set_global_eletrum_url_mock.assert_called_with(electrum_url)

            assert wallet_response.status == "200 OK"
            assert json.loads(wallet_response.data) == {
                "message": "wallet created successfully",
                "descriptor": descriptor,
                "network": network,
                "electrumUrl": electrum_url,
            }

    def test_wallet_controller_request_validation_error(self):
        with patch.object(
            GlobalDataStore, "set_global_descriptor"
        ) as set_global_descriptor_mock, patch.object(
            GlobalDataStore, "set_global_network"
        ) as set_global_network_mock, patch.object(
            GlobalDataStore, "set_global_electrum_url"
        ) as set_global_eletrum_url_mock:
            wallet_response = self.test_client.post(
                "/wallet/",
                json={},
            )

            set_global_descriptor_mock.assert_not_called()
            set_global_network_mock.assert_not_called()
            set_global_eletrum_url_mock.assert_not_called()

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
