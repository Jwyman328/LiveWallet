from typing import Optional, Type
from bdkpython import bdk
from src.database import DB


class Wallet(DB.Model):
    id = DB.Column(DB.Integer, primary_key=True, autoincrement=True)

    descriptor = DB.Column(DB.String(255), nullable=True, default=None)
    network = DB.Column(DB.Integer, nullable=True,
                        default=bdk.Network.REGTEST.value)
    electrum_url = DB.Column(
        DB.String(255), nullable=True, default="127.0.0.1:50000")

    @classmethod
    def get_current_wallet(cls) -> Optional[Type["Wallet"]]:
        wallet = cls.query.first()
        return wallet
