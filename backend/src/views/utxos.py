from flask import Blueprint, request

from src.services import WalletService
from dependency_injector.wiring import inject, Provide
from src.containers.service_container import ServiceContainer
import structlog
import json
from pydantic import ValidationError

from src.types import (
    GetUtxosRequestDto,
    GetUtxosResponseDto,
    GetUtxosErrorResponseDto,
    GetAllUtxosResponseDto,
)

utxo_page = Blueprint("get_utxos", __name__, url_prefix="/utxos")

LOGGER = structlog.get_logger()


@utxo_page.route("/fees", methods=["POST"])
@inject
def get_fee_for_utxo(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get a fee estimate for any number of utxos as input.
    To find the utxos, we need to know the txid and vout values.
    """

    try:
        transactions_request_data = request.data or b"[]"
        get_utxos_request_dto = GetUtxosRequestDto.model_validate(
            dict(
                fee_rate=request.args.get("feeRate"),
                transactions=json.loads(transactions_request_data),
            )
        )

        LOGGER.info(
            "utxo fee data",
            transactions=get_utxos_request_dto.transactions,
            fee_rate=get_utxos_request_dto.fee_rate,
        )

        fee_estimate_response = wallet_service.get_fee_estimate_for_utxos_from_request(
            get_utxos_request_dto
        )
        if (
            fee_estimate_response.status == "success"
            and fee_estimate_response.data is not None
        ):
            return GetUtxosResponseDto(
                spendable=True,
                percent_fee_is_of_utxo=fee_estimate_response.data.percent_fee_is_of_utxo,
                fee=fee_estimate_response.data.fee,
            ).model_dump()

        if fee_estimate_response.status == "unspendable":
            return GetUtxosErrorResponseDto(
                errors=["unspendable"], spendable=False
            ).model_dump()
        else:
            return GetUtxosErrorResponseDto(
                errors=["error getting fee estimate for utxo"],
                spendable=False,
            ).model_dump()

    except ValidationError as e:
        return (
            GetUtxosErrorResponseDto(
                spendable=False,
                errors=[err.get("msg") for err in e.errors()],
                message="Error getting fee estimate for utxos",
            ).model_dump(),
            400,
        )


@utxo_page.route("/")
@inject
def get_utxos(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get all utxos in the wallet.
    """
    try:
        utxos = wallet_service.get_all_utxos()

        return GetAllUtxosResponseDto.model_validate(
            dict(
                utxos=[
                    {
                        "txid": utxo.outpoint.txid,
                        "vout": utxo.outpoint.vout,
                        "amount": utxo.txout.value,
                    }
                    for utxo in utxos
                ]
            )
        ).model_dump()

    except Exception:
        return {"error": "error getting utxos"}
