import click
import asyncio

from src.testbridge.ngiri import fund_wallet_with_multiple_txs


@click.command()
@click.option(
    "--address",
    default="bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s",
    help="Address of receiving wallet",
)
@click.option(
    "--amount",
    default=1.000000000,
    help="Bitcoin amount to send",
)
@click.option(
    "--transaction_count",
    default=1,
    help="Number of transactions of this amount to this address to create.",
)
def fund_mock_wallet(address: str, amount: float, transaction_count: int):
    click.echo(
        f"Funding mock wallet with {transaction_count} transactions of address: {address} amount: {amount}",
    )
    responses = asyncio.run(
        fund_wallet_with_multiple_txs(address, amount, transaction_count)
    )

    for response in responses:
        click.echo(f"Fund wallet response: {response}")


if __name__ == "__main__":
    fund_mock_wallet()
