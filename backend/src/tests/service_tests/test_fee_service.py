from unittest.case import TestCase
from unittest.mock import patch, Mock
from src.api.fees import FeeEstimates
from src.services import FeeService
import requests


class TestFeeService(TestCase):
    def setUp(self):
        self.fee_service = FeeService()
        # TODO update site with real site not local site
        # when I switch it over in the code
        self.get_fees_from_external_url = "http://localhost:3000/fee-estimates"

    def test_current_fees(self):
        # TODO mock get_fees or mock requests library
        mempool_fee_rate_mock_response = {"1": 3, "12": 2, "144": 1}

        get_fees_mock_response = Mock()
        get_fees_mock_response.status_code = 200
        get_fees_mock_response.json.return_value = mempool_fee_rate_mock_response
        with patch.object(
            requests, "get", return_value=get_fees_mock_response
        ) as requests_get_mock:
            response = self.fee_service.current_fees()

            requests_get_mock.assert_called_with(self.get_fees_from_external_url)

            assert response == FeeEstimates(low=1, medium=2, high=3)

    def test_get_current_fees_error_returns_exception(self):
        get_fees_mock_response = Mock()
        get_fees_mock_response.status_code = 404
        expected_exception = Exception("making request to get fees failed")

        with patch.object(
            requests, "get", return_value=get_fees_mock_response
        ) as requests_get_mock:
            with self.assertRaises(Exception) as context:
                self.fee_service.current_fees()

            assert str(context.exception) == str(expected_exception)

            requests_get_mock.assert_called_with(self.get_fees_from_external_url)
