from src.database import DB
from src.models.privacy_metric import PrivacyMetric


class PrivacyMetricsService:
    @classmethod
    def get_all_privacy_metrics(self) -> list[PrivacyMetric]:
        all_metrics = DB.session.query(PrivacyMetric).all()
        return all_metrics

    @classmethod
    def analyze_tx_privacy(self, txid: str, privacy_metrics: list[str]) -> str:
        return "TODO"
