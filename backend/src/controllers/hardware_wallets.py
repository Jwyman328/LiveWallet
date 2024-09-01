from typing import Annotated, List, Optional
from pydantic import BaseModel, ValidationError, field_validator
import structlog
from flask import Blueprint, request

from hwilib.common import Chain

from src.services.hardware_wallet.hardware_wallet import (
    HardwareWalletDetails,
    HardwareWalletService,
)
from src.types.controller_types.generic_response_types import ValidationErrorResponse

hardware_wallet_api = Blueprint(
    "hardware_wallet", __name__, url_prefix="/hardware-wallets"
)

LOGGER = structlog.get_logger()


class ScanForWalletsResponseDto(BaseModel):
    wallets: List[HardwareWalletDetails]


class CloseAndRemoveWalletsResponseDto(BaseModel):
    was_close_and_remove_successful: bool


class UnlockWalletPromptResponseDto(BaseModel):
    was_prompt_successful: bool


class UnlockWalletWithPinRequestDto(BaseModel):
    pin: str


class UnlockWalletWithPinResponseDto(BaseModel):
    was_unlock_successful: bool


class GetXpubRequestDto(BaseModel):
    account_number: int
    derivation_path: str
    network: Annotated[Chain, str]

    @field_validator("network", mode="before")
    def parse_enum(cls, value) -> Optional[Chain]:
        if value == "REGTEST":
            return Chain.REGTEST
        elif value == "TESTNET":
            return Chain.TEST
        elif value == "BITCOIN":
            return Chain.MAIN


class GetXpubResponseDto(BaseModel):
    xpub: Optional[str]


class SetWalletPassphraseRequestDto(BaseModel):
    passphrase: str


class SetWalletPassphraseResponseDto(BaseModel):
    was_passphrase_set: bool


@hardware_wallet_api.route("/", methods=["GET"])
def scan_for_wallets():
    """
    Scan the system for connected hardware wallets.
    """
    try:
        connected_hwws = HardwareWalletService.get_connected_hardware_wallets()

        return ScanForWalletsResponseDto(wallets=connected_hwws).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error scanning for hardware wallets", errors=e.errors()
            ).model_dump(),
            400,
        )


@hardware_wallet_api.route("/close", methods=["DELETE"])
def close_and_remove_wallets():
    """
    Delete all hardware wallets from the database, also try to close each hardware wallet device.
    For some reason closing is not always successful. We have no way of knowing
    if a close was successful though, there is no response from the hwi close function.
    It isn't a big deal, we will still remove the wallet from the db even if it
    the wallet doesn't close and will rely on the user to manually close the device.
    """
    try:
        was_close_successful = (
            HardwareWalletService.close_and_remove_all_hardware_wallets()
        )

        return CloseAndRemoveWalletsResponseDto(
            was_close_and_remove_successful=was_close_successful
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error closing and deleting hardware wallets", errors=e.errors()
            ).model_dump(),
            400,
        )


@hardware_wallet_api.route("/unlock/<uuid>/prompt", methods=["POST"])
def prompt_unlock_wallet(uuid: str):
    """
    Prompt a hardware wallet to unlock.

    Prompting must be done before sending a pin to unlock the wallet.
    """
    try:
        was_prompt_successful = HardwareWalletService.prompt_to_unlock_wallet(uuid)

        return UnlockWalletPromptResponseDto(
            was_prompt_successful=was_prompt_successful
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error prompting to unlock hardware wallet", errors=e.errors()
            ).model_dump(),
            400,
        )


@hardware_wallet_api.route("/unlock/<uuid>/pin", methods=["POST"])
def unlock_wallet(uuid: str):
    """
    Attempt to unlock a hardware wallet that is locked, by sending a pin to the wallet.
    """
    try:
        data = UnlockWalletWithPinRequestDto.model_validate_json(request.data)
        was_unlock_successful = HardwareWalletService.send_pin_to_unlock_wallet(
            uuid, data.pin
        )

        return UnlockWalletWithPinResponseDto(
            was_unlock_successful=was_unlock_successful
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error unlocking hardware wallet with pin", errors=e.errors()
            ).model_dump(),
            400,
        )


@hardware_wallet_api.route("/unlock/<uuid>/passphrase", methods=["POST"])
def set_wallet_passphrase(uuid: str):
    """
    Set a passphrase on a hardware wallet.

    This will not interact with the hardware wallet device yet,
    it will just save the passphrase in the db on the associated wallet db object.

    The passphrase will later be used when connecting to the related hardware wallet device.
    """
    try:
        data = SetWalletPassphraseRequestDto.model_validate_json(request.data)
        was_passphrase_set = HardwareWalletService.set_passphrase(uuid, data.passphrase)

        return SetWalletPassphraseResponseDto(
            was_passphrase_set=was_passphrase_set
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error setting passphrase", errors=e.errors()
            ).model_dump(),
            400,
        )


@hardware_wallet_api.route("/unlock/<uuid>/xpub", methods=["POST"])
def get_xpub(uuid: str):
    """
    Generate an xpub from a hardware wallet, based on the derivation path provided
    and the existing details in the db for this hardware wallet.
    """
    try:
        data = GetXpubRequestDto.model_validate_json(request.data)
        script_type = HardwareWalletService.get_script_type_from_derivation_path(
            data.derivation_path
        )
        if script_type is None:
            return (
                ValidationErrorResponse(
                    message="Derivation path was invalid",
                    errors=["Derivation path was invalid"],
                ).model_dump(),
                400,
            )
        xpub = HardwareWalletService.get_xpub_from_device(
            uuid, data.account_number, script_type, data.network
        )

        if xpub is None:
            return (
                ValidationErrorResponse(
                    message="Error getting xpub from hardware wallet",
                    errors=["Error getting xpub from hardware wallet"],
                ).model_dump(),
                400,
            )

        return GetXpubResponseDto(xpub=xpub).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error getting xpub from hardware wallet",
                errors=e.errors(),
            ).model_dump(),
            400,
        )
