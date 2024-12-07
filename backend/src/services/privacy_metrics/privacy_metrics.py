from typing import Optional
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
                result = cls.analyze_significantly_minimal_wealth_reveal(
                    transaction=transaction_details
                )
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.MINIMAL_TX_HISTORY_REVEAL:
                result = cls.analyze_minimal_tx_history_reveal(
                    transaction_details=transaction_details
                )
                results[privacy_metric] = result

            # TODO
            # elif privacy_metric == PrivacyMetricName.TIMING_ANALYSIS:
            #     result = cls.analyze_timing_analysis(txid)
            #     results[privacy_metric] = result

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

            elif privacy_metric == PrivacyMetricName.NO_UNNECESSARY_INPUT:
                result = cls.analyze_no_unnecessary_input(
                    transaction_details=transaction_details
                )
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.USE_MULTI_CHANGE_OUTPUTS:
                result = cls.analyze_use_multi_change_outputs(
                    transaction_details=transaction_details
                )
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.AVOID_COMMON_CHANGE_POSITION:
                result = cls.analyze_avoid_common_change_position(
                    transaction=transaction_details
                )
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_DO_NOT_SPEND_UTXOS:
                result = cls.analyze_no_do_not_spend_utxos(
                    transaction=transaction)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_KYCED_UTXOS:
                result = cls.analyze_no_kyced_inputs(transaction=transaction)
                results[privacy_metric] = result

            # TODO
            # elif privacy_metric == PrivacyMetricName.NO_POST_MIX_CHANGE:
            #     result = cls.analyze_no_post_mix_change(txid)
            #     results[privacy_metric] = result
            #
            # elif privacy_metric == PrivacyMetricName.SEGREGATE_POSTMIX_AND_NONMIX:
            #     result = cls.analyze_segregate_postmix_and_nonmix(txid)
            #     results[privacy_metric] = result

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
    def analyze_significantly_minimal_wealth_reveal(
        cls,
        transaction: Optional[TransactionModel],
    ) -> bool:
        """Check how much unnecessary wealth the user revealed to the receiver
        in this transaction.

        This is equivilent to how big the dollar bill you used to pay for
        something was. If you paid for a 5 cent candy with a 100 dollar bill
        you significantly revealed that you have a lot more wealth than that
        5 cents. If you paid for a $98 dollar purchase with a 100 dollar bill
        though this would only reveal $2 of wealth, which isn't crazy to the
        relatively large purchase that was made.

        This metric will be based off of how big the "spend" was compared to
        how big (in terms of sats) the UTXO inputs were.
        If the user reveals 1x the amount paid for an amount of 1 bitcoin or more
        then this metric fails.
        If the user reveals 5x the amount paid for an amount of 0.1 bitcoin or more
        then this metric fails.
        If the user reveals 10x the amount paid for an amount of 0.01 bitcoin or more
        then this metric fails.


        We are scaling it and not using a fixed ratio because
        if you make a small purchase, 2x that purchase isn't much, but you probably
        don't want to reveal 10x that purchase amount. If you make a large buy
        though revealing 1x or 2x that amount would reveal a significant amount.


        """
        if transaction is None:
            return False

        if cls.analyze_no_change(transaction):
            # if there is no change then the user didn't reveal any wealth
            return True

        amount_sent = transaction.sent_amount
        amount_sent_to_others = amount_sent - transaction.received_amount

        if amount_sent_to_others == 0:
            # if it all went back to the user then
            # this is not a typical simple spent tx therefore
            # this metric passes
            return True
        ratio_threshold = cls.get_ratio_threshold(amount_sent_to_others)
        acceptable_amount_to_reveal_threshold = amount_sent_to_others * ratio_threshold

        if transaction.received_amount >= acceptable_amount_to_reveal_threshold:
            return False
        else:
            return True

    @classmethod
    def get_ratio_threshold(cls, amount_sent_to_others) -> int:
        # if amount needed to reveal is 1 or > then if wealth reveal is 1x then this metric fails
        # if amount needed to reveal is .1 then if wealth reveal is 5x then this metric fails
        # if amount needed to reveal is .01 or less then if wealth reveal is 10x then this metric fails

        # Iterate through the thresholds in descending order (from highest to lowest)
        ratio_thresholds_by_amount = {100000000: 1, 10000000: 5, 1000000: 10}
        for threshold, ratio in sorted(
            ratio_thresholds_by_amount.items(), reverse=True
        ):
            if amount_sent_to_others >= threshold:
                return ratio  # Return the corresponding ratio if the threshold is met

        # If amount_sent_to_others is smaller than the smallest threshold, return the smallest ratio
        return ratio_thresholds_by_amount[min(ratio_thresholds_by_amount)]

    @classmethod
    def analyze_minimal_tx_history_reveal(
        cls, transaction_details: Optional[TransactionModel]
    ) -> bool:
        """Analyze if the user could have used less outputs from the
        outputs in there wallet at the time of the tx, to cover the
        amount(not including change) needed to send in the transaction.
        aka revealing less of their tx history to the blockchain."""
        if transaction_details is None:
            return False

        # how many inputs did the user include in this tx?
        outputs_used_by_user_in_tx = WalletService.get_transaction_inputs_from_db(
            transaction_details.txid
        )
        output_used_by_user_count = len(outputs_used_by_user_in_tx)
        if output_used_by_user_count == 1:
            # if the user only used one output then this metric passes
            # because the user used the minimum amount of outputs possible
            return True

        unspent_outputs_before_this_tx = (
            WalletService.get_all_unspent_outputs_from_db_before_blockheight(
                transaction_details.confirmed_block_height
            )
        )
        unspent_outputs_biggest_first = sorted(
            unspent_outputs_before_this_tx, key=lambda x: x.value, reverse=True
        )

        total_input_value_needed = (
            transaction_details.sent_amount - transaction_details.received_amount
        )

        # if we can get the total_input_value_needed with less outputs than the user used
        # then this metric fails
        current_total_value_included = 0
        current_total_utxos_included = 0
        for output in unspent_outputs_biggest_first:
            current_total_value_included += output.value
            current_total_utxos_included += 1
            if current_total_utxos_included >= output_used_by_user_count:
                # we have not been able to use less utxos to get the same value
                # therefore the minimum tx history reveal metric passes
                return True
            else:
                if current_total_value_included >= total_input_value_needed:
                    # the user could have used less outputs to get the same value
                    # therefore this metric fails
                    return False
                else:
                    # we haven't tried more outputs than the user used yet
                    # and we haven't reached the total_input_value_needed yet
                    # therefore continue to the next output
                    continue

        # this shouldn't be possible to reach
        # but if it does return True since we couldn't make a tx with less utxos
        return True

    # # TODO this is a difficult metric, do this is a v2
    # @classmethod
    # def analyze_timing_analysis(cls, txid: str) -> bool:
    #     # is same day tx is always done
    #     # is morning, afternoon or night always done.
    #     # aka always done in the same few hours
    #     return True
    #

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
    def analyze_no_unnecessary_input(
        cls, transaction_details: Optional[TransactionModel]
    ) -> bool:
        """Analyze if the user included more inputs (from the inputs used)
        than needed to cover the amount.

        If a subset of the inputs that the user used in this tx could have
        covered the amount needed to send (not included the change) then this metric fails.
        """

        if transaction_details is None:
            return False

        total_input_value_needed = (
            transaction_details.sent_amount - transaction_details.received_amount
        )

        current_amount = 0
        current_inputs_used = 0

        inputs_used_in_tx = WalletService.get_transaction_inputs_from_db(
            transaction_details.txid
        )
        inputs_used_in_tx_ordered_by_biggest_first = sorted(  # type: ignore
            inputs_used_in_tx, key=lambda x: x.value, reverse=True
        )
        inputs_used_in_tx_count = len(inputs_used_in_tx)

        for input in inputs_used_in_tx_ordered_by_biggest_first:
            current_amount += input.value
            current_inputs_used += 1
            if current_amount >= total_input_value_needed:
                # we have enough inputs to cover the amount needed
                # and we did it using the biggest inputs first
                if current_inputs_used < inputs_used_in_tx_count:
                    # there are still inputs left over
                    # therefore some were not needed
                    # therefore this metric fails
                    return False
                else:
                    # we did not use less inputs
                    # therefore they were all neccessary
                    # therefore this metric passes
                    return True

        # this should not be possible to reach since the outputs
        # should always be able to cover the amount sent
        return True

    @classmethod
    def analyze_use_multi_change_outputs(
        cls,
        transaction_details: Optional[TransactionModel],
    ) -> bool:
        """Check that the transaction the user made includes more than one 'change' output
        to the user.

        If there is no change outputs to the user this metric passes because it does not
        actually leak privacy since there is not one easily traceable change output.
        If the user has only one change output this metric fails.
        If the user has more than one output this metric passes.

        """
        if transaction_details is None:
            return False

        total_change = (
            transaction_details.sent_amount - transaction_details.received_amount
        )

        if total_change == 0:
            # the user did not receive any change, therefore
            # this metric doesn't really apply
            # so just return that the metric passes
            return True

        # now get how many outputs the user has in this tx
        users_outputs = WalletService.get_transaction_outputs_from_db(
            transaction_details.txid
        )
        if len(users_outputs) == 1:
            # there is only one change output for this user
            # therefore this metric fails
            return False
        else:
            # the user has more than one change output in the tx
            # therefore this metric passes
            return True

    @classmethod
    def analyze_avoid_common_change_position(
        cls, transaction: Optional[TransactionModel]
    ) -> bool:
        """Check that the user is not sending funds to a change output that is
        an exteremly common position for them.


        If this transaction that the user is sending funds in has
        a change output with the same vout (aka position) as 80% or more of their
        other change outputs then this metric fails.

        If the user has less than 8 change outputs then this metric passes
        since it is not statistically relevant enough to fail this metric.
        """
        if transaction is None:
            return False

        change_output: Optional[OutputModel] = None
        for output in transaction.outputs:
            if output.is_simple_change:
                change_output = output
                # there should only ever be
                # one simple change output in a tx
                # therefore if we found one break the loop
                break

        if change_output is None:
            # there is no change output in this transaction
            # therefore this metric passes
            return True

        change_output_position = change_output.vout
        all_change_outputs_count: int = WalletService.get_all_change_outputs_from_db(
            None, "count"
        )

        # this metric is only statistically relevant if the user has at least 8 change outputs
        if all_change_outputs_count < 8:
            # not statistically relevant enough to fail this metric
            return True

        only_this_vout_change_outputs_count: int = (
            WalletService.get_all_change_outputs_from_db(
                change_output_position, "count"
            )
        )

        percent_this_vout_is_change_position = (
            only_this_vout_change_outputs_count / all_change_outputs_count
        )

        if percent_this_vout_is_change_position >= 0.80:
            return False
        else:
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

    # TODO
    # @classmethod
    # def analyze_no_post_mix_change(cls, txid: str) -> bool:
    #     return True
    #
    # @classmethod
    # def analyze_segregate_postmix_and_nonmix(cls, txid: str) -> bool:
    #     return True

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
