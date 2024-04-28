from flask import Blueprint
from dependency_injector.wiring import inject, Provide
from src.containers.service_container import ServiceContainer
from src.services import FeeService
from src.api.fees import FeeEstimates
from src.types import GetCurrentFeesResponseDto
import structlog

LOGGER = structlog.get_logger()

fees_api = Blueprint("fees", __name__, url_prefix="/fees")


@fees_api.route(
    "/current",
)
@inject
def get_current_mempool_fees(
    fee_service: FeeService = Provide[ServiceContainer.fee_service],
):
    """Get the current low, medium and high fees for the mempool."""
    try:
        fees: FeeEstimates = fee_service.current_fees()
        return GetCurrentFeesResponseDto(
            low=fees.low, medium=fees.medium, high=fees.high
        ).model_dump()
    except Exception as e:
        LOGGER.error("error fetching current fees", error=e)
        return {"error": "error fetching current fees"}
