from typing import Optional, List, Dict
from pydantic import BaseModel, RootModel, field_validator, Field
import structlog

LOGGER = structlog.get_logger()


class TransactionDto(BaseModel):
    id: str
    vout: int


class InputDto(BaseModel):
    index_n: int
    prev_txid: str
    output_n: int
    script_type: str  # sig_pubkey
    address: str
    value: int
    public_keys: str
    compressed: bool
    compressed: bool
    encoding: str  # bech32, what other options?
    double_spend: bool
    script: str  # can be an empty string
    redeemscript: str
    sequence: int
    signatures: List[str]
    sigs_required: int
    # this is probably an optional but I don't know if it is a string or an int
    locktime_cltv: Optional[str | int]
    locktime_csv: Optional[str | int]
    public_hash: str
    script_code: str
    unlocking_script: str
    unlocking_script_unsigned: str
    witness_type: str  # segwit, what are other options
    witness: Optional[str]
    sort: bool
    valid: Optional[bool]


class OutputDto(BaseModel):
    value: int  # sats
    script: str
    script_type: str  # p2wpkh, what other options?
    public_key: str
    public_hash: str
    address: str
    output_n: int
    spent: bool
    spending_txid: str
    spending_index_n: Optional[int]


class OutputDetailDto(OutputDto):
    annominity_set: Optional[int]
    txid: Optional[str]
    labels: Optional[List[str]]


class TransactionDetailDto(BaseModel):
    txid: str
    date: Optional[str]
    network: str  # bitcoin, what are the other options?
    witness_type: str  # segwit, what are the other options?
    coinbase: bool
    flag: int
    txhash: str
    confirmations: Optional[int]
    block_height: Optional[int]
    block_hash: Optional[str]
    fee: Optional[int]
    fee_per_kb: Optional[int]
    inputs: List[InputDto]
    outputs: List[OutputDto]
    input_total: int
    output_total: int
    version: int
    locktime: int
    raw: str
    size: int
    vsize: int
    verified: bool
    status: str  # new, not sure the other types


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


class GetAllTransactionsResponseDto(BaseModel):
    transactions: list[TransactionDetailDto]


class GetAllOutputsResponseDto(BaseModel):
    outputs: list[OutputDetailDto]


class AddOutputLabelRequestDto(BaseModel):
    txid: str
    vout: int
    labelName: str  # TODO change to displayName


class RemoveOutputLabelRequestDto(BaseModel):
    txid: str
    vout: int
    labelName: str


class OutputLabelDto(BaseModel):
    label: str
    display_name: str
    description: str


class RemoveOutputLabelResponseDto(BaseModel):
    labels: list[OutputLabelDto]


class AddOutputLabelResponseDto(BaseModel):
    labels: list[OutputLabelDto]


class GetOutputLabelsResponseDto(BaseModel):
    labels: list[OutputLabelDto]


class GetOutputLabelsPopulateResponseDto(RootModel):
    root: Dict[str, List[OutputLabelDto]]


class PopulateOutputLabelsRequestDto(RootModel):
    root: Dict[str, List[OutputLabelDto]]


class PopulateOutputLabelsResponseDto(BaseModel):
    success: bool
