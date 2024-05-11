from flask import Blueprint, request

from src.services import GlobalDataStore
from dependency_injector.wiring import inject, Provide
from src.containers.global_data_store_container import GlobalStoreContainer
import structlog

from src.types import ScriptType
from src.services import WalletService
from src.containers.service_container import ServiceContainer

from pydantic import BaseModel, ValidationError

wallet_api = Blueprint("wallet", __name__, url_prefix="/wallet")

LOGGER = structlog.get_logger()


class CreateWalletRequestDto(BaseModel):
    descriptor: str
    network: str
    electrumUrl: str


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


@wallet_api.route("/", methods=["POST"])
@inject
def create_wallet(
    global_data_store: GlobalDataStore = Provide[
        GlobalStoreContainer.global_data_store
    ],
):
    """
    Set the global level wallet descriptor.
    """
    try:
        data = CreateWalletRequestDto.model_validate_json(request.data)

        global_data_store.set_global_descriptor(data.descriptor)
        global_data_store.set_global_network(data.network)
        global_data_store.set_global_electrum_url(data.electrumUrl)

        wallet_service = WalletService()
        global_data_store.set_global_wallet(wallet_service.wallet)

        return CreateWalletResponseDto(
            message="wallet created successfully",
            descriptor=data.descriptor,
            network=data.network,
            electrumUrl=data.electrumUrl,
        ).model_dump()

    except ValidationError as e:
        return {"message": "Error creating wallet", "errors": e.errors()}, 400


@wallet_api.route("/remove", methods=["DELETE"])
@inject
def delete_wallet(
    global_data_store: GlobalDataStore = Provide[
        GlobalStoreContainer.global_data_store
    ],
):
    """
    Remove the current wallet data from the global data store.
    """
    try:
        global_data_store.remove_global_wallet_and_details()

        return DeleteWalletResponseDto(
            message="wallet successfully deleted",
        ).model_dump()

    except ValidationError as e:
        return {"message": "Error deleting wallet", "errors": e.errors()}, 400


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
        return {"message": "Error getting wallet type", "errors": e.errors()}, 400
