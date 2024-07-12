from typing import List, Optional
from src.database import DB

from hwilib import commands
from hwilib.common import Chain
from hwilib.hwwclient import HardwareWalletClient
from pydantic import BaseModel, TypeAdapter
from src.models.hardware_wallet import HardwareWallet
import structlog


LOGGER = structlog.get_logger()


class HardwareWalletDetails(BaseModel):
    id: Optional[str] = None
    type: str
    path: Optional[str] = None
    label: str
    model: str
    needs_pin_sent: bool
    needs_passphrase_sent: bool
    fingerprint: Optional[str] = None


class HardwareWalletService:
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
            # LOGGER.info("Hardware wallets found", wallets=hws_found)
            # single = HardwareWalletDetails.model_validate(hws_found[0])
            #
            # LOGGER.info("single", single=single)
            # Create an adapter for the model
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
        )

        DB.session.add(hardware_wallet)
        DB.session.commit()
        return hardware_wallet

    @staticmethod
    def connect_to_hardware_wallet(
        hardware_wallet_details: HardwareWalletDetails,
        chain: Chain = Chain.MAIN,
        password=None,
    ) -> Optional[HardwareWalletClient]:
        "Connect to the hardware wallet on the local system"
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
