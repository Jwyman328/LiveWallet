from flask import Blueprint
import json

from src.database import DB
from src.models.privacy_metric import PrivacyMetric
from src.my_types.controller_types.privacy_metrics_dtos import (
    AnalyzeTxPrivacyRequestDto,
)
from src.services import WalletService
from dependency_injector.wiring import inject, Provide
from src.containers.service_container import ServiceContainer
from flask import request
import structlog

from src.my_types import (
    GetAllPrivacyMetricsResponseDto,
    PrivacyMetricDto,
    AnalyzeTxPrivacyResponseDto,
)
from src.my_types.controller_types.generic_response_types import SimpleErrorResponse

privacy_metrics_api = Blueprint(
    "privacy_metrics", __name__, url_prefix="/privacy-metrics"
)

LOGGER = structlog.get_logger()


@privacy_metrics_api.route("/")
@inject
def get_privacy_metrics(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    TODO
    """
    try:
        # TODO use a service
        all_metrics = DB.session.query(PrivacyMetric).all()

        return GetAllPrivacyMetricsResponseDto.model_validate(
            dict(
                metrics=[
                    PrivacyMetricDto(
                        name=privacy_metric.name,
                        display_name=privacy_metric.display_name,
                        description=privacy_metric.description,
                    )
                    for privacy_metric in all_metrics
                ]
            )
        ).model_dump()

    except Exception as e:
        LOGGER.error("error getting privacy metrics", error=e)
        return SimpleErrorResponse(message="error getting privacy metrics").model_dump()


@privacy_metrics_api.route("/", methods=["POST"])
@inject
def anaylze_tx_privacy(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    TODO
    """
    try:
        # TODO use a service to actually analyze the privacy
        data = AnalyzeTxPrivacyRequestDto.model_validate(json.loads(request.data))
        print("todo do something with ", data)

        return AnalyzeTxPrivacyResponseDto.model_validate(
            dict(results="mock results")
        ).model_dump()

    except Exception as e:
        LOGGER.error("error analzying transaction privacy metrics", error=e)
        return SimpleErrorResponse(
            message="error analzying transaction privacy metrics"
        ).model_dump()
