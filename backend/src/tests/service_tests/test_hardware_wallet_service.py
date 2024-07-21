from unittest.case import TestCase
from unittest.mock import MagicMock, patch
from hwilib import common

from src.services.hardware_wallet.hardware_wallet import (
    HardwareWalletDetails,
    HardwareWalletService,
)


class TestHardwareWalletService(TestCase):
    def test_get_cipher_suite(self):
        mock_key = b"mockkey"
        mock_fernet_instance = MagicMock()

        with (
            patch("src.services.hardware_wallet.hardware_wallet.Fernet") as MockFernet,
            patch(
                "src.services.hardware_wallet.hardware_wallet.Fernet.generate_key"
            ) as mock_generate_key,
        ):
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
        with (
            patch.object(
                HardwareWalletService, "scan_for_hardware_wallets"
            ) as scan_for_hardware_wallets_mock,
            patch.object(
                HardwareWalletService, "save_hardware_wallet"
            ) as save_hardware_wallet_mock,
        ):
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
        with (
            patch(
                "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
            ) as HardwareWalletMock,
            patch.object(
                HardwareWalletService, "connect_to_hardware_wallet"
            ) as connect_to_hardware_wallet_mock,
            patch.object(HardwareWalletService, "close_device") as close_device_mock,
            patch(
                "src.services.hardware_wallet.hardware_wallet.DB.session"
            ) as DB_session_mock,
        ):
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
        with (
            patch(
                "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
                return_value=hardware_wallet_mock,
            ),
            patch(
                "src.services.hardware_wallet.hardware_wallet.DB.session"
            ) as DB_session_mock,
        ):
            response = HardwareWalletService.save_hardware_wallet(
                mock_hardware_wallet_details
            )

            DB_session_mock.add.assert_called_once_with(hardware_wallet_mock)
            DB_session_mock.commit.assert_called_once()
            assert response == hardware_wallet_mock

    def test_prompt_to_unlock_wallet_success(self):
        connected_wallet_mock = MagicMock()
        with (
            patch.object(
                HardwareWalletService,
                "get_wallet_from_db_and_connect_to_device",
                return_value=connected_wallet_mock,
            ) as get_wallet_from_db_and_connect_to_device_mock,
            patch.object(
                HardwareWalletService,
                "prompt_device_to_prepare_for_pin",
                return_value=True,
            ) as prompt_device_to_prepare_for_pin_mock,
        ):
            response = HardwareWalletService.prompt_to_unlock_wallet("mock_wallet_id")
            get_wallet_from_db_and_connect_to_device_mock.assert_called_with(
                "mock_wallet_id"
            )

            prompt_device_to_prepare_for_pin_mock.assert_called_with(
                connected_wallet_mock
            )

            assert response == True

    def test_prompt_to_unlock_wallet_without_finding_wallet(self):
        connected_wallet_mock = None
        with (
            patch.object(
                HardwareWalletService,
                "get_wallet_from_db_and_connect_to_device",
                return_value=connected_wallet_mock,
            ) as get_wallet_from_db_and_connect_to_device_mock,
            patch.object(
                HardwareWalletService,
                "prompt_device_to_prepare_for_pin",
                return_value=True,
            ) as prompt_device_to_prepare_for_pin_mock,
        ):
            response = HardwareWalletService.prompt_to_unlock_wallet("mock_wallet_id")
            get_wallet_from_db_and_connect_to_device_mock.assert_called_with(
                "mock_wallet_id"
            )

            prompt_device_to_prepare_for_pin_mock.assert_not_called()

            assert response == False

    def test_prompt_to_unlock_wallet_failure(self):
        connected_wallet_mock = MagicMock()
        with (
            patch.object(
                HardwareWalletService,
                "get_wallet_from_db_and_connect_to_device",
                return_value=connected_wallet_mock,
            ) as get_wallet_from_db_and_connect_to_device_mock,
            patch.object(
                HardwareWalletService,
                "prompt_device_to_prepare_for_pin",
                return_value=False,
            ) as prompt_device_to_prepare_for_pin_mock,
        ):
            response = HardwareWalletService.prompt_to_unlock_wallet("mock_wallet_id")
            get_wallet_from_db_and_connect_to_device_mock.assert_called_with(
                "mock_wallet_id"
            )

            prompt_device_to_prepare_for_pin_mock.assert_called_with(
                connected_wallet_mock
            )

            assert response == False

    def test_send_pin_to_unlock_wallet_success(self):
        connected_wallet_mock = MagicMock()
        mock_pin = "1234"
        with (
            patch.object(
                HardwareWalletService,
                "get_wallet_from_db_and_connect_to_device",
                return_value=connected_wallet_mock,
            ) as get_wallet_from_db_and_connect_to_device_mock,
            patch.object(
                HardwareWalletService,
                "send_pin_to_device",
                return_value=True,
            ) as prompt_device_to_prepare_for_pin_mock,
        ):
            response = HardwareWalletService.send_pin_to_unlock_wallet(
                "mock_wallet_id", mock_pin
            )
            get_wallet_from_db_and_connect_to_device_mock.assert_called_with(
                "mock_wallet_id"
            )

            prompt_device_to_prepare_for_pin_mock.assert_called_with(
                connected_wallet_mock, mock_pin
            )

            assert response == True

    def test_send_pin_to_unlock_wallet_without_finding_connection(self):
        connected_wallet_mock = None
        mock_pin = "1234"
        with (
            patch.object(
                HardwareWalletService,
                "get_wallet_from_db_and_connect_to_device",
                return_value=connected_wallet_mock,
            ) as get_wallet_from_db_and_connect_to_device_mock,
            patch.object(
                HardwareWalletService,
                "send_pin_to_device",
                return_value=True,
            ) as prompt_device_to_prepare_for_pin_mock,
        ):
            response = HardwareWalletService.send_pin_to_unlock_wallet(
                "mock_wallet_id", mock_pin
            )
            get_wallet_from_db_and_connect_to_device_mock.assert_called_with(
                "mock_wallet_id"
            )

            prompt_device_to_prepare_for_pin_mock.assert_not_called()

            assert response == False

    def test_set_passphrase(self):
        passphrase_mock = "mock_passphrase"
        cipher_suite_mock = "cipher_suite_mock"
        hardware_wallet_mock = MagicMock()
        with (
            patch.object(
                HardwareWalletService,
                "get_cipher_suite",
                return_value=cipher_suite_mock,
            ),
            patch(
                "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
            ) as HardwareWalletMock,
            patch(
                "src.services.hardware_wallet.hardware_wallet.DB.session"
            ) as DB_session_mock,
        ):
            HardwareWalletMock.query.get.return_value = hardware_wallet_mock

            response = HardwareWalletService.set_passphrase(
                "mock_wallet_id", passphrase_mock
            )
            hardware_wallet_mock.set_encrypted_passphrase.assert_called_with(
                passphrase_mock, cipher_suite_mock
            )
            DB_session_mock.commit.assert_called_once()

            assert response == True

    def test_set_passphrase_no_hardware_wallet_found(self):
        passphrase_mock = "mock_passphrase"
        cipher_suite_mock = "cipher_suite_mock"
        hardware_wallet_mock = None
        with (
            patch.object(
                HardwareWalletService,
                "get_cipher_suite",
                return_value=cipher_suite_mock,
            ),
            patch(
                "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
            ) as HardwareWalletMock,
            patch(
                "src.services.hardware_wallet.hardware_wallet.DB.session"
            ) as DB_session_mock,
        ):
            HardwareWalletMock.query.get.return_value = hardware_wallet_mock

            response = HardwareWalletService.set_passphrase(
                "mock_wallet_id", passphrase_mock
            )
            DB_session_mock.commit.assert_not_called()

            assert response == False

    def test_get_xpub_from_device(self):
        connected_wallet_mock = MagicMock()
        mock_wallet_uuid = "mock_wallet_id"
        account_number_mock = 0
        addres_type_mock = common.AddressType.WIT
        chain_mock = common.Chain.MAIN
        with (
            patch.object(
                HardwareWalletService,
                "get_wallet_from_db_and_connect_to_device",
                return_value=connected_wallet_mock,
            ) as get_wallet_from_db_and_connect_to_device_mock,
            patch.object(
                HardwareWalletService,
                "get_xpub",
                return_value="mock_xpub",
            ) as get_xpub_mock,
        ):
            response = HardwareWalletService.get_xpub_from_device(
                mock_wallet_uuid, account_number_mock, addres_type_mock, chain_mock
            )
            get_wallet_from_db_and_connect_to_device_mock.assert_called_with(
                "mock_wallet_id", chain_mock
            )

            get_xpub_mock.assert_called_with(
                connected_wallet_mock,
                account_number_mock,
                addres_type_mock,
            )

            assert response == "mock_xpub"

    def test_get_xpub_from_device_device_not_found(self):
        connected_wallet_mock = None
        mock_wallet_uuid = "mock_wallet_id"
        account_number_mock = 0
        addres_type_mock = common.AddressType.WIT
        chain_mock = common.Chain.MAIN
        with (
            patch.object(
                HardwareWalletService,
                "get_wallet_from_db_and_connect_to_device",
                return_value=connected_wallet_mock,
            ) as get_wallet_from_db_and_connect_to_device_mock,
            patch.object(
                HardwareWalletService,
                "get_xpub",
                return_value="mock_xpub",
            ) as get_xpub_mock,
        ):
            response = HardwareWalletService.get_xpub_from_device(
                mock_wallet_uuid, account_number_mock, addres_type_mock, chain_mock
            )
            get_wallet_from_db_and_connect_to_device_mock.assert_called_with(
                "mock_wallet_id", chain_mock
            )

            get_xpub_mock.assert_not_called()

            assert response == None

    def test_get_wallet_from_db_and_connect_to_device(self):
        hardware_wallet_mock = MagicMock()
        connected_wallet_mock = MagicMock()
        mock_wallet_uuid = "mock_wallet_id"
        chain_mock = common.Chain.MAIN
        with (
            patch.object(
                HardwareWalletService,
                "connect_to_hardware_wallet",
                return_value=connected_wallet_mock,
            ) as connect_to_hardware_wallet_mock,
            patch(
                "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
            ) as HardwareWalletMock,
        ):
            HardwareWalletMock.query.get.return_value = hardware_wallet_mock
            response = HardwareWalletService.get_wallet_from_db_and_connect_to_device(
                mock_wallet_uuid, chain_mock
            )

            connect_to_hardware_wallet_mock.assert_called_with(
                hardware_wallet_mock, chain_mock
            )

            assert response == connected_wallet_mock

    def test_get_wallet_from_db_and_connect_to_device_without_wallet_found(self):
        hardware_wallet_mock = None
        connected_wallet_mock = MagicMock()
        mock_wallet_uuid = "mock_wallet_id"
        chain_mock = common.Chain.MAIN
        with (
            patch.object(
                HardwareWalletService,
                "connect_to_hardware_wallet",
                return_value=connected_wallet_mock,
            ) as connect_to_hardware_wallet_mock,
            patch(
                "src.services.hardware_wallet.hardware_wallet.HardwareWallet",
            ) as HardwareWalletMock,
        ):
            HardwareWalletMock.query.get.return_value = hardware_wallet_mock
            response = HardwareWalletService.get_wallet_from_db_and_connect_to_device(
                mock_wallet_uuid, chain_mock
            )

            connect_to_hardware_wallet_mock.assert_not_called()

            assert response == None

    def test_connect_to_hardware_wallet_with_path(self):
        hardware_wallet_mock = MagicMock()
        hardware_wallet_mock.encrypted_passphrase = "mock_encrypted_passphrase"
        hardware_wallet_mock.path = "mock_path"
        hardware_wallet_mock.finger_print = "mock_finger_print"
        decrypted_passphrase_mock = "mock_passphrase"
        get_decryted_passphrase_mock = MagicMock()
        get_decryted_passphrase_mock.return_value = decrypted_passphrase_mock
        hardware_wallet_mock.get_decrypted_passphrase = get_decryted_passphrase_mock
        cipher_suite_mock = "mock_cipher_suite"
        with (
            patch(
                "src.services.hardware_wallet.hardware_wallet.commands"
            ) as commands_mock,
            patch.object(
                HardwareWalletService,
                "get_cipher_suite",
                return_value=cipher_suite_mock,
            ) as get_cipher_suite_mock,
        ):
            mock_client = MagicMock()
            commands_mock.get_client.return_value = mock_client
            response = HardwareWalletService.connect_to_hardware_wallet(
                hardware_wallet_mock, common.Chain.TEST
            )
            get_cipher_suite_mock.assert_called_once()
            get_decryted_passphrase_mock.assert_called_once_with(cipher_suite_mock)
            commands_mock.get_client.assert_called_with(
                hardware_wallet_mock.type,
                hardware_wallet_mock.path,
                decrypted_passphrase_mock,
                False,
                common.Chain.TEST,
            )

            assert response == mock_client

    def test_connect_to_hardware_wallet_without_path(self):
        hardware_wallet_mock = MagicMock()
        hardware_wallet_mock.encrypted_passphrase = "mock_encrypted_passphrase"
        hardware_wallet_mock.path = None
        mock_finger_print = "mock_finger_print"
        hardware_wallet_mock.fingerprint = mock_finger_print
        decrypted_passphrase_mock = "mock_passphrase"
        get_decryted_passphrase_mock = MagicMock()
        get_decryted_passphrase_mock.return_value = decrypted_passphrase_mock
        hardware_wallet_mock.get_decrypted_passphrase = get_decryted_passphrase_mock
        cipher_suite_mock = "mock_cipher_suite"
        with (
            patch(
                "src.services.hardware_wallet.hardware_wallet.commands"
            ) as commands_mock,
            patch.object(
                HardwareWalletService,
                "get_cipher_suite",
                return_value=cipher_suite_mock,
            ) as get_cipher_suite_mock,
        ):
            mock_client = MagicMock()
            commands_mock.find_device.return_value = mock_client
            response = HardwareWalletService.connect_to_hardware_wallet(
                hardware_wallet_mock, common.Chain.TEST
            )
            get_cipher_suite_mock.assert_called_once()
            get_decryted_passphrase_mock.assert_called_once_with(cipher_suite_mock)
            commands_mock.find_device.assert_called_with(
                decrypted_passphrase_mock,
                hardware_wallet_mock.type,
                mock_finger_print,
                False,
                common.Chain.TEST,
            )

            assert response == mock_client

    def test_connect_to_hardware_wallet_without_passphrase(self):
        hardware_wallet_mock = MagicMock()
        hardware_wallet_mock.encrypted_passphrase = None
        hardware_wallet_mock.path = "mock_path"
        mock_finger_print = "mock_finger_print"
        hardware_wallet_mock.fingerprint = mock_finger_print
        decrypted_passphrase_mock = "mock_passphrase"
        get_decryted_passphrase_mock = MagicMock()
        get_decryted_passphrase_mock.return_value = decrypted_passphrase_mock
        hardware_wallet_mock.get_decrypted_passphrase = get_decryted_passphrase_mock
        cipher_suite_mock = "mock_cipher_suite"
        with (
            patch(
                "src.services.hardware_wallet.hardware_wallet.commands"
            ) as commands_mock,
            patch.object(
                HardwareWalletService,
                "get_cipher_suite",
                return_value=cipher_suite_mock,
            ) as get_cipher_suite_mock,
        ):
            mock_client = MagicMock()
            commands_mock.get_client.return_value = mock_client
            response = HardwareWalletService.connect_to_hardware_wallet(
                hardware_wallet_mock, common.Chain.TEST
            )
            get_cipher_suite_mock.assert_not_called()
            get_decryted_passphrase_mock.assert_not_called()
            commands_mock.get_client.assert_called_with(
                hardware_wallet_mock.type,
                hardware_wallet_mock.path,
                None,
                False,
                common.Chain.TEST,
            )

            assert response == mock_client

    def test_prompt_device_to_prepare_for_pin(self):
        connected_wallet_mock = MagicMock()

        connected_wallet_mock.prompt_pin.return_value = True
        response = HardwareWalletService.prompt_device_to_prepare_for_pin(
            connected_wallet_mock
        )
        connected_wallet_mock.prompt_pin.assert_called_once_with()
        assert response == True

    def test_send_pin_to_device(self):
        connected_wallet_mock = MagicMock()

        connected_wallet_mock.send_pin.return_value = False
        mock_pin = "1234"
        response = HardwareWalletService.send_pin_to_device(
            connected_wallet_mock, mock_pin
        )
        connected_wallet_mock.send_pin.assert_called_once_with(mock_pin)
        assert response == False

    def test_close_device(self):
        connected_wallet_mock = MagicMock()

        connected_wallet_mock.close.return_value = False
        response = HardwareWalletService.close_device(connected_wallet_mock)
        connected_wallet_mock.close.assert_called_once_with()
        assert response == False

    def test_get_xpub(self):
        connected_wallet_mock = MagicMock()
        mock_account_number = 2
        mock_address_type = common.AddressType.TAP
        mock_xpub = MagicMock()
        mock_xpub_string = "mock_xpub"
        mock_xpub.to_string.return_value = mock_xpub_string

        connected_wallet_mock.get_master_xpub.return_value = mock_xpub
        response = HardwareWalletService.get_xpub(
            connected_wallet_mock, mock_account_number, mock_address_type
        )
        connected_wallet_mock.get_master_xpub.assert_called_once_with(
            mock_address_type, mock_account_number
        )
        assert response == mock_xpub_string

    def test_get_script_type_from_derivation_path_legacy(self):
        derivation_path_legacy = "m/44'/0'/0'/0/0"

        response = HardwareWalletService.get_script_type_from_derivation_path(
            derivation_path_legacy
        )
        assert response == common.AddressType.LEGACY

    def test_get_script_type_from_derivation_path_wrapped_segwit(self):
        derivation_path_wrapped_witness = "m/49'/0'/0'/0/0"

        response = HardwareWalletService.get_script_type_from_derivation_path(
            derivation_path_wrapped_witness
        )
        assert response == common.AddressType.SH_WIT

    def test_get_script_type_from_derivation_path_segwit(self):
        derivation_path_segwit = "m/84'/0'/0'/0/0"

        response = HardwareWalletService.get_script_type_from_derivation_path(
            derivation_path_segwit
        )
        assert response == common.AddressType.WIT

    def test_get_script_type_from_derivation_path_tap(self):
        derivation_path_taproot = "m/86'/0'/0'/0/0"

        response = HardwareWalletService.get_script_type_from_derivation_path(
            derivation_path_taproot
        )
        assert response == common.AddressType.TAP

    def test_get_script_type_from_invalid_derivation_path(self):
        derivation_path_invalid = "m/100'/0'/0'/0/0"

        response = HardwareWalletService.get_script_type_from_derivation_path(
            derivation_path_invalid
        )
        assert response == False
