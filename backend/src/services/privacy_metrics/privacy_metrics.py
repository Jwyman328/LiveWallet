from src.database import DB
from src.models.privacy_metric import PrivacyMetric, PrivacyMetricName


class PrivacyMetricsService:
    @classmethod
    def get_all_privacy_metrics(cls) -> list[PrivacyMetric]:
        all_metrics = DB.session.query(PrivacyMetric).all()
        return all_metrics

    @classmethod
    def analyze_tx_privacy(
        cls, txid: str, privacy_metrics: list[PrivacyMetricName]
    ) -> dict[PrivacyMetricName, bool]:
        results: dict[PrivacyMetricName, bool] = dict()
        for privacy_metric in privacy_metrics:
            if privacy_metric == PrivacyMetricName.ANNOMINITY_SET:
                mock_set = 5
                result = cls.analyze_annominit_set(txid, mock_set)
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
                result = cls.analyze_no_change(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_SMALL_CHANGE:
                result = cls.analyze_no_small_change(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.NO_ROUND_NUMBER_PAYMENTS:
                result = cls.analyze_no_round_number_payments(txid)
                results[privacy_metric] = result

            elif privacy_metric == PrivacyMetricName.SAME_SCRIPT_TYPES:
                result = cls.analyze_same_script_types(txid)
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
    def analyze_annominit_set(cls, txid: str, desired_annominity_set: int) -> bool:
        return True

    @classmethod
    def analyze_no_address_reuse(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_minimal_wealth_reveal(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_minimal_tx_history_reveal(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_timing_analysis(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_change(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_small_change(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_no_round_number_payments(cls, txid: str) -> bool:
        return True

    @classmethod
    def analyze_same_script_types(cls, txid: str) -> bool:
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
