import re
from typing import List, Optional

from hwilib import common
from src.database import DB

from hwilib import commands
from hwilib.common import Chain
from hwilib.hwwclient import HardwareWalletClient
from pydantic import BaseModel, TypeAdapter
from src.models.hardware_wallet import HardwareWallet
import structlog

from cryptography.fernet import Fernet

LOGGER = structlog.get_logger()


class HardwareWalletDetails(BaseModel):
    id: Optional[str] = None
    type: str
    path: Optional[str] = None
    label: Optional[str] = None
    model: str
    needs_pin_sent: bool
    needs_passphrase_sent: bool
    fingerprint: Optional[str] = None


class HardwareWalletService:
    # Class variable
    cipher_suite = None

    @classmethod
    def get_cipher_suite(cls):
        """Return the singleton instance of cipher_suite."""
        if cls.cipher_suite is None:
            # Initialize the cipher_suite if it does not exist
            key = Fernet.generate_key()
            cls.cipher_suite = Fernet(key)
        return cls.cipher_suite

    @staticmethod
    def get_connected_hardware_wallets() -> List[HardwareWalletDetails]:
        "Get the hardware wallets that are connected to the computer, add them to the database and return them as a pydantic model with the id attached"
        hwws_found = HardwareWalletService.scan_for_hardware_wallets()

        # put the hw in the db to generate a persistent id
        hwws_in_db = [
            HardwareWalletService.save_hardware_wallet(hww) for hww in hwws_found
        ]

        # add id generated from adding the hw to the db
        # to the pydantic hww object
        for index, hww_with_id in enumerate(hwws_in_db):
            hwws_found[index].id = hww_with_id.id
        return hwws_found

    @staticmethod
    def scan_for_hardware_wallets() -> List[HardwareWalletDetails]:
        "Scan the computer for connected hardware wallets"
        try:
            hws_found = commands.enumerate()
            LOGGER.info("Hardware wallets found", wallets=hws_found)

            hw_details_adapter = TypeAdapter(List[HardwareWalletDetails])

            # Convert and validate the data
            hws_found = hw_details_adapter.validate_python(hws_found)
            return hws_found if hws_found else []
        except Exception as e:
            LOGGER.error("Error scanning for hardware wallets", error=e)
            return []

    @staticmethod
    def save_hardware_wallet(
        hardware_wallet_details: HardwareWalletDetails,
    ) -> HardwareWallet:
        "Save the hardware wallet to the database"
        hardware_wallet = HardwareWallet(
            path=hardware_wallet_details.path,
            label=hardware_wallet_details.label,
            model=hardware_wallet_details.model,
            needs_pin_sent=hardware_wallet_details.needs_pin_sent,
            needs_passphrase_sent=hardware_wallet_details.needs_passphrase_sent,
            fingerprint=hardware_wallet_details.fingerprint,
            type=hardware_wallet_details.type,
        )

        DB.session.add(hardware_wallet)
        DB.session.commit()
        return hardware_wallet

    @staticmethod
    def prompt_to_unlock_wallet(wallet_uuid: str) -> bool:
        """Unlock it"""
        wallet: Optional[HardwareWallet] = HardwareWallet.query.get(wallet_uuid)
        if wallet is None:
            LOGGER.info("Wallet not found in db", wallet_uuid=wallet_uuid)
            return False

        connected_wallet = HardwareWalletService.connect_to_hardware_wallet(wallet)

        if connected_wallet is None:
            LOGGER.info(
                "Wallet unable to connect to hardware device", wallet_uuid=wallet_uuid
            )
            return False

        was_prompt_successful = HardwareWalletService.prompt_device_to_prepare_for_pin(
            connected_wallet
        )
        return was_prompt_successful

    @staticmethod
    def send_pin_to_unlock_wallet(wallet_uuid: str, pin: str) -> bool:
        """Unlock wallet: TODO more info"""
        wallet: Optional[HardwareWallet] = HardwareWallet.query.get(wallet_uuid)
        if wallet is None:
            LOGGER.info("Wallet not found in db", wallet_uuid=wallet_uuid)
            return False

        connected_wallet = HardwareWalletService.connect_to_hardware_wallet(wallet)

        if connected_wallet is None:
            LOGGER.info(
                "Wallet unable to connect to hardware device", wallet_uuid=wallet_uuid
            )
            return False

        was_unlock_successful = HardwareWalletService.send_pin_to_device(
            connected_wallet, pin
        )

        return was_unlock_successful

    @staticmethod
    def set_passphrase(wallet_uuid: str, passphrase: str) -> bool:
        """Set passphrase to : TODO more info"""
        try:
            wallet: Optional[HardwareWallet] = HardwareWallet.query.get(wallet_uuid)
            if wallet is None:
                LOGGER.info("Wallet not found in db", wallet_uuid=wallet_uuid)
                return False

            wallet.set_encrypted_passphrase(
                passphrase, HardwareWalletService.get_cipher_suite()
            )
            DB.session.commit()
            return True
        except Exception as e:
            LOGGER.info("Error adding passphrase to wallet", error=e)
            return False

    @staticmethod
    def get_xpub_from_device(
        wallet_uuid: str, account_number: int, address_type: common.AddressType
    ) -> Optional[str]:
        """TODO more info"""
        wallet: Optional[HardwareWallet] = HardwareWallet.query.get(wallet_uuid)
        if wallet is None:
            LOGGER.info("Wallet not found in db", wallet_uuid=wallet_uuid)
            return None

        connected_wallet = HardwareWalletService.connect_to_hardware_wallet(wallet)

        if connected_wallet is None:
            LOGGER.info(
                "Wallet unable to connect to hardware device", wallet_uuid=wallet_uuid
            )
            return None

        xpub = None
        try:
            xpub = HardwareWalletService.get_xpub(
                connected_wallet, account_number, address_type
            )

        except Exception as e:
            LOGGER.info("caught it error", error=e)

        return xpub

    @classmethod
    def connect_to_hardware_wallet(
        cls,
        hardware_wallet_details: HardwareWallet,
        chain: Chain = Chain.MAIN,
    ) -> Optional[HardwareWalletClient]:
        "Connect to the hardware wallet on the local system"
        # do I need this log?
        LOGGER.info("what is hw details", hw=hardware_wallet_details.type)
        password = hardware_wallet_details.encrypted_passphrase
        if password is not None:
            cipher_suite = cls.get_cipher_suite()
            password = hardware_wallet_details.get_decrypted_passphrase(cipher_suite)

        if hardware_wallet_details.path:
            hardware_wallet_connection = commands.get_client(
                hardware_wallet_details.type,
                hardware_wallet_details.path,
                password,
                False,
                chain,
            )
        else:
            hardware_wallet_connection = commands.find_device(
                password,
                hardware_wallet_details.type,
                hardware_wallet_details.fingerprint,
                False,
                chain,
            )

        return hardware_wallet_connection

    @staticmethod
    def prompt_device_to_prepare_for_pin(
        hardware_wallet_connection: HardwareWalletClient,
    ) -> bool:
        """Prompt the user to enter the pin for the hardware wallet
        and return true if prompt was successful"""
        return hardware_wallet_connection.prompt_pin()

    @staticmethod
    def send_pin_to_device(
        hardware_wallet_connection: HardwareWalletClient,
        pin: str,
    ) -> bool:
        "Send the pin to the hardware wallet, and return if pin was valid."
        return hardware_wallet_connection.send_pin(pin)

    @staticmethod
    def get_xpub(
        hardware_wallet_connection: HardwareWalletClient,
        account_number: int,
        address_type: common.AddressType = common.AddressType.WIT,
    ) -> Optional[str]:
        """TODO add docstring"""
        master_xpub = hardware_wallet_connection.get_master_xpub(
            address_type, account_number
        )
        readable_master_xpub = master_xpub.to_string()

        # prob dont need to get this I prob already have it ?
        # master_finger_print = hardware_wallet_connection.get_master_fingerprint().hex()
        return readable_master_xpub

    @staticmethod
    def get_script_type_from_derivation_path(
        derivation_path: str,
    ) -> Optional[common.AddressType]:
        """TODO add docstring"""
        pattern = r"m/(?P<number>\d+)'/"
        match = re.match(pattern, derivation_path)
        if match:
            script_type_number = match.group("number")

            if script_type_number == "44":
                return common.AddressType.LEGACY
            elif script_type_number == "49":
                return common.AddressType.SH_WIT
            elif script_type_number == "84":
                return common.AddressType.WIT
            elif script_type_number == "86":
                return common.AddressType.TAP
        else:
            return None
