from typing import List
from pydantic import BaseModel, ValidationError
import structlog
from flask import Blueprint

from src.services.hardware_wallet.hardware_wallet import HardwareWalletService
from src.types.controller_types.generic_response_types import ValidationErrorResponse

hardware_wallet_api = Blueprint(
    "hardware_wallet", __name__, url_prefix="/hardware-wallet"
)

LOGGER = structlog.get_logger()


class ScanForWalletsResponseDto(BaseModel):
    wallets: List[str]  # TODO finalize this return type


hardware_wallet_api.route("/", methods=["GET"])


def scan_for_wallets():
    """
    Scan the system for connected hardware wallets
    """
    try:
        HardwareWalletService.scan_for_hardware_wallets()
        # TODO don't return a mock value
        return ScanForWalletsResponseDto(wallets=["trezor", "ledger"]).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error scanning for hardware wallets", errors=e.errors()
            ).model_dump(),
            400,
        )


# todo write this endpoint
# @inject
# def prompt_wallet_for_pin(
#     hardware_wallet_service: HardwareWalletService = Provide[
#         ServiceContainer.hardware_wallet_service
#     ],
# ):
#     """
#     Prompt the hardware wallet for a pin
#     #     """
# pass
