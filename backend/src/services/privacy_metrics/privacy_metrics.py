from typing import Optional
from bdkpython import bdk
from bitcoinlib.transactions import Transaction
from src.database import DB
from src.models.privacy_metric import PrivacyMetric, PrivacyMetricName
from src.models.outputs import Output as OutputModel
from datetime import datetime, timedelta
from src.models.transaction import Transaction as TransactionModel

import structlog

from src.services.wallet.wallet import WalletService

LOGGER = structlog.get_logger()


class PrivacyMetricsService:
    @classmethod
    def get_all_privacy_metrics(cls) -> list[PrivacyMetric]:
        all_metrics = DB.session.query(PrivacyMetric).all()
        return all_metrics

    @classmethod
    def analyze_tx_privacy(
        cls, txid: str, privacy_metrics: list[PrivacyMetricName]
    ) -> dict[PrivacyMetricName, bool]:
        from src.services.wallet.wallet import WalletService

        results: dict[PrivacyMetricName, bool] = dict()

        transaction_details = WalletService.get_transaction_details(txid)
        transaction = WalletService.get_transaction(txid)
        for privacy_metric in privacy_metrics:
            if privacy_metric == PrivacyMetricName.ANNOMINITY_SET:
                mock_set = 2
                result = cls.analyze_annominity_set(transaction, mock_set)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_ADDRESS_REUSE:
                result = cls.analyze_no_address_reuse(txid)
                results[privacy_metric] = result
            elif privacy_metric == PrivacyMetricName.MINIMAL_WEALTH_REVEAL:
                result = cls.analyze_minimal_wealth_reveal(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.MINIMAL_TX_HISTORY_REVEAL:
                result = cls.analyze_minimal_tx_history_reveal(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.TIMING_ANALYSIS:
                result = cls.analyze_timing_analysis(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_CHANGE:
                result = cls.analyze_no_change(transaction_details)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_SMALL_CHANGE:
                result = cls.analyze_no_small_change(transaction_details)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_ROUND_NUMBER_PAYMENTS:
                result = cls.analyze_no_round_number_payments(transaction)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.SAME_SCRIPT_TYPES:
                result = cls.analyze_same_script_types(
                    transaction_details=transaction_details, transaction=transaction
                )
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.AVOID_OUTPUT_SIZE_DIFFERENCE:
                result = cls.analyze_avoid_output_size_difference(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_UNNECESSARY_INPUT:
                result = cls.analyze_no_unnecessary_input(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.USE_MULTI_CHANGE_OUTPUTS:
                result = cls.analyze_use_multi_change_outputs(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.AVOID_COMMON_CHANGE_POSITION:
                result = cls.analyze_avoid_common_change_position(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_DO_NOT_SPEND_UTXOS:
                result = cls.analyze_no_do_not_spend_utxos(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_KYCED_UTXOS:
                result = cls.analyze_no_kyced_utxos(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_DUST_ATTACK_UTXOS:
                result = cls.analyze_no_dust_attack_utxos(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_POST_MIX_CHANGE:
                result = cls.analyze_no_post_mix_change(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.SEGREGATE_POSTMIX_AND_NONMIX:
                result = cls.analyze_segregate_postmix_and_nonmix(txid)
                results[privacy_metric] = result

        return results

    @classmethod
    def analyze_annominity_set(
        cls,
        transaction: Optional[Transaction],
        desired_annominity_set: int = 2,
        allow_some_uneven_change: bool = True,
    ) -> bool:
        """Analyze if the users output/s in the tx have the desired annominity
        set.

        If allow_some_uneven_change is True, then the privacy metric will pass
        if atleast one of the user's outputs is above the
        desired annominity set.

        If allow_some_uneven_change is False, then the privacy metric will
        only pass if all of the user's outputs are above the desired
        annominity set.
        """
        if transaction is None:
            return False
        # compare the users utxos to other utxos,
        # if other utxos do not have the same value
        # then this fails the annominity set metric

        # Check that all outputs have already been fetched recently
        cls.ensure_recently_fetched_outputs()

        output_annominity_count = WalletService.calculate_output_annominity_sets(
            transaction.outputs
        )
        users_utxos_that_passed_annominity_test = 0
        users_utxos_that_failed_annominity_test = 0
        for output in transaction.outputs:
            user_output = WalletService.get_output_from_db(
                transaction.txid, output.output_n
            )
            is_users_output = user_output is not None
            if is_users_output:
                annominity_set = output_annominity_count[output.value]
                if annominity_set < desired_annominity_set:
                    # the users output has a lower annominity set
                    # than the desired annominity set
                    # therefore this metric fails
                    users_utxos_that_failed_annominity_test += 1
                else:
                    users_utxos_that_passed_annominity_test += 1

        if users_utxos_that_passed_annominity_test == 0:
            return False

        if allow_some_uneven_change is False:
            # if the user has any utxos that failed the annominity test
            # then this metric fails
            if users_utxos_that_failed_annominity_test > 0:
                return False
            else:
                # all utxos passed the annominity test
                return True
        else:  # allow_some_uneven_change is True
            # at this point we know that the user has at least one utxo
            # that passed the annominity test, if the user has other utxos
            # that do not have an annominity set above 0 we just consider it part of the
            # uneven change that is allowed.
            return True

    @classmethod
    def analyze_no_address_reuse(
        cls,
        txid: str,
    ) -> bool:
        # can I inject this in?
        # circular imports are currently preventing it.
        from src.services.wallet.wallet import WalletService

        # Check that all outputs have already been fetched recently
        cls.ensure_recently_fetched_outputs()
        outputs = OutputModel.query.filter_by(txid=txid).all()
        for output in outputs:
            if WalletService.is_address_reused(output.address):
                LOGGER.info(f"Address {output.address} has been reused")
                return False

        return True

    @classmethod
    def analyze_minimal_wealth_reveal(
        cls,
        txid: str,
    ) -> bool:
        return True

    @classmethod
    def analyze_minimal_tx_history_reveal(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_timing_analysis(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_change(cls, transaction_details: Optional[TransactionModel]) -> bool:
        if transaction_details is None:
            return False
        if (
            transaction_details.sent_amount > 0
            and transaction_details.received_amount > 0
        ):
            return False
        return True

    @classmethod
    def analyze_no_small_change(
        cls, transaction_details: Optional[TransactionModel]
    ) -> bool:
        if transaction_details is None:
            return False

        total_change = (
            transaction_details.sent_amount - transaction_details.received_amount
        )
        # 50,000 sats is about $35 at $69k
        # when fees are at 100 sat/vbyte, this utxo would cost about
        # 30% in fees of its total amount.
        # TODO should this be 100,000 sats?
        acceptable_change_amount = 50000
        if total_change > acceptable_change_amount:
            return False
        else:
            return True

    @classmethod
    def analyze_no_round_number_payments(
        cls, transaction: Optional[Transaction]
    ) -> bool:
        """Check if this transaction's change is easily detectable due to
        having a round number payment output and a non round number change
        output.
        Use the last four digits to determine if an output is a round number.
        This privacy check will fail if there is an output with a last four
        digits of 0 and an output with a last four digits not equal to 0.
        """

        if transaction is None:
            return False

        is_non_round_output_count = 0
        is_round_output_count = 0
        outputs = transaction.outputs
        for output in outputs:
            last_four_digits = output.value % 10000
            if last_four_digits == 0:
                is_round_output_count += 1
            else:
                is_non_round_output_count += 1

        if is_non_round_output_count > 0 and is_round_output_count > 0:
            # there is a round number output and a non round number output
            # which means it is easy to detect the change output,
            # which is the non round number output.
            return False
        else:
            return True

    @classmethod
    def analyze_same_script_types(
        cls,
        transaction_details: Optional[TransactionModel],
        transaction: Optional[Transaction],
    ) -> bool:
        """Analyze if the transaction is a spend to an output with a different
        script type than the user's input.

        This would be bad for privacy by linking the user's input to the output
        with the same script type.
        """
        if transaction is None or transaction_details is None:
            return False

        # we are trying to obfuscate the change output
        # so if there is no change then this passes
        is_no_change = cls.analyze_no_change(transaction_details)
        if is_no_change:
            return True

        is_the_user_sending_funds = transaction_details.sent_amount > 0
        if is_the_user_sending_funds is False:
            # this privacy metric does not apply if the user
            # is not sending funds
            return True

        output_script_types = set()

        for output in transaction.outputs:
            output_script_types.add(output.script_type)

        if len(output_script_types) > 1:
            # there are two different output script types
            # and we know one must be this users
            # linking an input and an output.
            # Therefore this privacy metric fails
            return False
        else:
            return True

    @classmethod
    def analyze_avoid_output_size_difference(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_unnecessary_input(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_use_multi_change_outputs(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_avoid_common_change_position(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_do_not_spend_utxos(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_kyced_utxos(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_dust_attack_utxos(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_post_mix_change(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_segregate_postmix_and_nonmix(cls, txid: str) -> bool:
        return True

    @classmethod
    def ensure_recently_fetched_outputs(cls) -> None:
        from src.services.last_fetched.last_fetched_service import LastFetchedService

        # Check that all outputs have already been fetched recently
        last_fetched_output_datetime = (
            LastFetchedService.get_last_fetched_output_datetime()
        )
        now = datetime.now()
        refetch_interval = timedelta(minutes=5)

        should_refetch_outputs = (
            now - last_fetched_output_datetime > refetch_interval
            if last_fetched_output_datetime is not None
            else True  # if last_fetched_output_datetime is None, we should "fetch" for first time
        )

        if last_fetched_output_datetime is None or should_refetch_outputs:
            LOGGER.info(
                "No last fetched output datetime found, fetching all outputs")
            # this will get all the outputs and add them to the database, ensuring that they exist
            WalletService.get_all_outputs()
