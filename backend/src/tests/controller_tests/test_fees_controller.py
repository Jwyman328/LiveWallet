from unittest.case import TestCase
from unittest.mock import Mock

from src.app import AppCreator
from src.services.fees.fees import FeeService
from src.api.fees import FeeEstimates
import json


class TestFeesController(TestCase):
    def setUp(self):
        self.app = AppCreator.create_app()
        self.mock_fee_service = Mock(FeeService)
        self.test_client = self.app.test_client()

    def test_get_current_fees_success(self):
        with self.app.container.fee_service.override(self.mock_fee_service):
            self.mock_fee_service.current_fees = Mock(
                return_value=FeeEstimates(low=1, medium=2, high=3)
            )
            response = self.test_client.get("/fees/current")
            assert response.status_code == 200
            assert json.loads(response.data) == {"low": 1, "medium": 2, "high": 3}

    def test_get_current_fees_exception(self):
        with self.app.container.fee_service.override(self.mock_fee_service):
            self.mock_fee_service.current_fees = Mock()

            self.mock_fee_service.current_fees.side_effect = Exception(
                "Error getting current fee"
            )

            response = self.test_client.get("/fees/current")

            assert json.loads(response.data) == {"error": "error fetching current fees"}
