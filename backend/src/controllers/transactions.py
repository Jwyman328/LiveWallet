from flask import Blueprint

from src.services import WalletService
from dependency_injector.wiring import inject, Provide
from src.containers.service_container import ServiceContainer
import structlog

from src.my_types import (
    GetAllTransactionsResponseDto,
)
from src.my_types.controller_types.generic_response_types import SimpleErrorResponse

transactions_page = Blueprint("get_transactions", __name__, url_prefix="/transactions")

LOGGER = structlog.get_logger()


@transactions_page.route("/")
@inject
def get_txos(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get all transactions in the wallet.
    """
    try:
        transactions = wallet_service.get_all_transactions()

        return GetAllTransactionsResponseDto.model_validate(
            dict(transactions=[transaction.as_dict() for transaction in transactions])
        ).model_dump()

    except Exception as e:
        LOGGER.error("error getting txos", error=e)
        return SimpleErrorResponse(message="error getting txos").model_dump()
