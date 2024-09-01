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
    # A singleton instance of the cipher suite
    # which is essentially the "key" used to encrypt and decrypt.
    cipher_suite = None

    @classmethod
    def get_cipher_suite(cls):
        """Return the singleton instance of the cipher_suite."""
        if cls.cipher_suite is None:
            key = Fernet.generate_key()
            cls.cipher_suite = Fernet(key)
        return cls.cipher_suite

    @staticmethod
    def get_connected_hardware_wallets() -> List[HardwareWalletDetails]:
        """Get the hardware wallets that are connected to the computer,
        add them to the database and return them as a pydantic model
        with the id attached.

        The id is generated when the hardware wallet is added to the db.
        """
        connected_hardware_wallets = HardwareWalletService.scan_for_hardware_wallets()

        # put the hw in the db, subsequently generate a persistent id
        hwws_in_db = [
            HardwareWalletService.save_hardware_wallet(hww)
            for hww in connected_hardware_wallets
        ]

        # add the database generated id
        # to the pydantic hww object
        for index, hww_with_id in enumerate(hwws_in_db):
            connected_hardware_wallets[index].id = hww_with_id.id
        return connected_hardware_wallets

    @staticmethod
    def close_and_remove_all_hardware_wallets() -> bool:
        """Remove all hardware wallets from the database and attempt
        to close the hardware wallet devices.

        We attempt to close the hww device but have no feedback if it succeeds
        or not. This isn't a big deal we will rely on the user to close it manually
        if needed. Even if closing is not successful the db object will still be removed.
        """
        hardware_wallets: List[HardwareWallet] = HardwareWallet.query.all()
        for hardware_wallet in hardware_wallets:
            try:
                hww_client = HardwareWalletService.connect_to_hardware_wallet(
                    hardware_wallet
                )
                if hww_client is not None:
                    HardwareWalletService.close_device(hww_client)
            except Exception as e:
                LOGGER.error(
                    "Error closing hardware wallet",
                    hardware_wallet=hardware_wallet.type,
                    error=e,
                )
            # Always delete the db object even if closing fails
            DB.session.delete(hardware_wallet)

        DB.session.commit()
        return True

    @staticmethod
    def scan_for_hardware_wallets() -> List[HardwareWalletDetails]:
        """Scan the computer for connected hardware wallets."""
        try:
            connected_hardware_wallets = commands.enumerate()
            LOGGER.info(
                "Connected hardware wallets found", wallets=connected_hardware_wallets
            )

            hw_details_validator = TypeAdapter(List[HardwareWalletDetails])

            hardware_wallet_details = hw_details_validator.validate_python(
                connected_hardware_wallets
            )
            return hardware_wallet_details if hardware_wallet_details else []
        except Exception as e:
            LOGGER.error("Error scanning for hardware wallets", error=e)
            return []

    @staticmethod
    def save_hardware_wallet(
        hardware_wallet_details: HardwareWalletDetails,
    ) -> HardwareWallet:
        "Save the hardware wallet to the database."
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
        """Prompt the hardware wallet device for unlocking.

        Get the hardware wallet details from the database and
        attempt to connect to the hardware wallet device before prompting.

        A hardware wallet must be prompted before it is ready
        to receive a pin to unlock the wallet.

        Returns True if the prompt was successful.
        """
        connected_wallet = (
            HardwareWalletService.get_wallet_from_db_and_connect_to_device(wallet_uuid)
        )

        if connected_wallet is None:
            return False

        was_prompt_successful = HardwareWalletService.prompt_device_to_prepare_for_pin(
            connected_wallet
        )
        return was_prompt_successful

    @staticmethod
    def send_pin_to_unlock_wallet(wallet_uuid: str, pin: str) -> bool:
        """Send the pin to the hardware wallet device to unlock the wallet.

        Return True if the pin successfully unlocked the wallet.
        """
        connected_wallet = (
            HardwareWalletService.get_wallet_from_db_and_connect_to_device(wallet_uuid)
        )

        if connected_wallet is None:
            return False

        was_unlock_successful = HardwareWalletService.send_pin_to_device(
            connected_wallet, pin
        )

        return was_unlock_successful

    @staticmethod
    def set_passphrase(wallet_uuid: str, passphrase: str) -> bool:
        """Save an encrypted version of the passphrase to
        the hardware database object.

        Return True if the passphrase was successfully saved.
        """
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
        wallet_uuid: str,
        account_number: int,
        address_type: common.AddressType,
        chain: Chain,
    ) -> Optional[str]:
        """Get the xpub from the hardware wallet device."""
        connected_wallet = (
            HardwareWalletService.get_wallet_from_db_and_connect_to_device(
                wallet_uuid, chain
            )
        )

        if connected_wallet is None:
            return None

        xpub = None
        try:
            xpub = HardwareWalletService.get_xpub(
                connected_wallet, account_number, address_type
            )

        except Exception as e:
            LOGGER.info("Error getting xpub from hardware device", error=e)
            return None

        return xpub

    @staticmethod
    def get_wallet_from_db_and_connect_to_device(
        wallet_uuid: str, chain: Chain = Chain.MAIN
    ) -> Optional[HardwareWalletClient]:
        """Get the hardware wallet details from the database and
        attempt to connect to the hardware wallet device."""

        wallet: Optional[HardwareWallet] = HardwareWallet.query.get(wallet_uuid)
        if wallet is None:
            LOGGER.info("Wallet not found in db", wallet_uuid=wallet_uuid)
            return None

        connected_wallet: Optional[HardwareWalletClient] = (
            HardwareWalletService.connect_to_hardware_wallet(wallet, chain)
        )

        if connected_wallet is None:
            LOGGER.info(
                "Unable to connect to hardware wallet device", wallet_uuid=wallet_uuid
            )
        return connected_wallet

    @classmethod
    def connect_to_hardware_wallet(
        cls,
        hardware_wallet_details: HardwareWallet,
        chain: Chain = Chain.MAIN,
    ) -> Optional[HardwareWalletClient]:
        "Connect to the hardware wallet device on the local system."
        LOGGER.info(
            "Attempting to connect to hardware wallet device.",
            hw_type=hardware_wallet_details.type,
            hw_id=hardware_wallet_details.id,
        )
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
        """Send the pin to the hardware wallet.

        return True if the pin unlocked the device.
        """
        return hardware_wallet_connection.send_pin(pin)

    @staticmethod
    def close_device(
        hardware_wallet_connection: HardwareWalletClient,
    ):
        "Attempt to close the hardware wallet device."
        LOGGER.info("Attempting to close hardware wallet device.")
        return hardware_wallet_connection.close()

    @staticmethod
    def get_xpub(
        hardware_wallet_connection: HardwareWalletClient,
        account_number: int,
        address_type: common.AddressType = common.AddressType.WIT,
    ) -> Optional[str]:
        """Get the xpub from the hardware wallet device
        for a given account number and address type."""
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
        """Given a derivation path get the associated script type."""
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
