import bdkpython as bdk
from dataclasses import dataclass
from typing import Optional


@dataclass
class WalletDetails:
    descriptor: Optional[str]
    network: Optional[bdk.Network]
    electrum_url: Optional[str]


@dataclass
class FeeDetails:
    percent_fee_is_of_utxo: float
    fee: int  # in sats
