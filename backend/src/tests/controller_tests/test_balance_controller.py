from dataclasses import dataclass
import bdkpython as bdk
from unittest import TestCase, mock
from src.services import WalletService
from src.app import AppCreator
import json


@dataclass
class MockGetBalanceResponse:
    total: int
    spendable: int
    confirmed: int


class TestBalanceController(TestCase):
    def setUp(self):
        self.mock_wallet_service = mock.Mock(WalletService)
        self.mock_online_wallet = mock.Mock(bdk.Wallet)

        app_creator = AppCreator()
        self.app = app_creator.create_app()
        self.test_client = self.app.test_client()

    def test_balance_controller_returns_balance(self):
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_online_wallet.get_balance = mock.Mock(
                return_value=MockGetBalanceResponse(10000, 10000, 10000)
            )
            self.mock_wallet_service.wallet = self.mock_online_wallet
            response = self.test_client.get("/balance/")
            assert response.status == "200 OK"
            assert json.loads(response.data) == {
                "total": 10000,
                "spendable": 10000,
                "confirmed": 10000,
            }
