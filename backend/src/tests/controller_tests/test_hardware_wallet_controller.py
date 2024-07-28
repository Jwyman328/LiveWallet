from unittest.case import TestCase

from hwilib import common

from hwilib.common import Chain
import json
from unittest.mock import patch, ANY


from src.app import AppCreator
from src.services.hardware_wallet.hardware_wallet import (
    HardwareWalletDetails,
    HardwareWalletService,
)


class TestWalletController(TestCase):
    def setUp(self):
        app_creator = AppCreator()
        self.app = app_creator.create_app()
        self.test_client = self.app.test_client()
        self.hardware_wallet_details_mock = [
            HardwareWalletDetails(
                id=None,
                type="trezor",
                path="mock_path",
                label="mock_label",
                model="mock_model",
                needs_pin_sent=False,
                needs_passphrase_sent=False,
                fingerprint=None,
            )
        ]

    def test_scan_for_wallet_controller_success(self):
        with patch.object(
            HardwareWalletService,
            "get_connected_hardware_wallets",
            return_value=self.hardware_wallet_details_mock,
        ) as get_connected_hardware_wallets_mock:
            response = self.test_client.get(
                "/hardware-wallets/",
            )
            get_connected_hardware_wallets_mock.assert_called_once()

            assert response.status == "200 OK"
            assert json.loads(response.data) == {
                "wallets": [
                    {
                        "id": None,
                        "type": "trezor",
                        "path": "mock_path",
                        "label": "mock_label",
                        "model": "mock_model",
                        "needs_pin_sent": False,
                        "needs_passphrase_sent": False,
                        "fingerprint": None,
                    }
                ]
            }

    def test_close_and_remove_wallets_controller_success(self):
        with patch.object(
            HardwareWalletService,
            "close_and_remove_all_hardware_wallets",
            return_value=True,
        ) as close_and_remove_all_hardware_wallets_mock:
            response = self.test_client.delete(
                "hardware-wallets/close",
            )
            close_and_remove_all_hardware_wallets_mock.assert_called_once()

            assert response.status == "200 OK"
            assert json.loads(response.data) == {
                "was_close_and_remove_successful": True
            }

    def test_prompt_unlock_wallet_controller_success(self):
        with patch.object(
            HardwareWalletService,
            "prompt_to_unlock_wallet",
            return_value=True,
        ) as prompt_to_unlock_wallet_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/prompt",
            )
            prompt_to_unlock_wallet_mock.assert_called_once_with("mock_uuid")

            assert response.status == "200 OK"
            assert json.loads(response.data) == {"was_prompt_successful": True}

    def test_unlock_wallet_controller_success(self):
        with patch.object(
            HardwareWalletService,
            "send_pin_to_unlock_wallet",
            return_value=True,
        ) as send_pin_to_unlock_wallet_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/pin",
                json={"pin": "mock_pin"},
            )
            send_pin_to_unlock_wallet_mock.assert_called_once_with(
                "mock_uuid", "mock_pin"
            )

            assert response.status == "200 OK"
            assert json.loads(response.data) == {"was_unlock_successful": True}

    def test_set_passphrase_controller_success(self):
        with patch.object(
            HardwareWalletService,
            "set_passphrase",
            return_value=True,
        ) as set_passphrase_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/passphrase",
                json={"passphrase": "mock_passphrase"},
            )
            set_passphrase_mock.assert_called_once_with("mock_uuid", "mock_passphrase")

            assert response.status == "200 OK"
            assert json.loads(response.data) == {"was_passphrase_set": True}

    def test_set_passphrase_controller_empty_string_passphrase_success(self):
        with patch.object(
            HardwareWalletService,
            "set_passphrase",
            return_value=True,
        ) as set_passphrase_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/passphrase",
                json={"passphrase": ""},
            )
            set_passphrase_mock.assert_called_once_with("mock_uuid", "")

            assert response.status == "200 OK"
            assert json.loads(response.data) == {"was_passphrase_set": True}

    def test_set_passphrase_controller_empty_passphrase_error(self):
        with patch.object(
            HardwareWalletService,
            "set_passphrase",
            return_value=False,
        ) as set_passphrase_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/passphrase",
                json={"passphrase": None},
            )
            set_passphrase_mock.assert_not_called()

            assert response.status == "400 BAD REQUEST"
            assert json.loads(response.data) == {
                "message": "Error setting passphrase",
                "errors": ANY,
            }

    def test_get_xpub_controller_success(self):
        with patch.object(
            HardwareWalletService,
            "get_xpub_from_device",
            return_value="mock_xpub",
        ) as get_xpub_from_device_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/xpub",
                json={
                    "derivation_path": "m/86'/0'/0'/0/0",
                    "account_number": 1,
                    "network": "BITCOIN",
                },
            )
            get_xpub_from_device_mock.assert_called_once_with(
                "mock_uuid", 1, common.AddressType.TAP, Chain.MAIN
            )

            assert response.status == "200 OK"
            assert json.loads(response.data) == {"xpub": "mock_xpub"}

    def test_get_xpub_controller_invalid_derivation_path(self):
        with patch.object(
            HardwareWalletService,
            "get_xpub_from_device",
            return_value="mock_xpub",
        ) as get_xpub_from_device_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/xpub",
                json={
                    "derivation_path": "m/100'/0'/0'/0/0",
                    "account_number": 1,
                    "network": "BITCOIN",
                },
            )
            get_xpub_from_device_mock.assert_not_called()

            assert response.status == "400 BAD REQUEST"
            assert json.loads(response.data) == {
                "message": "Derivation path was invalid",
                "errors": ["Derivation path was invalid"],
            }

    def test_get_xpub_controller_invalid_network(self):
        with patch.object(
            HardwareWalletService,
            "get_xpub_from_device",
            return_value="mock_xpub",
        ) as get_xpub_from_device_mock:
            response = self.test_client.post(
                "hardware-wallets/unlock/mock_uuid/xpub",
                json={
                    "derivation_path": "m/86'/0'/0'/0/0",
                    "account_number": 1,
                    "network": "Invalid",
                },
            )
            get_xpub_from_device_mock.assert_not_called()

            assert response.status == "400 BAD REQUEST"
            assert json.loads(response.data) == {
                "message": "Error getting xpub from hardware wallet",
                "errors": ANY,
            }
