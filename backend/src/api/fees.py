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
    # Define the API endpoint URL
    # TODO make this some type of env variable
    url = "http://localhost:3000/fee-estimates"

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
            # TODO figure out how to fill the nigiri memool so that there is a fee market
            # todo also add better logging everywhere
            # todo add tests
            data = response.json()
            # get in next block
            high = data.get("1", 1)
            # get in block in 2 hours
            medium = data.get("12", 1)
            # get in block in 24 hours
            low = data.get("144", 1)
            # Process the data as needed
            # todo use real data not mock data
            return FeeEstimates(low=low, medium=medium, high=high)
        else:
            LOGGER.error("Error getting fees from", url=url)
            raise Exception("error")

    except Exception as e:
        LOGGER.error("Error getting current fees", error=e)
        raise Exception("making request to get fees failed")
