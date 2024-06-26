from src.types.script_types import ScriptType
from src.types.wallet import WalletDetails, FeeDetails
from src.types.controller_types.utxos_dtos import (
    GetUtxosRequestDto,
    TransactionDto,
    GetUtxosResponseDto,
    GetUtxosErrorResponseDto,
    GetAllUtxosResponseDto,
)

from src.types.controller_types.fees_dtos import GetCurrentFeesResponseDto

from src.types.controller_types.balance_dtos import GetBalanceResponseDto
from src.types.controller_types.generic_response_types import (
    SimpleErrorResponse,
    ValidationErrorResponse,
)
