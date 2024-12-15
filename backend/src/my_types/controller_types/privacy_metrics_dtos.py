from typing import List
from pydantic import BaseModel
import structlog

from src.models.privacy_metric import PrivacyMetricName

LOGGER = structlog.get_logger()


class PrivacyMetricDto(BaseModel):
    name: str
    display_name: str
    description: str


class GetAllPrivacyMetricsResponseDto(BaseModel):
    metrics: List[PrivacyMetricDto]


class AnalyzeTxPrivacyRequestDto(BaseModel):
    txid: str
    privacy_metrics: List[PrivacyMetricName]


class AnalyzeTxPrivacyResponseDto(BaseModel):
    results: dict[PrivacyMetricName, bool]  # TODO actually implement this
