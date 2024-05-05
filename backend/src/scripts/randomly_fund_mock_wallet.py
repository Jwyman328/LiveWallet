import click
import random
import asyncio
from src.testbridge.ngiri import fund_wallet


async def gather_multiple_requests(requests):
    return await asyncio.gather(*requests)


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
def randomly_fund_mock_wallet(
    address: str, amount_min: float, amount_max: float, transaction_count: int
):
    click.echo(
        f"Funding wallet address: {address},with{transaction_count} randomly generated transactions between min amount: {amount_min}, max amount: {amount_max}, "
    )
    requests = []
    for _ in range(transaction_count):
        random_number = round(random.uniform(amount_min, amount_max), 8)

        click.echo(f"Creating request for {random_number} btc")
        requests.append(fund_wallet(address, random_number))

    responses = asyncio.run(gather_multiple_requests(requests))

    for response in responses:
        click.echo(f"Fund wallet response: {response}")


if __name__ == "__main__":
    randomly_fund_mock_wallet()
