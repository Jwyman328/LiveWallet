import bdkpython as bdk
from dataclasses import dataclass
from typing import Optional


@dataclass
class WalletDetails:
    descriptor: Optional[str]
    network: bdk.Network
    electrum_url: str
