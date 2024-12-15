from enum import Enum
from typing import List, Optional, Literal
from dataclasses import dataclass
from bitcoinlib.transactions import Transaction
import structlog
import json
import socket
import asyncio

LOGGER = structlog.get_logger()


def parse_electrum_url(electrum_url: str) -> tuple[Optional[str], Optional[str]]:
    try:
        url, port = electrum_url.split(":")
        if url == "" or port == "":
            return None, None
        return url, port
    except ValueError:
        return None, None


class ElectrumMethod(Enum):
    GET_TRANSACTIONS = "blockchain.transaction.get"


@dataclass
class GetTransactionsRequestParams:
    txid: str
    verbose: bool

    def create_params_list(self) -> List[str | bool]:
        return [self.txid, self.verbose]


GetTransactionsResponse = Transaction

ALL_UTXOS_REQUEST_PARAMS = GetTransactionsRequestParams
ElectrumRawResponses = dict[str, str]
ElectrumDataResponses = GetTransactionsResponse


@dataclass
class ElectrumResponse:
    status: Literal["success", "error"]
    data: Optional[ElectrumDataResponses]


async def electrum_request(
    url: str,
    port: int,
    electrum_method: ElectrumMethod,
    params: Optional[ALL_UTXOS_REQUEST_PARAMS],
    request_id: Optional[int] = 1,
) -> ElectrumResponse:
    writer = None
    try:
        # Use asyncio to manage the socket connection
        reader, writer = await asyncio.open_connection(url, port)

        request = json.dumps(
            {
                "jsonrpc": "2.0",
                "id": request_id,
                "method": electrum_method.value,
                "params": params.create_params_list() if params else [],
            }
        )

        LOGGER.info(f"Sending electrum request: {request}")
        writer.write((request + "\n").encode("utf-8"))
        await writer.drain()

        # Read the response asynchronously
        response = b""
        while True:
            part = await reader.read(4096)
            response += part
            if len(part) < 4096:
                break

        # Decode and parse the JSON response
        raw_response_data = json.loads(response.decode("utf-8").strip())

        # Assuming handle_raw_electrum_response is an existing function
        response_data = handle_raw_electrum_response(
            electrum_method, raw_response_data)
        return ElectrumResponse(status="success", data=response_data)
    except socket.error as e:
        LOGGER.error(f"Socket error: {e}")
        return ElectrumResponse(status="error", data=None)
    except json.JSONDecodeError as e:
        LOGGER.error(f"JSON decode error: {e}")
        return ElectrumResponse(status="error", data=None)
    except Exception as e:
        LOGGER.error(f"An error occurred: {e}")
        return ElectrumResponse(status="error", data=None)
    finally:
        # Close the writer/reader
        if writer:
            writer.close()
            await writer.wait_closed()


def handle_raw_electrum_response(
    electrum_method: ElectrumMethod, raw_response: dict
) -> ElectrumDataResponses:
    if electrum_method == ElectrumMethod.GET_TRANSACTIONS:
        transaction = Transaction.parse(raw_response["result"], strict=True)
        return transaction
