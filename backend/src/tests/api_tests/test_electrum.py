from unittest.case import TestCase
import json

from bitcoinlib.transactions import Transaction
from src.api.electrum import (
    ElectrumResponse,
    parse_electrum_url,
    electrum_request,
    ElectrumMethod,
    GetTransactionsRequestParams,
)
from unittest.mock import patch, Mock
import socket

mock_electrum_get_transactions_response = {
    "id": 7,
    "jsonrpc": "2.0",
    "result": "02000000000101b0d9cd7e4b900ef0ab43c5a215d6a523a4a422e8a19de488cf948bf797ba31260000000000feffffff0249138727010000001600141c96f2fd3abc46a6161500fed55765a32e31a6d32ade7e020000000016001405de346b6fd81b848f5be779e0b59e26283279400247304402206b89fefa04aa1a132b166c098c8b597974492532ac6162b7561d514ddea12b1d02207d9f3444a00429ea9c935ff4f4eb9a31d641e2df1c0cbff3c55be5ed13731b200121028a993097d51522ee09207cbf299fcadfebb6fe7889348aab99d4f25eff40d9b66c000000",
}
mock_electrum_get_transactions_response_json = json.dumps(
    mock_electrum_get_transactions_response
)
mock_electrum_get_transactions_response_parsed = Transaction.parse(
    mock_electrum_get_transactions_response["result"], strict=True
)


class TestElectrumApi(TestCase):
    def setUp(self):
        self.mock_url = "blockstream"
        self.mock_port = 1234
        self.mock_request_id = 432
        self.mock_tx_id = "mockTxId"

    def test_parse_electrum_url(self):
        mock_electrum_url = f"{self.mock_url}:{self.mock_port}"
        url, port = parse_electrum_url(mock_electrum_url)
        assert port == str(self.mock_port)
        assert url == self.mock_url

    def test_get_transactions_electrum_request_success(self):
        request_method = ElectrumMethod.GET_TRANSACTIONS

        with patch.object(socket, "socket") as mock_socket:
            mock_live_socket = Mock()
            mock_socket.return_value.__enter__.return_value = mock_live_socket
            mock_live_socket.recv.return_value = (
                mock_electrum_get_transactions_response_json.encode("utf-8")
            )
            response = electrum_request(
                self.mock_url,
                self.mock_port,
                request_method,
                GetTransactionsRequestParams(self.mock_tx_id, False),
                self.mock_request_id,
            )
            mock_socket.assert_called_with(socket.AF_INET, socket.SOCK_STREAM)
            mock_live_socket.connect.assert_called_with((self.mock_url, self.mock_port))

            mock_live_socket.recv.assert_called_with(4096)

            assert response == ElectrumResponse(
                status="success", data=mock_electrum_get_transactions_response_parsed
            )

    def test_get_transactions_electrum_request_error(self):
        request_method = ElectrumMethod.GET_TRANSACTIONS

        with patch.object(socket, "socket") as mock_socket:
            mock_live_socket = Mock()
            mock_socket.return_value.__enter__.return_value = mock_live_socket
            # bad electrum response
            mock_live_socket.recv.return_value = None
            response = electrum_request(
                self.mock_url,
                self.mock_port,
                request_method,
                GetTransactionsRequestParams(self.mock_tx_id, False),
                self.mock_request_id,
            )

            assert response == ElectrumResponse(status="error", data=None)
