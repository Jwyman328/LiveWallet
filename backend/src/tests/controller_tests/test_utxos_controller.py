from unittest import TestCase

from unittest.mock import MagicMock, Mock
from src.app import AppCreator
from src.services.wallet.wallet import GetFeeEstimateForUtxoResponseType, WalletService
from src.types import FeeDetails
from src.types import GetUtxosRequestDto
from src.tests.mocks import local_utxo_mock
from bdkpython import bdk
import json


class TestUtxosController(TestCase):
    def setUp(self):
        app_creator = AppCreator()
        self.app = app_creator.create_app()
        self.test_client = self.app.test_client()
        self.mock_wallet_service = MagicMock(WalletService)
        self.mock_wallet_class = MagicMock(
            WalletService, return_value=self.mock_wallet_service
        )

    def test_get_utxos(self):
        utxos_mock = [local_utxo_mock]
        get_all_utxos_mock = MagicMock(return_value=utxos_mock)
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_all_utxos = get_all_utxos_mock
            get_utxo_response = self.test_client.get("/utxos/")

            get_all_utxos_mock.assert_called_once()
            expected_utxos = [
                {
                    "txid": local_utxo_mock.outpoint.txid,
                    "vout": local_utxo_mock.outpoint.vout,
                    "amount": local_utxo_mock.txout.value,
                }
            ]

            assert get_utxo_response.status == "200 OK"
            assert json.loads(get_utxo_response.data) == {"utxos": expected_utxos}

    def test_get_fee_for_utxo_success(self):
        self.mock_fee_details = FeeDetails(0.1, 100)
        mock_get_fee_estimate_for_utxos_from_request = MagicMock(
            return_value=GetFeeEstimateForUtxoResponseType(
                "success", self.mock_fee_details, psbt=None
            )
        )
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_fee_estimate_for_utxos_from_request = (
                mock_get_fee_estimate_for_utxos_from_request
            )

            fee_rate = "5"
            outputCount = "2"

            # /{transaction_id}/{vout} put this in the request args
            transactions = [
                {
                    "id": f"{local_utxo_mock.outpoint.txid}",
                    "vout": f"{local_utxo_mock.outpoint.vout}",
                },
            ]
            response = self.test_client.post(
                "/utxos/fees",
                query_string={"feeRate": fee_rate, "outputCount": outputCount},
                json=transactions,
            )

            mock_get_fee_estimate_for_utxos_from_request.assert_called_with(
                GetUtxosRequestDto.model_validate(
                    dict(
                        transactions=transactions,
                        fee_rate=fee_rate,
                        output_count=outputCount,
                    )
                )
            )

            assert json.loads(response.data) == {
                "spendable": True,
                "fee": self.mock_fee_details.fee,
                "psbt": None,
            }

    def test_get_fee_for_utxo_success_with_psbt(self):
        self.mock_fee_details = FeeDetails(0.1, 100)

        mock_psbt = Mock(bdk.PartiallySignedTransaction)
        mock_psbt_base64 = "mock_psbt_base64"
        mock_psbt.serialize.return_value = mock_psbt_base64
        mock_get_fee_estimate_for_utxos_from_request = MagicMock(
            return_value=GetFeeEstimateForUtxoResponseType(
                "success", self.mock_fee_details, psbt=mock_psbt
            )
        )
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_fee_estimate_for_utxos_from_request = (
                mock_get_fee_estimate_for_utxos_from_request
            )

            fee_rate = "5"
            outputCount = "2"

            # /{transaction_id}/{vout} put this in the request args
            transactions = [
                {
                    "id": f"{local_utxo_mock.outpoint.txid}",
                    "vout": f"{local_utxo_mock.outpoint.vout}",
                },
            ]
            response = self.test_client.post(
                "/utxos/fees",
                query_string={
                    "feeRate": fee_rate,
                    "outputCount": outputCount,
                    "includePsbt": True,
                },
                json=transactions,
            )

            mock_get_fee_estimate_for_utxos_from_request.assert_called_with(
                GetUtxosRequestDto.model_validate(
                    dict(
                        transactions=transactions,
                        fee_rate=fee_rate,
                        output_count=outputCount,
                        include_psbt=True,
                    )
                )
            )

            assert json.loads(response.data) == {
                "spendable": True,
                "fee": self.mock_fee_details.fee,
                "psbt": mock_psbt_base64,
            }

    def test_get_fee_for_utxo_success_with_includePsbt_false(self):
        self.mock_fee_details = FeeDetails(0.1, 100)

        mock_psbt = Mock(bdk.PartiallySignedTransaction)
        mock_psbt_base64 = "mock_psbt_base64"
        mock_psbt.serialize.return_value = mock_psbt_base64
        mock_get_fee_estimate_for_utxos_from_request = MagicMock(
            return_value=GetFeeEstimateForUtxoResponseType(
                "success", self.mock_fee_details, psbt=mock_psbt
            )
        )
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_fee_estimate_for_utxos_from_request = (
                mock_get_fee_estimate_for_utxos_from_request
            )

            fee_rate = "5"
            outputCount = "2"

            # /{transaction_id}/{vout} put this in the request args
            transactions = [
                {
                    "id": f"{local_utxo_mock.outpoint.txid}",
                    "vout": f"{local_utxo_mock.outpoint.vout}",
                },
            ]
            response = self.test_client.post(
                "/utxos/fees",
                query_string={
                    "feeRate": fee_rate,
                    "outputCount": outputCount,
                    "includePsbt": False,
                },
                json=transactions,
            )

            mock_get_fee_estimate_for_utxos_from_request.assert_called_with(
                GetUtxosRequestDto.model_validate(
                    dict(
                        transactions=transactions,
                        fee_rate=fee_rate,
                        output_count=outputCount,
                        include_psbt=False,
                    )
                )
            )

            assert json.loads(response.data) == {
                "spendable": True,
                "fee": self.mock_fee_details.fee,
                "psbt": None,
            }

    def test_get_fee_for_utxo_unspendable_error(self):
        mock_get_fee_estimate_for_utxos_from_request = MagicMock(
            return_value=GetFeeEstimateForUtxoResponseType("unspendable", None, None)
        )
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_fee_estimate_for_utxos_from_request = (
                mock_get_fee_estimate_for_utxos_from_request
            )

            fee_rate = "5"
            output_count = "2"
            transactions = [
                {
                    "id": f"{local_utxo_mock.outpoint.txid}",
                    "vout": f"{local_utxo_mock.outpoint.vout}",
                },
            ]
            response = self.test_client.post(
                "/utxos/fees",
                query_string={"feeRate": fee_rate, "outputCount": output_count},
                json=transactions,
            )

            mock_get_fee_estimate_for_utxos_from_request.assert_called_with(
                GetUtxosRequestDto.model_validate(
                    dict(
                        transactions=transactions,
                        fee_rate=fee_rate,
                        output_count=output_count,
                    )
                )
            )

            assert json.loads(response.data) == {
                "errors": ["unspendable"],
                "spendable": False,
                "message": "Error getting tx fee",
            }

    def test_get_fee_for_utxo_error(self):
        mock_get_fee_estimate_for_utxos_from_request = MagicMock(
            return_value=GetFeeEstimateForUtxoResponseType("error", None, None)
        )
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_fee_estimate_for_utxos_from_request = (
                mock_get_fee_estimate_for_utxos_from_request
            )

            fee_rate = "5"
            outputCount = "2"
            transactions = [
                {
                    "id": f"{local_utxo_mock.outpoint.txid}",
                    "vout": f"{local_utxo_mock.outpoint.vout}",
                },
            ]
            response = self.test_client.post(
                "/utxos/fees",
                query_string={"feeRate": fee_rate, "outputCount": outputCount},
                json=transactions,
            )

            mock_get_fee_estimate_for_utxos_from_request.assert_called_with(
                GetUtxosRequestDto.model_validate(
                    dict(
                        transactions=transactions,
                        fee_rate=fee_rate,
                        output_count=outputCount,
                    )
                )
            )

            assert response.status == "400 BAD REQUEST"
            assert json.loads(response.data) == {
                "errors": ["error getting fee estimate for utxo"],
                "spendable": False,
                "message": "Error getting fee estimate for utxos",
            }

    def test_get_utxo_fee_request_data_validation_error(self):
        with self.app.container.wallet_service.override(self.mock_wallet_service):
            self.mock_wallet_service.get_utxos_info.return_value = [local_utxo_mock]

            transactions = ["bad data", "yes it is bad"]
            response = self.test_client.post(
                "/utxos/fees",
                query_string={"feeRate": "1", "outputCount": "2"},
                json=transactions,
            )

            assert response.status == "400 BAD REQUEST"

            response_data = json.loads(response.data)
            assert response_data["message"] == "Error getting fee estimate for utxos"
            assert response_data["spendable"] == False
            print("rp data", response_data["errors"])
            assert len(response_data["errors"]) == 2
