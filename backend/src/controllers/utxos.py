from flask import Blueprint, request

from src.services import WalletService
from dependency_injector.wiring import inject, Provide
from src.containers.service_container import ServiceContainer
import structlog
import json
from pydantic import ValidationError

from src.my_types import (
    GetUtxosRequestDto,
    GetUtxosResponseDto,
    GetUtxosErrorResponseDto,
    GetAllUtxosResponseDto,
)
from src.my_types.controller_types.generic_response_types import SimpleErrorResponse

utxo_page = Blueprint("get_utxos", __name__, url_prefix="/utxos")

LOGGER = structlog.get_logger()


@utxo_page.route("/fees", methods=["POST"])
@inject
def get_fee_for_utxo(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get a fee estimate for any number of utxos as input.
    Optionally include a psbt in the response.
    To find the utxos, we need to know the txid and vout values.
    """

    try:
        transactions_request_data = request.data or b"[]"
        get_utxos_request_dto = GetUtxosRequestDto.model_validate(
            dict(
                fee_rate=request.args.get("feeRate"),
                transactions=json.loads(transactions_request_data),
                output_count=request.args.get("outputCount"),
                include_psbt=request.args.get("includePsbt", False),
            )
        )

        LOGGER.info(
            "utxo fee data",
            transactions=get_utxos_request_dto.transactions,
            fee_rate=get_utxos_request_dto.fee_rate,
            output_count=request.args.get("outputCount"),
        )

        fee_estimate_response = wallet_service.get_fee_estimate_for_utxos_from_request(
            get_utxos_request_dto
        )
        if (
            fee_estimate_response.status == "success"
            and fee_estimate_response.data is not None
        ):
            base_64_psbt = (
                fee_estimate_response.psbt.serialize()
                if fee_estimate_response.psbt and get_utxos_request_dto.include_psbt
                else None
            )
            return GetUtxosResponseDto(
                spendable=True,
                fee=fee_estimate_response.data.fee,
                psbt=base_64_psbt,
            ).model_dump()

        if fee_estimate_response.status == "unspendable":
            return GetUtxosErrorResponseDto(
                errors=["unspendable"], spendable=False
            ).model_dump()
        else:
            return (
                GetUtxosErrorResponseDto(
                    spendable=False,
                    errors=["error getting fee estimate for utxo"],
                    message="Error getting fee estimate for utxos",
                ).model_dump(),
                400,
            )

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

    except Exception as e:
        LOGGER.error("error getting utxos", error=e)
        return SimpleErrorResponse(message="error getting utxos").model_dump()


# TODO put this url somehwere else
@utxo_page.route("/transactions")
@inject
def get_txos(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get all utxos and spend txos in the wallet.
    """
    try:
        txos = wallet_service.get_all_transactions()

        # TODO type response
        return txos
    # GetAllUtxosResponseDto.model_validate(
    #         dict(
    #             utxos=[
    #                 {
    #                     "txid": utxo.outpoint.txid,
    #                     "vout": utxo.outpoint.vout,
    #                     "amount": utxo.txout.value,
    #                 }
    #                 for utxo in utxos
    #             ]
    #         )
    #     ).model_dump()
    #
    except Exception as e:
        LOGGER.error("error getting txos", error=e)
        return SimpleErrorResponse(message="error getting txos").model_dump()
