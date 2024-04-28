from flask import Blueprint
from src.services import WalletService
from dependency_injector.wiring import inject, Provide
from src.containers.service_container import ServiceContainer
import structlog
from src.types import GetBalanceResponseDto

LOGGER = structlog.get_logger()


balance_page = Blueprint("get_balance", __name__, url_prefix="/balance")


@balance_page.route("/")
@inject
def get_balance(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get the currenct btc balance for the current wallet.
    """
    try:
        wallet = wallet_service.wallet
        balance = wallet.get_balance()

        return GetBalanceResponseDto(
            total=balance.total,
            spendable=balance.spendable,
            confirmed=balance.confirmed,
        ).model_dump()
    except Exception as e:
        LOGGER.error("error fetching balance", error=e)
        return {"error": "error fetching balance"}
