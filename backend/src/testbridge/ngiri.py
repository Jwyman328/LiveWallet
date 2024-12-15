import aiohttp
from dataclasses import dataclass, asdict
import structlog
import asyncio
import random

from time import sleep

LOGGER = structlog.get_logger()


async def gather_multiple_requests(requests):
    return await asyncio.gather(*requests)


@dataclass
class FundWalletRequestBody:
    address: str
    amount: float


async def fund_wallet(address: str, amount: float):
    """Generate a transaction to a specified address with a specified amount.
    Use the ngiri faucet endpoint to fund the wallet.
    https://github.com/vulpemventures/nigiri?tab=readme-ov-file#bitcoin--liquid
    """
    try:
        url = "http://localhost:3000/faucet"
        data = FundWalletRequestBody(address, amount)
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=asdict(data)) as response:
                response = await response.text()
                return response
    except Exception as e:
        LOGGER.error("Failed to fund wallet", address=address, amount=amount, error=e)


async def fund_wallet_with_multiple_txs(
    address: str, amount: float, transaction_count: int
):
    """Generate multiple transactions to a specified address with the same amount"""
    tasks = [fund_wallet(address, amount) for tx in range(transaction_count)]
    return await asyncio.gather(*tasks)


def randomly_fund_mock_wallet(
    address: str,
    amount_min: float,
    amount_max: float,
    transaction_count: int,
):
    """Generate transactions inside a min and max btc amount to a specified address"""
    LOGGER.info(
        f"Funding wallet address: {address},with {transaction_count} randomly generated transactions between min amount: {amount_min}, max amount: {amount_max}, "
    )
    requests = []
    for _ in range(transaction_count):
        random_number = round(random.uniform(amount_min, amount_max), 8)

        LOGGER.info(f"Creating request for {random_number} btc")
        requests.append(fund_wallet(address, random_number))

    responses = asyncio.run(gather_multiple_requests(requests))

    for response in responses:
        LOGGER.info(f"Fund wallet response: {response}")


def mine_a_block_to_miner():
    mock_miner_mock_address = "n4qq7z7NUXeDW2hjJ4WzwCu8KqVmCXMNEg"
    asyncio.run(fund_wallet(mock_miner_mock_address, 0.0001))
    # brief sleep to allow the block to be mined
    sleep(2)
