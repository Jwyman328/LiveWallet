from dataclasses import dataclass
import requests
import structlog

LOGGER = structlog.get_logger()


@dataclass
class FeeEstimates:
    low: int
    medium: int
    high: int


def get_fees() -> FeeEstimates:
    """Make an api request for the current fee rates."""
    url = "https://mempool.space/api/v1/fees/recommended"

    try:
        LOGGER.info("making request to get fees", url=url)
        response = requests.get(url)
        LOGGER.info(
            "get fees response",
            url=url,
            status_code=response.status_code,
            data=response.json(),
        )

        if response.status_code == 200:
            data = response.json()
            high = data.get("fastestFee", 1)
            medium = data.get("halfHourFee", 1)
            low = data.get("hourFee", 1)
            # Process the data as needed
            return FeeEstimates(low=low, medium=medium, high=high)
        else:
            LOGGER.error("Error getting fees from", url=url)
            raise Exception("error")

    except Exception as e:
        LOGGER.error("Error getting current fees", error=e)
        raise Exception("making request to get fees failed")
