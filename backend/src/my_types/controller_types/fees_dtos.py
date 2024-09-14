from pydantic import BaseModel


class GetCurrentFeesResponseDto(BaseModel):
    low: int
    medium: int
    high: int
