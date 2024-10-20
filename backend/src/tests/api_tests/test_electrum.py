from unittest.case import TestCase

from src.api.electrum import (
    ElectrumResponse,
    parse_electrum_url,
    electrum_request,
    ElectrumMethod,
    GetTransactionsRequestParams,
)
from unittest.mock import patch, Mock
from src.tests.mocks import (
    mock_electrum_get_transactions_response_json,
    mock_electrum_get_transactions_response_parsed,
)
import socket


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
