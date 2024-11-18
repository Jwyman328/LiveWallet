from sqlalchemy import String, Integer


from src.database import DB
from src.models.outputs import Output


class Transaction(DB.Model):
    __tablename__ = "transactions"

    id = DB.Column(Integer, primary_key=True, autoincrement=True)
    txid = DB.Column(String, unique=True, nullable=False)
    received_amount = DB.Column(Integer, nullable=False)
    sent_amount = DB.Column(Integer, nullable=False)
    fee = DB.Column(Integer, nullable=False)
    confirmed_block_height = DB.Column(Integer, nullable=True)

    # Relationship to Output (outputs created by this transaction)
    outputs = DB.relationship(
        "Output",
        back_populates="transaction",
        # Explicitly reference the 'txid' column in Output
        foreign_keys=[Output.txid],
    )

    # Relationship to Input (inputs spent by this transaction)
    inputs = DB.relationship(
        "Output",
        back_populates="spent_transaction",
        foreign_keys=[
            Output.spent_txid
        ],  # Explicitly reference the 'spent_txid' column in Output
    )
