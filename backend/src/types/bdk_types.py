from dataclasses import dataclass
from typing import Optional


@dataclass
class TxOutType:
    value: int
    script_pubkey: str


@dataclass
class OutpointType:
    txid: str
    vout: int


@dataclass
class TransactionDetailsType:
    # TODO this should be optional Transaction
    # but I do not have Transaction type defined yet
    transaction: Optional[str]
    txid: str
    received: int
    sent: int
    fee: Optional[int]
    # TODO this should be optional BlockTime but
    # I have not created a Blocktime type yet
    confirmation_time: Optional[str]


@dataclass
class LocalUtxoType:
    outpoint: OutpointType
    txout: TxOutType
    # TODO this should be KeychainKind type but just using str for now
    keychain: str
    is_spent: bool


@dataclass
class TxBuilderResultType:
    psbt: str
    transaction_details: TransactionDetailsType


@dataclass
class FeeDetails:
    percent_fee_is_of_utxo: float
    fee: int  # in sats
