from src.models.last_fetched import LastFetched, LastFetchedType
from datetime import datetime
from src.database import DB
from typing import Optional

import structlog

LOGGER = structlog.get_logger()


class LastFetchedService:
    @classmethod
    def update_last_fetched_outputs_type(
        self,
    ) -> None:
        """Update the last fetched time for the outputs."""
        timestamp = datetime.now()
        current_last_fetched_output = LastFetched.query.filter_by(
            type=LastFetchedType.OUTPUTS
        ).first()
        if current_last_fetched_output:
            current_last_fetched_output.timestamp = timestamp
        else:
            last_fetched_output = LastFetched(
                type=LastFetchedType.OUTPUTS, timestamp=timestamp
            )
            DB.session.add(last_fetched_output)
        DB.session.commit()

    @classmethod
    def get_last_fetched_output_datetime(
        self,
    ) -> Optional[datetime]:
        """Get the last fetched time for the outputs."""
        last_fetched_output = LastFetched.query.filter_by(
            type=LastFetchedType.OUTPUTS
        ).first()
        if last_fetched_output:
            return last_fetched_output.timestamp
        return None

    @classmethod
    def update_last_fetched_transaction_type(
        self,
    ) -> None:
        """Update the last fetched time for the transactions."""
        timestamp = datetime.now()
        current_last_fetched_output = LastFetched.query.filter_by(
            type=LastFetchedType.TRANSACTIONS
        ).first()
        if current_last_fetched_output:
            current_last_fetched_output.timestamp = timestamp
        else:
            last_fetched_output = LastFetched(
                type=LastFetchedType.TRANSACTIONS, timestamp=timestamp
            )
            DB.session.add(last_fetched_output)
        DB.session.commit()

    @classmethod
    def get_last_fetched_transaction_datetime(
        self,
    ) -> Optional[datetime]:
        """Get the last fetched time for the transactions."""
        last_fetched_output = LastFetched.query.filter_by(
            type=LastFetchedType.TRANSACTIONS
        ).first()
        if last_fetched_output:
            return last_fetched_output.timestamp
        return None
