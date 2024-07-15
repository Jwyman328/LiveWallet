from typing import List, Optional
from pydantic import BaseModel, ValidationError
import structlog
from flask import Blueprint, request

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


class UnlockWalletPromptResponseDto(BaseModel):
    was_prompt_successful: bool


class UnlockWalletWithPinRequestDto(BaseModel):
    pin: str


class UnlockWalletWithPinResponseDto(BaseModel):
    was_unlock_successful: bool


class GetXpubRequestDto(BaseModel):
    account_number: int
    derivation_path: str


class GetXpubResponseDto(BaseModel):
    xpub: Optional[str]


@hardware_wallet_api.route("/", methods=["GET"])
def scan_for_wallets():
    """
    Scan the system for connected hardware wallets
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


@hardware_wallet_api.route("/unlock/<uuid>/prompt", methods=["POST"])
def prompt_unlock_wallet(uuid: str):
    """
    Prompt a hardware wallet to unlock
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
    Unlock a locked hardware wallet
    """
    try:
        data = UnlockWalletWithPinRequestDto.model_validate_json(request.data)
        was_prompt_successful = HardwareWalletService.send_pin_to_unlock_wallet(
            uuid, data.pin
        )

        return UnlockWalletWithPinResponseDto(
            was_unlock_successful=was_prompt_successful
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error unlocking hardware wallet with pin", errors=e.errors()
            ).model_dump(),
            400,
        )


@hardware_wallet_api.route("/unlock/<uuid>/xpub", methods=["POST"])
def get_xpub(uuid: str):
    """
    Get the xpub from a hardware wallet
    """
    try:
        data = GetXpubRequestDto.model_validate_json(request.data)
        script_type = HardwareWalletService.get_script_type_from_derivation_path(
            data.derivation_path
        )
        if script_type is None:
            raise ValidationError(
                [
                    {
                        "loc": ["derivation_path"],
                        "msg": "Derivation path is not a valid BIP32 path",
                        "type": "value_error",
                    }
                ]
            )
        xpub = HardwareWalletService.get_xpub_from_device(
            uuid, data.account_number, script_type
        )

        return GetXpubResponseDto(xpub=xpub).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error getting xpub from hardare wallet",
                errors=e.errors(),
            ).model_dump(),
            400,
        )
