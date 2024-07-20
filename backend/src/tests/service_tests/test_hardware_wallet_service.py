from unittest.case import TestCase
from unittest.mock import MagicMock, patch

from src.services.hardware_wallet.hardware_wallet import (
    HardwareWalletDetails,
    HardwareWalletService,
)


class TestHardwareWalletService(TestCase):
    def test_get_cipher_suite(self):
        mock_key = b"mockkey"
        mock_fernet_instance = MagicMock()

        with patch(
            "src.services.hardware_wallet.hardware_wallet.Fernet"
        ) as MockFernet, patch(
            "src.services.hardware_wallet.hardware_wallet.Fernet.generate_key"
        ) as mock_generate_key:
            mock_generate_key.return_value = mock_key
            MockFernet.return_value = mock_fernet_instance

            cipher_suite = HardwareWalletService.get_cipher_suite()

            mock_generate_key.assert_called_once()
            assert cipher_suite == mock_fernet_instance

            # call it again and assert it did not call generate_key again,
            # it should just return the cipher_suite
            cipher_suite = HardwareWalletService.get_cipher_suite()
            mock_generate_key.assert_called_once()
            assert cipher_suite == mock_fernet_instance

    def test_get_connected_hardware_wallets(self):
        with patch.object(
            HardwareWalletService, "scan_for_hardware_wallets"
        ) as scan_for_hardware_wallets_mock, patch.object(
            HardwareWalletService, "save_hardware_wallet"
        ) as save_hardware_wallet_mock:
            hardware_wallet_detail_mock_one = HardwareWalletDetails(
                id=None,
                type="trezor",
                path=None,
                label=None,
                model="trezor_t",
                needs_pin_sent=False,
                needs_passphrase_sent=False,
                fingerprint=None,
            )
            hardware_wallet_detail_mock_two = HardwareWalletDetails(
                id=None,
                type="trezor",
                path=None,
                label=None,
                model="trezor_one",
                needs_pin_sent=False,
                needs_passphrase_sent=False,
                fingerprint=None,
            )

            scan_for_hardware_wallets_mock.return_value = [
                hardware_wallet_detail_mock_one,
                hardware_wallet_detail_mock_two,
            ]

            hardware_wallet_mock_one = MagicMock()
            hardware_wallet_mock_one.id = "1"
            hardware_wallet_mock_two = MagicMock()
            hardware_wallet_mock_two.id = "2"

            # on first call return mock_one,
            # on second call return mock_two
            save_hardware_wallet_mock.return_value = None
            save_hardware_wallet_mock.side_effect = [
                hardware_wallet_detail_mock_one,
                hardware_wallet_detail_mock_two,
            ]
            wallets = HardwareWalletService.get_connected_hardware_wallets()

            # expect response to be a list of HardwareWalletDetails with ids taken from the hardware_wallet_mocks
            hardware_wallet_detail_mock_one.id = "1"
            hardware_wallet_detail_mock_two.id = "2"
            assert wallets == [
                hardware_wallet_detail_mock_one,
                hardware_wallet_detail_mock_two,
            ]

    def test_close_and_remove_all_hardware_wallets(self):
        hardware_wallet_mocks = [MagicMock(), MagicMock()]
        hardware_wallet_connect_mock = MagicMock()
        with patch(
            "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
        ) as HardwareWalletMock, patch.object(
            HardwareWalletService, "connect_to_hardware_wallet"
        ) as connect_to_hardware_wallet_mock, patch.object(
            HardwareWalletService, "close_device"
        ) as close_device_mock, patch(
            "src.services.hardware_wallet.hardware_wallet.DB.session"
        ) as DB_session_mock:
            HardwareWalletMock.query.all.return_value = hardware_wallet_mocks
            connect_to_hardware_wallet_mock.return_value = None
            connect_to_hardware_wallet_mock.side_effect = [
                hardware_wallet_connect_mock,
                None,
            ]

            was_removed = HardwareWalletService.close_and_remove_all_hardware_wallets()

            assert connect_to_hardware_wallet_mock.call_count == 2
            # only called once since one of the connect_to_hardware_wallets is None, which we don't want to attempt to close.
            assert close_device_mock.call_count == 1

            assert DB_session_mock.delete.call_count == 2
            assert DB_session_mock.commit.call_count == 1

            assert was_removed is True

    def test_scan_for_hardware_wallets_success(self):
        connected_hardware_wallets_mock = [
            {
                "type": "trezor",
                "model": "trezor_t",
                "needs_pin_sent": False,
                "needs_passphrase_sent": False,
                "fingerprint": None,
            }
        ]
        with patch(
            "src.services.hardware_wallet.hardware_wallet.commands.enumerate",
            return_value=connected_hardware_wallets_mock,
        ) as enumerate_mock:
            hardware_wallet_details = HardwareWalletService.scan_for_hardware_wallets()
            enumerate_mock.assert_called_once()
            assert len(hardware_wallet_details) == 1
            # assert that pydantic model was created from dictionary
            self.assertIsInstance(hardware_wallet_details[0], HardwareWalletDetails)

    def test_scan_for_hardware_wallets_when_no_wallets_found(self):
        connected_hardware_wallets_mock = []
        with patch(
            "src.services.hardware_wallet.hardware_wallet.commands.enumerate",
            return_value=connected_hardware_wallets_mock,
        ) as enumerate_mock:
            hardware_wallet_details = HardwareWalletService.scan_for_hardware_wallets()
            enumerate_mock.assert_called_once()
            assert hardware_wallet_details == []

    def test_scan_for_hardware_wallets_when_pydantic_validation_error(self):
        connected_hardware_wallets_mock = [
            {
                "needs_pin_sent": False,
                "needs_passphrase_sent": False,
                "fingerprint": None,
                "unexpected_field": "unexpected_field",
            }
        ]
        with patch(
            "src.services.hardware_wallet.hardware_wallet.commands.enumerate",
            return_value=connected_hardware_wallets_mock,
        ) as enumerate_mock:
            hardware_wallet_details = HardwareWalletService.scan_for_hardware_wallets()
            enumerate_mock.assert_called_once()
            # validation error captured and empty list returned
            assert hardware_wallet_details == []

    def test_save_hardware_wallet(self):
        hardware_wallet_mock = MagicMock()
        mock_hardware_wallet_details = HardwareWalletDetails(
            id=None,
            type="trezor",
            path=None,
            label=None,
            model="trezor_t",
            needs_pin_sent=False,
            needs_passphrase_sent=False,
            fingerprint=None,
        )
        with patch(
            "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
            return_value=hardware_wallet_mock,
        ), patch(
            "src.services.hardware_wallet.hardware_wallet.DB.session"
        ) as DB_session_mock:
            response = HardwareWalletService.save_hardware_wallet(
                mock_hardware_wallet_details
            )

            DB_session_mock.add.assert_called_once_with(hardware_wallet_mock)
            DB_session_mock.commit.assert_called_once()
            assert response == hardware_wallet_mock
