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
