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
            mock_return_metrics = [
                privacy_metric_mock_one, privacy_metric_mock_two]
            mock_DB_session_query.return_value.all.return_value = mock_return_metrics
            response = PrivacyMetricsService.get_all_privacy_metrics()
            assert response == mock_return_metrics

    def test_analyze_annominity_set_without_desired_amount(self):
        with patch.object(
            WalletService, "get_output_from_db"
        ) as get_output_from_db_mock, patch.object(
            WalletService, "calculate_output_annominity_sets"
        ) as mock_calculate_output_annominity_sets:
            mock_calculate_output_annominity_sets.return_value = {
                "1": 1, "2": 2}
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
            mock_calculate_output_annominity_sets.return_value = {
                "1": 2, "2": 2}
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
            mock_calculate_output_annominity_sets.return_value = {
                "1": 2, "2": 1}
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
            mock_calculate_output_annominity_sets.return_value = {
                "1": 2, "2": 1}
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

    def test_analyze_no_address_reuse_passes(self):
        with patch(
            "src.services.privacy_metrics.privacy_metrics.OutputModel"
        ) as mock_outputmodel, patch.object(
            WalletService, "is_address_reused"
        ) as is_address_reuse_mock:
            mock_output = MagicMock()
            mock_outputs = [mock_output, mock_output]
            mock_outputmodel.query.filter_by.return_value.all.return_value = (
                mock_outputs
            )

            # both addresses are not reused
            is_address_reuse_mock.side_effect = [False, False]

            response = PrivacyMetricsService.analyze_no_address_reuse(
                txid="mock_tx_id")
            assert is_address_reuse_mock.call_count == 2
            assert response is True

    def test_analyze_no_address_reuse_fails(self):
        with patch(
            "src.services.privacy_metrics.privacy_metrics.OutputModel"
        ) as mock_outputmodel, patch.object(
            WalletService, "is_address_reused"
        ) as is_address_reuse_mock:
            mock_output = MagicMock()
            mock_outputs = [mock_output, mock_output]
            mock_outputmodel.query.filter_by.return_value.all.return_value = (
                mock_outputs
            )

            # first address is reused
            is_address_reuse_mock.side_effect = [True, False]

            response = PrivacyMetricsService.analyze_no_address_reuse(
                txid="mock_tx_id")
            # fail early after first address found is reused
            assert is_address_reuse_mock.call_count == 1
            assert response is False

    def test_analyze_significantly_minimal_wealth_reveal_no_change(self):
        with patch.object(
            PrivacyMetricsService, "analyze_no_change"
        ) as mock_analyze_no_change:
            mock_analyze_no_change.return_value = True
            transaction_model_mock = MagicMock()
            response = (
                PrivacyMetricsService.analyze_significantly_minimal_wealth_reveal(
                    transaction_model_mock
                )
            )

            # if no change then no wealth is revealed
            assert response is True

    def test_analyze_significantly_minimal_wealth_reveal_non_typical_tx(self):
        with patch.object(
            PrivacyMetricsService, "analyze_no_change"
        ) as mock_analyze_no_change:
            mock_analyze_no_change.return_value = True
            transaction_model_mock = MagicMock()
            transaction_model_mock.sent_amount = 1000000000
            transaction_model_mock.received_amount = 1000000000
            response = (
                PrivacyMetricsService.analyze_significantly_minimal_wealth_reveal(
                    transaction_model_mock
                )
            )

            # if nothing sent to others then no wealth is revealed
            assert response is True

    def test_analyze_significantly_minimal_wealth_reveal_fails(self):
        with patch.object(
            PrivacyMetricsService, "analyze_no_change"
        ) as mock_analyze_no_change, patch.object(
            PrivacyMetricsService, "get_ratio_threshold"
        ) as mock_get_ratio_threshold:
            mock_analyze_no_change.return_value = False
            transaction_model_mock = MagicMock()
            transaction_model_mock.sent_amount = 1000000000
            transaction_model_mock.received_amount = 800000000
            # amount receiver got  is 200000000
            # amount sender got in change 800000000
            # therefore revealed 4x the payment
            # since threshold is 1x the payment, this fails
            mock_get_ratio_threshold.return_value = 1

            response = (
                PrivacyMetricsService.analyze_significantly_minimal_wealth_reveal(
                    transaction_model_mock
                )
            )

            assert response is False

    def test_analyze_significantly_minimal_wealth_reveal_passes(self):
        with patch.object(
            PrivacyMetricsService, "analyze_no_change"
        ) as mock_analyze_no_change, patch.object(
            PrivacyMetricsService, "get_ratio_threshold"
        ) as mock_get_ratio_threshold:
            mock_analyze_no_change.return_value = False
            transaction_model_mock = MagicMock()
            transaction_model_mock.sent_amount = 1000000000
            transaction_model_mock.received_amount = 1000
            # amount receiver got much more than 2x the change amount
            # therefore wealth is not revealed
            mock_get_ratio_threshold.return_value = 2

            response = (
                PrivacyMetricsService.analyze_significantly_minimal_wealth_reveal(
                    transaction_model_mock
                )
            )

            assert response is True

    def test_ratio_threshold(self):
        one_btc = 100000000  # 1btc
        point_one_btc = 10000000  # 0.1btc
        point_zero_one_btc = 1000000  # 0.01btc
        point_zero_zero_one_btc = 100000  # 0.001btc

        one_btc_threshold = PrivacyMetricsService.get_ratio_threshold(one_btc)

        point_one_btc_threshold = PrivacyMetricsService.get_ratio_threshold(
            point_one_btc
        )

        point_zero_one_btc_threshold = PrivacyMetricsService.get_ratio_threshold(
            point_zero_one_btc
        )
        point_zero_zero_one_btc_threshold = PrivacyMetricsService.get_ratio_threshold(
            point_zero_zero_one_btc
        )

        assert one_btc_threshold == 1
        assert point_one_btc_threshold == 5
        assert point_zero_one_btc_threshold == 10
        assert point_zero_zero_one_btc_threshold == 10
