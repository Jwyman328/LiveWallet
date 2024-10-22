from flask import Blueprint, request
import json

from src.services import WalletService
from dependency_injector.wiring import inject, Provide
from src.containers.service_container import ServiceContainer
import structlog

from src.my_types import (
    GetAllTransactionsResponseDto,
    GetAllOutputsResponseDto,
    AddOutputLabelRequestDto,
    RemoveOutputLabelRequestDto,
    RemoveOutputLabelResponseDto,
    AddOutputLabelResponseDto,
    GetOutputLabelsResponseDto,
)
from src.my_types.controller_types.generic_response_types import SimpleErrorResponse

transactions_page = Blueprint("get_transactions", __name__, url_prefix="/transactions")

LOGGER = structlog.get_logger()


@transactions_page.route("/")
@inject
def get_txos(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get all transactions in the wallet.
    """
    try:
        transactions = wallet_service.get_all_transactions()

        return GetAllTransactionsResponseDto.model_validate(
            dict(transactions=[transaction.as_dict() for transaction in transactions])
        ).model_dump()

    except Exception as e:
        LOGGER.error("error getting txos", error=e)
        return SimpleErrorResponse(message="error getting txos").model_dump()


@transactions_page.route("/outputs")
@inject
def get_outputs(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get all past and current outputs from the wallet.
    """
    try:
        outputs = wallet_service.get_all_outputs()

        return GetAllOutputsResponseDto.model_validate(
            dict(outputs=[output.as_dict() for output in outputs])
        ).model_dump()

    except Exception as e:
        LOGGER.error("error getting outputs", error=e)
        return SimpleErrorResponse(message="error getting txos").model_dump()


@transactions_page.route("/outputs/labels", methods=["GET"])
@inject
def get_output_labels(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get all output labels.
    """
    try:
        labels = wallet_service.get_output_labels()

        return GetOutputLabelsResponseDto.model_validate(
            dict(labels=labels)
        ).model_dump()
        #
    except Exception as e:
        LOGGER.error("error getting all output labels", error=e)
        return SimpleErrorResponse(
            message="error getting all output labels"
        ).model_dump()


@transactions_page.route("/outputs/label", methods=["POST"])
@inject
def add_output_label(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Add a label to a specific output (defined by the txid and vout).
    """
    try:
        add_output_label_request_dto = AddOutputLabelRequestDto.model_validate(
            json.loads(request.data)
        )
        labels = wallet_service.add_label_to_output(
            add_output_label_request_dto.txid,
            add_output_label_request_dto.vout,
            add_output_label_request_dto.labelName,
        )

        return AddOutputLabelResponseDto.model_validate(
            dict(
                labels=[
                    dict(
                        label=label.name,
                        display_name=label.display_name,
                        description=label.description,
                    )
                    for label in labels
                ]
            )
        ).model_dump()
        #
    except Exception as e:
        LOGGER.error("error adding label to an output", error=e)
        return SimpleErrorResponse(
            message="error adding label to an output"
        ).model_dump()


@transactions_page.route("/outputs/label", methods=["DELETE"])
@inject
def remove_output_label(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Remove a label from a specific output (defined by the txid and vout).
    """
    try:
        remove_output_label_request_dto = RemoveOutputLabelRequestDto.model_validate(
            dict(
                txid=request.args.get("txid"),
                vout=request.args.get("vout"),
                labelName=request.args.get("labelName"),
            )
        )
        labels = wallet_service.remove_label_from_output(
            remove_output_label_request_dto.txid,
            remove_output_label_request_dto.vout,
            remove_output_label_request_dto.labelName,
        )

        return RemoveOutputLabelResponseDto.model_validate(
            dict(
                labels=[
                    dict(
                        label=label.name,
                        display_name=label.display_name,
                        description=label.description,
                    )
                    for label in labels
                ]
            )
        ).model_dump()

    except Exception as e:
        LOGGER.error("Error removing a label from an output.", error=e)
        return SimpleErrorResponse(
            message="Error removing a label from an output."
        ).model_dump()
