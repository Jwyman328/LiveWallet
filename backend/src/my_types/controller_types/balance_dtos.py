from pydantic import BaseModel


class GetBalanceResponseDto(BaseModel):
    total: int
    spendable: int
    confirmed: int
