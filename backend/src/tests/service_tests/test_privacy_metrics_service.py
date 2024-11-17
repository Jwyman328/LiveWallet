import copy
from unittest.case import TestCase
from unittest.mock import MagicMock, patch
from datetime import datetime


from src.models.label import LabelName
from src.models.privacy_metric import PrivacyMetricName
from src.services.last_fetched.last_fetched_service import LastFetchedService
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

    def test_analyze_no_change_pass(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000000000
        mock_transaction_model.received_amount = 0
        response = PrivacyMetricsService.analyze_no_change(
            mock_transaction_model)
        assert response is True

        # is a user received but didn't send then the amount
        # they received is not change, therefore no change passes
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 0
        mock_transaction_model.received_amount = 100000000
        response = PrivacyMetricsService.analyze_no_change(
            mock_transaction_model)
        assert response is True

    def test_analyze_no_change_fail(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000000000
        mock_transaction_model.received_amount = 10
        response = PrivacyMetricsService.analyze_no_change(
            mock_transaction_model)
        assert response is False

    def test_analyze_no_small_change_fail(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000000000
        mock_transaction_model.received_amount = 100
        response = PrivacyMetricsService.analyze_no_small_change(
            mock_transaction_model)
        assert response is False

    def test_analyze_no_small_change_pass(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000040000
        mock_transaction_model.received_amount = 1000000000
        response = PrivacyMetricsService.analyze_no_small_change(
            mock_transaction_model)
        assert response is True

    def test_analyze_no_round_number_payments_fail(self):
        mock_output_one = MagicMock()
        mock_output_one.value = 1000000000

        mock_output_two = MagicMock()
        mock_output_two.value = 1123432342

        mock_transaction = MagicMock()
        mock_transaction.outputs = [mock_output_one, mock_output_two]
        response = PrivacyMetricsService.analyze_no_round_number_payments(
            mock_transaction
        )

        assert response is False

    def test_analyze_no_round_number_payments_pass(self):
        mock_output_one = MagicMock()
        mock_output_one.value = 11234324532

        mock_output_two = MagicMock()
        mock_output_two.value = 1123432342

        mock_transaction = MagicMock()
        mock_transaction.outputs = [mock_output_one, mock_output_two]
        response = PrivacyMetricsService.analyze_no_round_number_payments(
            mock_transaction
        )

        assert response is True

    def test_analyze_same_script_types_pass_if_user_not_sending(self):
        mock_output_one = MagicMock()
        mock_output_one.value = 11234324532

        mock_output_two = MagicMock()
        mock_output_two.value = 1123432342

        mock_transaction = MagicMock()
        mock_transaction.outputs = [mock_output_one, mock_output_two]

        mock_transaction_model = MagicMock()
        # user not sending
        mock_transaction_model.sent_amount = 0
        mock_transaction_model.received_amount = 1000000000

        response = PrivacyMetricsService.analyze_same_script_types(
            mock_transaction_model, mock_transaction
        )

        assert response is True

    def test_analyze_same_script_types_pass_if_no_change(self):
        mock_output_one = MagicMock()
        mock_output_one.value = 11234324532

        mock_output_two = MagicMock()
        mock_output_two.value = 1123432342

        mock_transaction = MagicMock()
        mock_transaction.outputs = [mock_output_one, mock_output_two]

        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000000
        # no receiving therefore no change
        mock_transaction_model.received_amount = 0

        response = PrivacyMetricsService.analyze_same_script_types(
            mock_transaction_model, mock_transaction
        )

        assert response is True

    def test_analyze_same_script_types_failse_if_not_same_script_type(self):
        mock_output_one = MagicMock()
        mock_output_one.script_type = "p2pkh"

        mock_output_two = MagicMock()
        mock_output_two.value = 1123432342
        mock_output_two.script_type = "p2wpkh"

        mock_transaction = MagicMock()
        mock_transaction.outputs = [mock_output_one, mock_output_two]

        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000000
        mock_transaction_model.received_amount = 1000

        response = PrivacyMetricsService.analyze_same_script_types(
            mock_transaction_model, mock_transaction
        )

        assert response is False

    def test_analyze_same_script_types_passes_if_same_script_type(self):
        mock_output_one = MagicMock()
        mock_output_one.script_type = "p2pkh"

        mock_output_two = MagicMock()
        mock_output_two.value = 1123432342
        mock_output_two.script_type = "p2pkh"

        mock_transaction = MagicMock()
        mock_transaction.outputs = [mock_output_one, mock_output_two]

        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000000
        mock_transaction_model.received_amount = 1000

        response = PrivacyMetricsService.analyze_same_script_types(
            mock_transaction_model, mock_transaction
        )

        assert response is True

    def test_analyze_no_unnecessary_input_fail(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 1000000
        mock_transaction_model.received_amount = 2000000
        mock_transaction_model.txid = "mock_txid"

        with patch.object(
            WalletService, "get_transaction_inputs_from_db"
        ) as mock_get_transaction_inputs_from_db:
            mock_input_one = MagicMock()
            mock_input_one.value = 1000000
            mock_input_two = MagicMock()

            # unneccessary input
            mock_input_two.value = 2000000
            mock_get_transaction_inputs_from_db.return_value = [
                mock_input_one,
                mock_input_two,
            ]

            response = PrivacyMetricsService.analyze_no_unnecessary_input(
                mock_transaction_model
            )

            assert response is False

    def test_analyze_no_unnecessary_input_pass(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 3001000
        mock_transaction_model.received_amount = 1000
        mock_transaction_model.txid = "mock_txid"

        with patch.object(
            WalletService, "get_transaction_inputs_from_db"
        ) as mock_get_transaction_inputs_from_db:
            mock_input_one = MagicMock()
            mock_input_one.value = 1000000
            mock_input_two = MagicMock()

            mock_input_two.value = 2001000
            mock_get_transaction_inputs_from_db.return_value = [
                mock_input_one,
                mock_input_two,
            ]

            response = PrivacyMetricsService.analyze_no_unnecessary_input(
                mock_transaction_model
            )

            assert response is True

    def test_analyze_no_unnecessary_input_if_not_sending(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 0
        mock_transaction_model.received_amount = 100000
        mock_transaction_model.txid = "mock_txid"

        with patch.object(
            WalletService, "get_transaction_inputs_from_db"
        ) as mock_get_transaction_inputs_from_db:
            mock_get_transaction_inputs_from_db.return_value = []

            response = PrivacyMetricsService.analyze_no_unnecessary_input(
                mock_transaction_model
            )

            # if no inputs contributed, then no input is unnecessary
            assert response is True

    def test_analyze_use_multi_change_outputs_no_change(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 30000
        # no change
        mock_transaction_model.received_amount = 0
        mock_transaction_model.txid = "mock_txid"

        with patch.object(
            WalletService, "get_transaction_outputs_from_db"
        ) as mock_get_transaction_outputs_from_db:
            mock_get_transaction_outputs_from_db.return_value = []

            response = PrivacyMetricsService.analyze_use_multi_change_outputs(
                mock_transaction_model
            )

            # if no change then no need to obscure the change
            assert response is True

    def test_analyze_use_multi_change_outputs_pass(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 30000
        mock_transaction_model.received_amount = 10000
        mock_transaction_model.txid = "mock_txid"

        with patch.object(
            WalletService, "get_transaction_outputs_from_db"
        ) as mock_get_transaction_outputs_from_db:
            mock_get_transaction_outputs_from_db.return_value = [
                MagicMock(),
                MagicMock(),
            ]

            response = PrivacyMetricsService.analyze_use_multi_change_outputs(
                mock_transaction_model
            )

            assert response is True

    def test_analyze_use_multi_change_outputs_fail(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 30000
        mock_transaction_model.received_amount = 10000
        mock_transaction_model.txid = "mock_txid"

        with patch.object(
            WalletService, "get_transaction_outputs_from_db"
        ) as mock_get_transaction_outputs_from_db:
            mock_get_transaction_outputs_from_db.return_value = [
                MagicMock(),
            ]

            response = PrivacyMetricsService.analyze_use_multi_change_outputs(
                mock_transaction_model
            )

            assert response is False

    def test_analyze_no_do_not_spend_utxos_fail(self):
        mock_transaction = MagicMock()
        mock_transaction_input_one = MagicMock()
        mock_transaction_input_one.as_dict.return_value = {
            "prev_txid": "mock_txid",
            "output_n": 0,
        }
        mock_transaction.inputs = [
            mock_transaction_input_one,
        ]

        with patch.object(
            WalletService, "get_output_from_db"
        ) as mock_get_output_from_db:
            mock_db_output_one = MagicMock()
            mock_label = MagicMock()
            mock_label.name = LabelName.DO_NOT_SPEND
            mock_db_output_one.labels = [mock_label]
            mock_get_output_from_db.return_value = mock_db_output_one

            response = PrivacyMetricsService.analyze_no_do_not_spend_utxos(
                mock_transaction
            )
            mock_get_output_from_db.assert_called_once_with("mock_txid", 0)

            assert response is False

    def test_analyze_no_do_not_spend_utxos_pass(self):
        mock_transaction = MagicMock()
        mock_transaction_input_one = MagicMock()
        mock_transaction_input_one.as_dict.return_value = {
            "prev_txid": "mock_txid",
            "output_n": 0,
        }
        mock_transaction.inputs = [
            mock_transaction_input_one,
        ]

        with patch.object(
            WalletService, "get_output_from_db"
        ) as mock_get_output_from_db:
            mock_db_output_one = MagicMock()
            mock_label = MagicMock()
            # kyced label is not a do not spend label
            mock_label.name = LabelName.KYCED
            mock_db_output_one.labels = [mock_label]
            mock_get_output_from_db.return_value = mock_db_output_one

            response = PrivacyMetricsService.analyze_no_do_not_spend_utxos(
                mock_transaction
            )
            mock_get_output_from_db.assert_called_once_with("mock_txid", 0)

            assert response is True

    def test_analyze_no_do_not_spend_utxos_when_not_user_output(self):
        mock_transaction = MagicMock()
        mock_transaction_input_one = MagicMock()
        mock_transaction_input_one.as_dict.return_value = {
            "prev_txid": "mock_txid",
            "output_n": 0,
        }
        mock_transaction.inputs = [
            mock_transaction_input_one,
        ]

        with patch.object(
            WalletService, "get_output_from_db"
        ) as mock_get_output_from_db:
            # not users output
            mock_get_output_from_db.return_value = None

            response = PrivacyMetricsService.analyze_no_do_not_spend_utxos(
                mock_transaction
            )
            mock_get_output_from_db.assert_called_once_with("mock_txid", 0)

            assert response is True

    def test_analyze_no_kyced_inputs_fail(self):
        mock_transaction = MagicMock()
        mock_transaction_input_one = MagicMock()
        mock_transaction_input_one.as_dict.return_value = {
            "prev_txid": "mock_txid",
            "output_n": 0,
        }
        mock_transaction.inputs = [
            mock_transaction_input_one,
        ]

        with patch.object(
            WalletService, "get_output_from_db"
        ) as mock_get_output_from_db:
            mock_db_output_one = MagicMock()
            mock_label = MagicMock()
            mock_label.name = LabelName.KYCED
            mock_db_output_one.labels = [mock_label]
            mock_get_output_from_db.return_value = mock_db_output_one

            response = PrivacyMetricsService.analyze_no_kyced_inputs(
                mock_transaction)
            mock_get_output_from_db.assert_called_once_with("mock_txid", 0)

            assert response is False

    def test_analyze_no_kyced_inputs_pass(self):
        mock_transaction = MagicMock()
        mock_transaction_input_one = MagicMock()
        mock_transaction_input_one.as_dict.return_value = {
            "prev_txid": "mock_txid",
            "output_n": 0,
        }
        mock_transaction.inputs = [
            mock_transaction_input_one,
        ]

        with patch.object(
            WalletService, "get_output_from_db"
        ) as mock_get_output_from_db:
            mock_db_output_one = MagicMock()
            mock_label = MagicMock()
            # not the kyc label
            mock_label.name = LabelName.DO_NOT_SPEND
            mock_db_output_one.labels = [mock_label]
            mock_get_output_from_db.return_value = mock_db_output_one

            response = PrivacyMetricsService.analyze_no_kyced_inputs(
                mock_transaction)
            mock_get_output_from_db.assert_called_once_with("mock_txid", 0)

            assert response is True

    def test_ensure_recently_fetched_outputs_when_never_fetched(self):
        with patch.object(
            LastFetchedService, "get_last_fetched_output_datetime"
        ) as mock_get_last_fetched_output_datetime, patch.object(
            WalletService, "get_all_outputs"
        ) as mock_get_all_outputs:
            mock_get_last_fetched_output_datetime.return_value = None
            response = PrivacyMetricsService.ensure_recently_fetched_outputs()
            # since not recently fetched, we should fetch the outputs
            mock_get_all_outputs.assert_called()
            assert response == None

    def test_ensure_recently_fetched_outputs_when_not_recently_fetched(self):
        with patch.object(
            LastFetchedService, "get_last_fetched_output_datetime"
        ) as mock_get_last_fetched_output_datetime, patch.object(
            WalletService, "get_all_outputs"
        ) as mock_get_all_outputs:
            # 2021 is not recent
            mock_get_last_fetched_output_datetime.return_value = datetime(
                2021, 1, 1)
            response = PrivacyMetricsService.ensure_recently_fetched_outputs()
            # since not recently fetched, we should fetch the outputs
            mock_get_all_outputs.assert_called()
            assert response == None

    def test_ensure_recently_fetched_outputs_when_recently_fetched(self):
        with patch.object(
            LastFetchedService, "get_last_fetched_output_datetime"
        ) as mock_get_last_fetched_output_datetime, patch.object(
            WalletService, "get_all_outputs"
        ) as mock_get_all_outputs:
            # now is recent
            mock_get_last_fetched_output_datetime.return_value = datetime.now()
            response = PrivacyMetricsService.ensure_recently_fetched_outputs()
            # since  recently fetched, we should NOT fetch the outputs
            mock_get_all_outputs.assert_not_called()
            assert response == None

    def test_analyze_avoid_common_change_position_when_no_simple_change(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 30000
        mock_transaction_model.received_amount = 10000
        mock_transaction_model.txid = "mock_txid"
        mock_output = MagicMock()
        mock_output.is_simple_change = False
        mock_transaction_model.outputs = [mock_output]

        response = PrivacyMetricsService.analyze_avoid_common_change_position(
            mock_transaction_model
        )
        # since no change position, then that means we are not using
        # a common change position, therefore this metric passes
        assert response is True

    def test_analyze_avoid_common_change_position_with_small_output_count(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 30000
        mock_transaction_model.received_amount = 10000
        mock_transaction_model.txid = "mock_txid"
        mock_output = MagicMock()
        mock_output.is_simple_change = True
        mock_output.vout = 0
        mock_transaction_model.outputs = [mock_output]

        with patch.object(
            WalletService, "get_all_change_outputs_from_db"
        ) as mock_get_all_change_ouotputs_from_db:
            # only 7 change outputs total
            mock_get_all_change_ouotputs_from_db.return_value = 7

            response = PrivacyMetricsService.analyze_avoid_common_change_position(
                mock_transaction_model
            )
            mock_get_all_change_ouotputs_from_db.assert_called()
            # since less than 8 outputs, then this metric passes
            assert response is True

    def test_analyze_avoid_common_change_position_fails(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 30000
        mock_transaction_model.received_amount = 10000
        mock_transaction_model.txid = "mock_txid"
        mock_output = MagicMock()
        mock_output.is_simple_change = True
        mock_output.vout = 0
        mock_transaction_model.outputs = [mock_output]

        with patch.object(
            WalletService, "get_all_change_outputs_from_db"
        ) as mock_get_all_change_ouotputs_from_db:
            total_change_outputs = 10
            change_outputs_as_vout_0 = 9
            mock_get_all_change_ouotputs_from_db.side_effect = [
                total_change_outputs,
                change_outputs_as_vout_0,
            ]

            response = PrivacyMetricsService.analyze_avoid_common_change_position(
                mock_transaction_model
            )
            mock_get_all_change_ouotputs_from_db.assert_called_with(0, "count")
            # since 9 out of 10 change outputs are vout 0, then this metric fails
            assert response is False

    def test_analyze_avoid_common_change_position_passess(self):
        mock_transaction_model = MagicMock()
        mock_transaction_model.sent_amount = 30000
        mock_transaction_model.received_amount = 10000
        mock_transaction_model.txid = "mock_txid"
        mock_output = MagicMock()
        mock_output.is_simple_change = True
        mock_output.vout = 0
        mock_transaction_model.outputs = [mock_output]

        with patch.object(
            WalletService, "get_all_change_outputs_from_db"
        ) as mock_get_all_change_ouotputs_from_db:
            total_change_outputs = 10
            change_outputs_as_vout_0 = 2
            mock_get_all_change_ouotputs_from_db.side_effect = [
                total_change_outputs,
                change_outputs_as_vout_0,
            ]

            response = PrivacyMetricsService.analyze_avoid_common_change_position(
                mock_transaction_model
            )
            mock_get_all_change_ouotputs_from_db.assert_called_with(0, "count")
            # since only 2 out of 10 change outputs are vout 0, then this metric passes
            assert response is True

    def test_analyze_minimal_tx_history_reveal_with_one_input(self):
        with patch.object(
            WalletService, "get_transaction_inputs_from_db"
        ) as mock_get_transaction_inputs_from_db, patch.object(
            WalletService, "get_all_unspent_outputs_from_db_before_blockheight"
        ) as mock_get_all_unspent_outputs_from_db_before_blockheight:
            mock_get_transaction_inputs_from_db.return_value = [MagicMock()]

            response = PrivacyMetricsService.analyze_minimal_tx_history_reveal(
                MagicMock()
            )
            mock_get_all_unspent_outputs_from_db_before_blockheight.assert_not_called()
            # since only one input then no excess history is revealed
            # therefore this metric passes
            assert response is True

    def test_analyze_minimal_tx_history_reveal_fails(self):
        with patch.object(
            WalletService, "get_transaction_inputs_from_db"
        ) as mock_get_transaction_inputs_from_db, patch.object(
            WalletService, "get_all_unspent_outputs_from_db_before_blockheight"
        ) as mock_get_all_unspent_outputs_from_db_before_blockheight:
            input_that_covers_entire_tx = MagicMock()
            input_that_covers_entire_tx.value = 2000010000
            used_input_one = MagicMock()
            used_input_one.value = 1000000000
            used_input_two = MagicMock()
            used_input_two.value = 1000010000

            mock_get_transaction_inputs_from_db.return_value = [
                used_input_one,
                used_input_two,
            ]

            mock_get_all_unspent_outputs_from_db_before_blockheight.return_value = [
                used_input_one,
                used_input_two,
                input_that_covers_entire_tx,
            ]
            mock_transaction = MagicMock()
            mock_transaction.confirmed_block_height = 100
            mock_transaction.txid = "mock_txid"
            mock_transaction.sent_amount = 2000000000
            mock_transaction.received_amount = 10000
            response = PrivacyMetricsService.analyze_minimal_tx_history_reveal(
                mock_transaction
            )
            mock_get_transaction_inputs_from_db.assert_called_with("mock_txid")
            mock_get_all_unspent_outputs_from_db_before_blockheight.assert_called_with(
                100
            )
            # since we could have used one utxo instead of two
            # then this metric fails
            assert response is False

    def test_analyze_minimal_tx_history_reveal_passes(self):
        with patch.object(
            WalletService, "get_transaction_inputs_from_db"
        ) as mock_get_transaction_inputs_from_db, patch.object(
            WalletService, "get_all_unspent_outputs_from_db_before_blockheight"
        ) as mock_get_all_unspent_outputs_from_db_before_blockheight:
            used_input_one = MagicMock()
            used_input_one.value = 1000000000
            used_input_two = MagicMock()
            used_input_two.value = 1000000000

            not_used_input = MagicMock()
            not_used_input.value = 1000000000

            mock_get_transaction_inputs_from_db.return_value = [
                used_input_one,
                used_input_two,
            ]

            mock_get_all_unspent_outputs_from_db_before_blockheight.return_value = [
                not_used_input,
                used_input_one,
                used_input_two,
            ]
            mock_transaction = MagicMock()
            mock_transaction.confirmed_block_height = 100
            mock_transaction.txid = "mock_txid"
            mock_transaction.sent_amount = 2000000000
            mock_transaction.received_amount = 10000
            response = PrivacyMetricsService.analyze_minimal_tx_history_reveal(
                mock_transaction
            )
            mock_get_transaction_inputs_from_db.assert_called_with("mock_txid")
            mock_get_all_unspent_outputs_from_db_before_blockheight.assert_called_with(
                100
            )
            # since we could not have used less than 2 utxos
            # then this metric fails
            assert response is True

    def test_analyze_tx_privacy_ensures_recent_outputs_call(self):
        mock_txid = "mock_txid"
        # empty array since we are just testing the initial calls
        privacy_metrics = []
        with patch.object(
            PrivacyMetricsService, "ensure_recently_fetched_outputs"
        ) as mock_ensure_recently_fetched_outputs, patch.object(
            WalletService, "get_transaction_details"
        ) as mock_get_transaction_details, patch.object(
            WalletService, "get_transaction"
        ) as mock_get_transaction:
            response = PrivacyMetricsService.analyze_tx_privacy(
                mock_txid, privacy_metrics
            )

            mock_ensure_recently_fetched_outputs.assert_called()
            mock_get_transaction.assert_called_with(mock_txid)
            mock_get_transaction_details.assert_called_with(mock_txid)

            assert response == {}

    def test_analyze_tx_privacy_calls_all_metric_methods(self):
        mock_txid = "mock_txid"
        # empty array since we are just testing the initial calls
        privacy_metrics = [
            PrivacyMetricName.ANNOMINITY_SET,
            PrivacyMetricName.NO_ADDRESS_REUSE,
            PrivacyMetricName.MINIMAL_WEALTH_REVEAL,
            PrivacyMetricName.MINIMAL_TX_HISTORY_REVEAL,
            PrivacyMetricName.NO_CHANGE,
            PrivacyMetricName.NO_SMALL_CHANGE,
            PrivacyMetricName.NO_ROUND_NUMBER_PAYMENTS,
            PrivacyMetricName.SAME_SCRIPT_TYPES,
            PrivacyMetricName.NO_UNNECESSARY_INPUT,
            PrivacyMetricName.USE_MULTI_CHANGE_OUTPUTS,
            PrivacyMetricName.AVOID_COMMON_CHANGE_POSITION,
            PrivacyMetricName.NO_DO_NOT_SPEND_UTXOS,
            PrivacyMetricName.NO_KYCED_UTXOS,
        ]

        with patch.object(
            PrivacyMetricsService, "ensure_recently_fetched_outputs"
        ) as mock_ensure_recently_fetched_outputs, patch.object(
            WalletService, "get_transaction_details"
        ) as mock_get_transaction_details, patch.object(
            WalletService, "get_transaction"
        ) as mock_get_transaction, patch.object(
            PrivacyMetricsService, "analyze_annominity_set"
        ) as mock_analyze_annominity_set, patch.object(
            PrivacyMetricsService, "analyze_no_address_reuse"
        ) as mock_analyze_no_address_reuse, patch.object(
            PrivacyMetricsService, "analyze_significantly_minimal_wealth_reveal"
        ) as mock_analyze_significantly_minimal_wealth_reveal, patch.object(
            PrivacyMetricsService, "analyze_minimal_tx_history_reveal"
        ) as mock_analyze_minimal_tx_history_reveal, patch.object(
            PrivacyMetricsService, "analyze_no_change"
        ) as mock_analyze_no_change, patch.object(
            PrivacyMetricsService, "analyze_no_small_change"
        ) as mock_analyze_no_small_change, patch.object(
            PrivacyMetricsService, "analyze_no_round_number_payments"
        ) as mock_analyze_no_round_number_payments, patch.object(
            PrivacyMetricsService, "analyze_same_script_types"
        ) as mock_analyze_same_script_types, patch.object(
            PrivacyMetricsService, "analyze_no_unnecessary_input"
        ) as mock_analyze_no_unnecessary_input, patch.object(
            PrivacyMetricsService, "analyze_use_multi_change_outputs"
        ) as mock_analyze_use_multi_change_outputs, patch.object(
            PrivacyMetricsService, "analyze_avoid_common_change_position"
        ) as mock_analyze_avoid_common_change_position, patch.object(
            PrivacyMetricsService, "analyze_no_do_not_spend_utxos"
        ) as mock_analyze_no_do_not_spend_utxos, patch.object(
            PrivacyMetricsService, "analyze_no_kyced_inputs"
        ) as mock_analyze_no_kyced_inputs:
            mock_analyze_no_kyced_inputs.return_value = True
            mock_analyze_no_do_not_spend_utxos.return_value = True
            mock_analyze_avoid_common_change_position.return_value = True
            mock_analyze_use_multi_change_outputs.return_value = True
            mock_analyze_no_unnecessary_input.return_value = True
            mock_analyze_same_script_types.return_value = True
            mock_analyze_no_round_number_payments.return_value = True
            mock_analyze_no_address_reuse.return_value = True
            mock_analyze_no_small_change.return_value = True
            mock_analyze_no_change.return_value = True
            mock_analyze_annominity_set.return_value = True
            mock_analyze_significantly_minimal_wealth_reveal.return_value = True
            mock_analyze_minimal_tx_history_reveal.return_value = True
            mock_get_transaction_details.return_value = MagicMock()
            mock_get_transaction.return_value = MagicMock()

            response = PrivacyMetricsService.analyze_tx_privacy(
                mock_txid, privacy_metrics
            )

            mock_ensure_recently_fetched_outputs.assert_called()
            mock_get_transaction.assert_called_with(mock_txid)
            mock_get_transaction_details.assert_called_with(mock_txid)

            assert response == {
                PrivacyMetricName.ANNOMINITY_SET: True,
                PrivacyMetricName.NO_ADDRESS_REUSE: True,
                PrivacyMetricName.MINIMAL_WEALTH_REVEAL: True,
                PrivacyMetricName.MINIMAL_TX_HISTORY_REVEAL: True,
                PrivacyMetricName.NO_CHANGE: True,
                PrivacyMetricName.NO_SMALL_CHANGE: True,
                PrivacyMetricName.NO_ROUND_NUMBER_PAYMENTS: True,
                PrivacyMetricName.SAME_SCRIPT_TYPES: True,
                PrivacyMetricName.NO_UNNECESSARY_INPUT: True,
                PrivacyMetricName.USE_MULTI_CHANGE_OUTPUTS: True,
                PrivacyMetricName.AVOID_COMMON_CHANGE_POSITION: True,
                PrivacyMetricName.NO_DO_NOT_SPEND_UTXOS: True,
                PrivacyMetricName.NO_KYCED_UTXOS: True,
            }
