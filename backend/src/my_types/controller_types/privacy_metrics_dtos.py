from typing import Optional, List, Dict
from pydantic import BaseModel, RootModel, field_validator, Field
import structlog

LOGGER = structlog.get_logger()


class PrivacyMetricDto(BaseModel):
    name: str
    display_name: str
    description: str


class GetAllPrivacyMetricsResponseDto(BaseModel):
    metrics: List[PrivacyMetricDto]
