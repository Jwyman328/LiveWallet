from typing import Annotated, Optional
from bdkpython import bdk
from flask import Blueprint, request
from time import sleep

from dependency_injector.wiring import inject, Provide
import structlog

from src.testbridge.ngiri import randomly_fund_mock_wallet
from src.my_types import ScriptType
from src.services import WalletService
from src.containers.service_container import ServiceContainer

from pydantic import BaseModel, ValidationError, field_validator

from src.my_types.controller_types.generic_response_types import (
    ValidationErrorResponse,
    SimpleErrorResponse,
)

wallet_api = Blueprint("wallet", __name__, url_prefix="/wallet")

LOGGER = structlog.get_logger()


class CreateWalletRequestDto(BaseModel):
    descriptor: str
    change_descriptor: Optional[str] = None
    network: Annotated[bdk.Network, str]
    electrumUrl: str
    gapLimit: Optional[int] = None

    @field_validator("network", mode="before")
    def parse_enum(cls, value) -> Optional[bdk.Network]:
        if value == "REGTEST":
            return bdk.Network.REGTEST
        elif value == "TESTNET":
            return bdk.Network.TESTNET
        elif value == "BITCOIN":
            return bdk.Network.BITCOIN


class CreateWalletResponseDto(BaseModel):
    message: str
    descriptor: str
    network: str
    electrumUrl: str


class GetWalletTypeResponseDto(BaseModel):
    message: str
    type: ScriptType


class DeleteWalletResponseDto(BaseModel):
    message: str


class CreateSpendableWalletRequestDto(BaseModel):
    network: str
    type: ScriptType
    utxoCount: str
    minUtxoAmount: str
    maxUtxoAmount: str
    descriptor: Optional[str] = None


class CreateSpendableWalletResponseDto(BaseModel):
    message: str
    descriptor: str
    network: str


@wallet_api.route("/", methods=["POST"])
@inject
def create_wallet():
    """
    Set the global level wallet descriptor.
    """
    try:
        data = CreateWalletRequestDto.model_validate_json(request.data)

        WalletService.create_wallet(
            data.descriptor,
            data.change_descriptor,
            data.network,
            data.electrumUrl,
            data.gapLimit,
        )

        WalletService()

        return CreateWalletResponseDto(
            message="wallet created successfully",
            descriptor=data.descriptor,
            network=data.network.name,
            electrumUrl=data.electrumUrl,
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error creating wallet", errors=e.errors()
            ).model_dump(),
            400,
        )


@wallet_api.route("/remove", methods=["DELETE"])
@inject
def delete_wallet():
    """
    Remove the current wallet data from the db and bdk wallet connection.
    """
    try:
        WalletService.remove_global_wallet_and_details()
        WalletService.remove_output_and_related_label_data()

        return DeleteWalletResponseDto(
            message="wallet and related data successfully deleted",
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error deleting wallet", errors=e.errors()
            ).model_dump(),
            400,
        )


@wallet_api.route("/type", methods=["GET"])
@inject
def get_wallet_type(
    wallet_service: WalletService = Provide[ServiceContainer.wallet_service],
):
    """
    Get the type of wallet descriptor address type.
    """
    try:
        script_type = wallet_service.get_script_type()

        return GetWalletTypeResponseDto(
            message="Wallet type",
            type=script_type,
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error getting wallet type", errors=e.errors()
            ).model_dump(),
            400,
        )


@wallet_api.route("/spendable", methods=["POST"])
def create_spendable_wallet():
    """
    Create a new wallet with spendable UTXOs.
    """
    try:
        data = CreateSpendableWalletRequestDto.model_validate_json(
            request.data)

        bdk_network: bdk.Network = bdk.Network.__members__[data.network]

        if data.descriptor is None:
            wallet_descriptor = WalletService.create_spendable_descriptor(
                bdk_network, data.type
            )
        else:
            wallet_descriptor = bdk.Descriptor(
                descriptor=data.descriptor, network=bdk_network
            )

        if wallet_descriptor is None:
            return (
                SimpleErrorResponse(
                    message="Error creating wallet").model_dump(),
                400,
            )

        wallet = WalletService.create_spendable_wallet(
            bdk_network, wallet_descriptor)
        # fund wallet
        try:
            wallet_address = wallet.get_address(bdk.AddressIndex.LAST_UNUSED())
            randomly_fund_mock_wallet(
                wallet_address.address.as_string(),
                float(data.minUtxoAmount),
                float(data.maxUtxoAmount),
                int(data.utxoCount),
            )
            # need a second for the tx to be mined
            sleep(2)
        except Exception:
            return SimpleErrorResponse(message="Error funding wallet").model_dump(), 400

        return CreateSpendableWalletResponseDto(
            message="wallet created successfully",
            descriptor=wallet_descriptor.as_string(),
            network=data.network,
        ).model_dump()

    except ValidationError as e:
        return (
            ValidationErrorResponse(
                message="Error creating wallet", errors=e.errors()
            ).model_dump(),
            400,
        )
