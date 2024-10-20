from unittest import TestCase

from unittest.mock import MagicMock
from src.app import AppCreator
from src.services.wallet.wallet import WalletService
from src.tests.mocks import all_transactions_mock
import json


class TestTransactionsController(TestCase):
    def setUp(self):
        app_creator = AppCreator()
        self.app = app_creator.create_app()
        self.test_client = self.app.test_client()
        self.mock_wallet_service = MagicMock(WalletService)
        self.mock_wallet_class = MagicMock(
            WalletService, return_value=self.mock_wallet_service
        )

    def test_get_transactions(self):
        get_all_transactions_mock = MagicMock(return_value=all_transactions_mock)
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_all_transactions = get_all_transactions_mock
            get_transactions_response = self.test_client.get("/transactions/")

            get_all_transactions_mock.assert_called_once()

            assert get_transactions_response.status == "200 OK"
            assert json.loads(get_transactions_response.data) == {
                "transactions": [tx.as_dict() for tx in all_transactions_mock]
            }
