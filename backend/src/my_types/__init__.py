from src.my_types.script_types import ScriptType
from src.my_types.wallet import WalletDetails, FeeDetails
from src.my_types.controller_types.utxos_dtos import (
    GetUtxosRequestDto,
    TransactionDto,
    GetUtxosResponseDto,
    GetUtxosErrorResponseDto,
    GetAllUtxosResponseDto,
)

from src.my_types.controller_types.fees_dtos import GetCurrentFeesResponseDto

from src.my_types.controller_types.balance_dtos import GetBalanceResponseDto
from src.my_types.controller_types.generic_response_types import (
    SimpleErrorResponse,
    ValidationErrorResponse,
)
