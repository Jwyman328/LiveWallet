from typing import Optional
from bdkpython import bdk
from bitcoinlib.transactions import Transaction
from src.database import DB
from src.models.label import LabelName
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
        # Check that all outputs have already been fetched recently
        cls.ensure_recently_fetched_outputs()

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
                result = cls.analyze_no_do_not_spend_utxos(
                    transaction=transaction)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_KYCED_UTXOS:
                result = cls.analyze_no_kyced_inputs(transaction=transaction)
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
        # hmm should this analyze every possibility to see if the user could have revealed a few less sats or
        # should it just try to minimize the wealth reveal by a certain amount? like don't reveal more than 100% of the tx toal?
        # ...
        # get all utxos ever.
        # get the ones that were in a transaction before this transaction in question.
        # get how much change was
        # then check if
        return True

    @classmethod
    def analyze_minimal_tx_history_reveal(cls, txid: str) -> bool:
        # if only one utxo was used by this user in this tx then this automaticcaly passes since you cant use less than one utxo in a tx.
        # get all utxos ever for this user.
        # get only the ones that were created before the transaction in question.
        # get the user's utxos that were used in this transaction. and calculate how much total they contributed to the transaction
        # then use an algorithm that tries to get the same amount of value out of the users utxos at the time using less utxos than the ones the user used.
        # this algo will order all the utxos by size, then it will start by picking the first one, if that is bigger than the total then the metric fails.
        # then if there are more than two of the users utxos in the original tx it will combine the top two utxos and if that is more than the utxo total contributed by the user then the metric will fail.
        # this will continue until it reachs the point where either the amount of utxos contributed has been tried by the top amount utxos resulting in a passing metric, or less than the amount of utxos contributed as been tried and has found that the user could have used less utxos to create the tx. Thus failing because they linked more utxos together than needed.
        # needed as inputs

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
        # is this the same as annominity set or just looser? like the outputs shouldn't be more than 100% different or else
        # it is easy to tell the change output?
        return True

    @classmethod
    def analyze_no_unnecessary_input(cls, txid: str) -> bool:
        # hmmm how should I do this?
        return True

    @classmethod
    def analyze_use_multi_change_outputs(cls, txid: str) -> bool:
        # this hsould be easy
        # if you are making a tx (aka include an input) and have a change output
        # you should have more than one output.
        return True

    @classmethod
    def analyze_avoid_common_change_position(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_do_not_spend_utxos(cls, transaction: Optional[Transaction]) -> bool:
        """Check that no inputs in this transaction come from outputs that were marked as do not spend

        If an input is used that was a utxo marked as do not spend then this metric fails.
        If no inputs were utxos marked as do not spend then this metric passes.
        """

        if transaction is None:
            return False

        for input in transaction.inputs:
            input = input.as_dict()
            # get output in the db that each input is refering to.
            users_output = WalletService.get_output_from_db(
                input["prev_txid"], input["output_n"]
            )

            if users_output is None:
                # this is not the users output
                # therefore it can not be labeled by the user
                # therefore check the next input/output
                continue

            if LabelName.DO_NOT_SPEND in [label.name for label in users_output.labels]:
                return False
        return True

    @classmethod
    def analyze_no_kyced_inputs(cls, transaction: Optional[Transaction]) -> bool:
        """Check that no inputs in this transaction come from outputs that were marked as being kyced.

        If an input is used that was a utxo marked as kyced then this metric fails.
        If no inputs were utxos marked as kyced then this metric passes.
        """

        if transaction is None:
            return False

        for input in transaction.inputs:
            input = input.as_dict()
            # get output in the db that each input is refering to.
            users_output = WalletService.get_output_from_db(
                input["prev_txid"], input["output_n"]
            )

            if users_output is None:
                # this is not the users output
                # therefore it can not be labeled by the user
                # therefore check the next input/output
                continue

            if LabelName.KYCED in [label.name for label in users_output.labels]:
                return False
        return True

    # I don't like this option any more, dust is more about fees
    # a user should just mark a "tracker" output sent to them as do not spend
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
