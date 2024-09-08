from typing import Optional
from pydantic import BaseModel, field_validator, Field
import structlog

LOGGER = structlog.get_logger()


class TransactionDto(BaseModel):
    id: str
    vout: int


class GetUtxosRequestDto(BaseModel):
    fee_rate: str = Field(default="1")
    transactions: list[TransactionDto]
    # default to two outputs, one for the recipient and one for the change
    output_count: str = Field(default="2")
    include_psbt: Optional[bool] = Field(default=False)

    @field_validator("transactions")
    def check_empty_transactions_list(cls, v):
        if not v:
            LOGGER.error("no transactions were supplied")
            raise ValueError("no transactions were supplied")
        return v


class GetUtxosResponseDto(BaseModel):
    spendable: bool
    fee: int
    psbt: Optional[str]


class GetUtxosErrorResponseDto(BaseModel):
    errors: list[str]
    spendable: bool
    message: str = Field(default="Error getting tx fee")


class UtxoData(BaseModel):
    txid: str
    vout: int
    amount: int


class GetAllUtxosResponseDto(BaseModel):
    utxos: list[UtxoData]
