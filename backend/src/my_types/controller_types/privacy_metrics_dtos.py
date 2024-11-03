from typing import List
from pydantic import BaseModel
import structlog

LOGGER = structlog.get_logger()


class PrivacyMetricDto(BaseModel):
    name: str
    display_name: str
    description: str


class GetAllPrivacyMetricsResponseDto(BaseModel):
    metrics: List[PrivacyMetricDto]


class AnalyzeTxPrivacyResponseDto(BaseModel):
    results: str  # TODO actually implement this


class AnalyzeTxPrivacyRequestDto(BaseModel):
    txid: str
    privacy_metrics: List[str]
