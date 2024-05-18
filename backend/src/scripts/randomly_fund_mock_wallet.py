import click
from src.testbridge.ngiri import randomly_fund_mock_wallet


@click.command()
@click.option(
    "--address",
    default="bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s",
    help="Address of receiving wallet",
)
@click.option(
    "--amount_max",
    default=0.000000500,
    help="Upper range to randomly create a btc amount for a transaction",
)
@click.option(
    "--amount_min",
    default=1.000000000,
    help="Lower range to randomly create a btc amount for a transaction",
)
@click.option(
    "--transaction_count",
    default=1,
    help="Number of transactions to create.",
)
def randomly_fund_mock_wallet_through_script(
    address: str, amount_min: float, amount_max: float, transaction_count: int
):
    randomly_fund_mock_wallet(address, amount_min, amount_max, transaction_count)


if __name__ == "__main__":
    randomly_fund_mock_wallet_through_script()
