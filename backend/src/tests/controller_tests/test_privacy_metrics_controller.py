from unittest import TestCase

from unittest.mock import MagicMock, Mock
from src.app import AppCreator
import json


class TestPrivacyMetricsController(TestCase):
    def setUp(self):
        app_creator = AppCreator()
        self.app = app_creator.create_app()
        self.test_client = self.app.test_client()
        self.mock_privacy_metrics_service = MagicMock()

    def test_get_privacy_metrics(self):
        privacy_metric_mock = Mock()
        privacy_metric_mock.name = "privacy_metric_1"
        privacy_metric_mock.display_name = "mock_dn"
        privacy_metric_mock.description = "mock_description"

        privacy_metric_mock_two = Mock()
        privacy_metric_mock_two.name = "privacy_metric_2"
        privacy_metric_mock_two.display_name = "mock_dn_2"
        privacy_metric_mock_two.description = "mock_description_2"

        all_privacy_metrics_mock = [
            privacy_metric_mock, privacy_metric_mock_two]

        get_all_privacy_metrics_mock = MagicMock(
            return_value=all_privacy_metrics_mock)
        with self.app.container.privacy_metrics_service.override(
            self.mock_privacy_metrics_service
        ):
            self.mock_privacy_metrics_service.get_all_privacy_metrics = (
                get_all_privacy_metrics_mock
            )
            get_privacy_metrics_response = self.test_client.get(
                "/privacy-metrics/")

            get_all_privacy_metrics_mock.assert_called_once()

            assert get_privacy_metrics_response.status == "200 OK"
            assert json.loads(get_privacy_metrics_response.data) == {
                "metrics": [
                    {
                        "name": "privacy_metric_1",
                        "display_name": "mock_dn",
                        "description": "mock_description",
                    },
                    {
                        "name": "privacy_metric_2",
                        "display_name": "mock_dn_2",
                        "description": "mock_description_2",
                    },
                ]
            }

    def test_post_privacy_metrics(self):
        analyze_tx_privacy_mock = MagicMock(
            return_value={"annominity set": True, "no address reuse": False}
        )

        with self.app.container.privacy_metrics_service.override(
            self.mock_privacy_metrics_service
        ):
            self.mock_privacy_metrics_service.analyze_tx_privacy = (
                analyze_tx_privacy_mock
            )
            post_privacy_metrics_response = self.test_client.post(
                "/privacy-metrics/",
                json={
                    "txid": "mock_txid",
                    "privacy_metrics": ["annominity set", "no address reuse"],
                },
            )

            analyze_tx_privacy_mock.assert_called_once()

            assert post_privacy_metrics_response.status == "200 OK"
            assert json.loads(post_privacy_metrics_response.data) == {
                "results": {"annominity set": True, "no address reuse": False}
            }
