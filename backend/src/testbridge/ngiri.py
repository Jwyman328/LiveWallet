import aiohttp
from dataclasses import dataclass, asdict
import structlog
import asyncio


LOGGER = structlog.get_logger()


@dataclass
class FundWalletRequestBody:
    address: str
    amount: float


async def fund_wallet(address: str, amount: float):
    try:
        url = "http://localhost:3000/faucet"
        data = FundWalletRequestBody(address, amount)
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=asdict(data)) as response:
                return await response.text()
    except Exception as e:
        LOGGER.error("Failed to fund wallet",
                     address=address, amount=amount, error=e)


async def fund_wallet_with_multiple_txs(
    address: str, amount: float, transaction_count: int
):
    tasks = [fund_wallet(address, amount) for tx in range(transaction_count)]
    return await asyncio.gather(*tasks)
