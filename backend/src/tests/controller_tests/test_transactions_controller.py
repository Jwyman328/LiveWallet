from unittest import TestCase

from unittest.mock import MagicMock, Mock
from typing import List
from src.app import AppCreator
from src.models.label import Label
from src.my_types.controller_types.utxos_dtos import (
    OutputLabelDto,
    PopulateOutputLabelsRequestDto,
)
from src.services.wallet.wallet import WalletService
from src.tests.mocks import all_transactions_mock
import json
from bitcoinlib.transactions import Output


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
        get_all_transactions_mock = MagicMock(
            return_value=all_transactions_mock)
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_all_transactions = get_all_transactions_mock
            get_transactions_response = self.test_client.get("/transactions/")

            get_all_transactions_mock.assert_called_once()

            assert get_transactions_response.status == "200 OK"
            assert json.loads(get_transactions_response.data) == {
                "transactions": [tx.as_dict() for tx in all_transactions_mock]
            }

    def test_get_utxos(self):
        output_lists: List[List[Output]] = [
            tx.outputs for tx in all_transactions_mock]
        all_outputs = [
            output for output_list in output_lists for output in output_list]
        get_all_outputs_mock = MagicMock(return_value=all_outputs)
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_all_outputs = get_all_outputs_mock
            get_all_outputs_response = self.test_client.get(
                "transactions/outputs")

            get_all_outputs_mock.assert_called_once()

            assert get_all_outputs_response.status == "200 OK"
            assert json.loads(get_all_outputs_response.data) == {
                "outputs": [output.as_dict() for output in all_outputs]
            }

    def test_get_output_labels(self):
        output_labels = [
            OutputLabelDto(
                label="mock_label",
                display_name="mock_display_name",
                description="mock_display_description",
            )
        ]
        get_all_output_labels = MagicMock(return_value=output_labels)
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_output_labels = get_all_output_labels
            get_all_output_labels_response = self.test_client.get(
                "transactions/outputs/labels"
            )

            get_all_output_labels.assert_called_once()

            assert get_all_output_labels_response.status == "200 OK"
            assert json.loads(get_all_output_labels_response.data) == {
                "labels": [label.model_dump() for label in output_labels]
            }

    def test_post_output_labels(self):
        output_label_mock_one = Mock()
        output_label_mock_one.name = "mock_name_1"
        output_label_mock_one.display_name = "mock_display_name_1"
        output_label_mock_one.description = "mock_description_1"

        output_label_mock_two = Mock()
        output_label_mock_two.name = "mock_name_2"
        output_label_mock_two.display_name = "mock_display_name_2"
        output_label_mock_two.description = "mock_description_2"

        output_labels = [output_label_mock_one, output_label_mock_two]
        add_label_to_output_mock = MagicMock(return_value=output_labels)
        output_label_request_body = {
            "txid": "mockTxId",
            "vout": 0,
            "labelName": "mockLabelName",
        }
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.add_label_to_output = add_label_to_output_mock
            post_output_labels_response = self.test_client.post(
                "transactions/outputs/label",
                json=output_label_request_body,
            )

            add_label_to_output_mock.assert_called_once_with(
                "mockTxId", 0, "mockLabelName"
            )

            assert post_output_labels_response.status == "200 OK"
            assert json.loads(post_output_labels_response.data) == {
                "labels": [
                    dict(
                        label=label.name,
                        display_name=label.display_name,
                        description=label.description,
                    )
                    for label in output_labels
                ]
            }

    def test_remove_output_label(self):
        output_label_mock_one = Mock()
        output_label_mock_one.name = "mock_name_1"
        output_label_mock_one.display_name = "mock_display_name_1"
        output_label_mock_one.description = "mock_description_1"

        output_labels = [output_label_mock_one]
        remove_label_from_output_mock = MagicMock(return_value=output_labels)
        txid_request_param = "mockTxId"
        vout_request_param = 0
        labelName_request_param = "labelNameMock"
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.remove_label_from_output = (
                remove_label_from_output_mock
            )

            remove_output_labels_response = self.test_client.delete(
                f"transactions/outputs/label?txid={txid_request_param}&vout={vout_request_param}&labelName={labelName_request_param}",
            )

            remove_label_from_output_mock.assert_called_once_with(
                txid_request_param, vout_request_param, labelName_request_param
            )

            assert remove_output_labels_response.status == "200 OK"

            # should return existing labels
            assert json.loads(remove_output_labels_response.data) == {
                "labels": [
                    dict(
                        label=label.name,
                        display_name=label.display_name,
                        description=label.description,
                    )
                    for label in output_labels
                ]
            }

    def test_get_populate_labels(self):
        output_label_mock_one = OutputLabelDto(
            label="mock_label",
            display_name="mock_display_name",
            description="mock_display_description",
        )

        mock_populate_labels = {"mock-txid-0": [output_label_mock_one]}
        get_output_labels_unique_mock = MagicMock(
            return_value=mock_populate_labels)

        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_output_labels_unique = (
                get_output_labels_unique_mock
            )

            get_output_populate_labels_response = self.test_client.get(
                f"transactions/outputs/populate-labels",
            )

            get_output_labels_unique_mock.assert_called_once()

            assert get_output_populate_labels_response.status == "200 OK"

            # should return existing labels
            assert json.loads(get_output_populate_labels_response.data) == {
                "mock-txid-0": [
                    {
                        "label": "mock_label",
                        "display_name": "mock_display_name",
                        "description": "mock_display_description",
                    }
                ]
            }

    def test_post_populate_labels(self):
        populate_outputs_and_labels_mock = MagicMock(return_value=None)

        mock_populate_labels_body = {
            "mock-txid-0": [
                {
                    "label": "mock_label",
                    "display_name": "mock_display_name",
                    "description": "mock_display_description",
                }
            ]
        }

        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.populate_outputs_and_labels = (
                populate_outputs_and_labels_mock
            )

            get_output_populate_labels_response = self.test_client.post(
                f"transactions/outputs/populate-labels", json=mock_populate_labels_body
            )

            populate_outputs_and_labels_mock.assert_called_once_with(
                PopulateOutputLabelsRequestDto(mock_populate_labels_body)
            )

            assert get_output_populate_labels_response.status == "200 OK"

            assert json.loads(get_output_populate_labels_response.data) == {
                "success": True
            }
