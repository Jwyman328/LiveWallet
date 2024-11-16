import copy
from unittest.case import TestCase
from unittest.mock import MagicMock, patch

from src.models.privacy_metric import PrivacyMetric, PrivacyMetricName
from src.services.wallet.wallet import WalletService
from src.tests.mocks import tx_mock
from src.services.privacy_metrics.privacy_metrics import PrivacyMetricsService

# TODO move into mocks file?
# Mocks
privacy_metric_mock_one = MagicMock()
privacy_metric_mock_one.id = 1
privacy_metric_mock_one.name = PrivacyMetricName.ANNOMINITY_SET
privacy_metric_mock_one.display_name = "mock_name_one"
privacy_metric_mock_one.description = "mock_description_one"

privacy_metric_mock_two = MagicMock()
privacy_metric_mock_two.id = 2
privacy_metric_mock_two.name = PrivacyMetricName.NO_ADDRESS_REUSE
privacy_metric_mock_two.display_name = "mock_name_two"
privacy_metric_mock_two.description = "mock_description_two"


class TestPrivacyMetricsService(TestCase):
    def test_get_all_privacy_metrics(self):
        with patch(
            "src.services.privacy_metrics.privacy_metrics.DB.session.query"
        ) as mock_DB_session_query:
            self.mock_DB_session_query = mock_DB_session_query
            mock_return_metrics = [privacy_metric_mock_one, privacy_metric_mock_two]
            self.mock_DB_session_query.return_value.all.return_value = (
                mock_return_metrics
            )
            response = PrivacyMetricsService.get_all_privacy_metrics()
            assert response == mock_return_metrics

    def test_analyze_annominity_set_without_desired_amount(self):
        with patch.object(
            WalletService, "get_output_from_db"
        ) as get_output_from_db_mock, patch.object(
            WalletService, "calculate_output_annominity_sets"
        ) as mock_calculate_output_annominity_sets:
            mock_calculate_output_annominity_sets.return_value = {"1": 1, "2": 2}
            # first output is the users, second isn't
            get_output_from_db_mock.side_effect = [MagicMock, None]
            mock_transaction_with_one_anon_set = copy.deepcopy(tx_mock)
            mock_transaction_with_one_anon_set.outputs[0].value = "1"
            mock_transaction_with_one_anon_set.outputs[1].value = "2"
            response = PrivacyMetricsService.analyze_annominity_set(
                transaction=mock_transaction_with_one_anon_set,
                desired_annominity_set=2,
                allow_some_uneven_change=True,
            )
            assert response is False

    def test_analyze_annominity_set_with_desired_amount(self):
        # test tx with less than desired fails
        with patch.object(
            WalletService, "get_output_from_db"
        ) as get_output_from_db_mock, patch.object(
            WalletService, "calculate_output_annominity_sets"
        ) as mock_calculate_output_annominity_sets:
            # both outputs have an anon set on 2
            mock_calculate_output_annominity_sets.return_value = {"1": 2, "2": 2}
            # first output is the users, second isn't
            get_output_from_db_mock.side_effect = [MagicMock, None]
            mock_transaction_with_one_anon_set = copy.deepcopy(tx_mock)
            mock_transaction_with_one_anon_set.outputs[0].value = "1"
            mock_transaction_with_one_anon_set.outputs[1].value = "2"

            response = PrivacyMetricsService.analyze_annominity_set(
                transaction=mock_transaction_with_one_anon_set,
                desired_annominity_set=2,
                allow_some_uneven_change=True,
            )
            assert response is True

    def test_analyze_annominity_set_with_allow_uneven_change(self):
        with patch.object(
            WalletService, "get_output_from_db"
        ) as get_output_from_db_mock, patch.object(
            WalletService, "calculate_output_annominity_sets"
        ) as mock_calculate_output_annominity_sets:
            # both outputs are the users but only one has an anon set above the desired anon set of 2
            mock_calculate_output_annominity_sets.return_value = {"1": 2, "2": 1}
            # first output is the users, second is the users change which failed anon test
            get_output_from_db_mock.side_effect = [MagicMock, MagicMock]
            mock_transaction_with_one_anon_set = copy.deepcopy(tx_mock)
            mock_transaction_with_one_anon_set.outputs[0].value = "1"
            mock_transaction_with_one_anon_set.outputs[1].value = "2"

            response = PrivacyMetricsService.analyze_annominity_set(
                transaction=mock_transaction_with_one_anon_set,
                desired_annominity_set=2,
                allow_some_uneven_change=True,
            )
            assert response is True

    def test_analyze_annominity_set_with_NOT_allow_uneven_change(self):
        with patch.object(
            WalletService, "get_output_from_db"
        ) as get_output_from_db_mock, patch.object(
            WalletService, "calculate_output_annominity_sets"
        ) as mock_calculate_output_annominity_sets:
            # both outputs are the users but only one has an anon set above the desired anon set of 2
            mock_calculate_output_annominity_sets.return_value = {"1": 2, "2": 1}
            # first output is the users, second is the users change which failed anon test
            get_output_from_db_mock.side_effect = [MagicMock, MagicMock]
            mock_transaction_with_one_anon_set = copy.deepcopy(tx_mock)
            mock_transaction_with_one_anon_set.outputs[0].value = "1"
            mock_transaction_with_one_anon_set.outputs[1].value = "2"

            response = PrivacyMetricsService.analyze_annominity_set(
                transaction=mock_transaction_with_one_anon_set,
                desired_annominity_set=2,
                allow_some_uneven_change=False,
            )
            assert response is False
