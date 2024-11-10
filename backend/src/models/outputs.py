from sqlalchemy import Integer
from src.database import DB
import uuid
from .output_labels import output_labels


class Output(DB.Model):
    __tablename__ = "outputs"  # Specify the table name

    # Auto-incrementing integer
    id = DB.Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to the 'Transaction' model (creating transaction)
    txid = DB.Column(DB.String(), DB.ForeignKey(
        "transactions.txid"), nullable=False)

    # Relationship to the 'Transaction' model for the creating transaction
    transaction = DB.relationship(
        "Transaction",
        back_populates="outputs",
        # Explicitly tell SQLAlchemy which foreign key to use
        foreign_keys=[txid],
    )

    # Foreign key to the 'Transaction' model (spending transaction)
    spent_txid = DB.Column(
        DB.String(), DB.ForeignKey("transactions.txid"), nullable=True
    )

    # Relationship to the 'Transaction' model for the spending transaction
    spent_transaction = DB.relationship(
        "Transaction",
        back_populates="inputs",
        foreign_keys=[
            spent_txid
        ],  # Explicitly tell SQLAlchemy which foreign key to use
    )
    vout = DB.Column(DB.Integer, nullable=False, default=0)

    address = DB.Column(DB.String(), nullable=False)

    # nullable to make populating outputs from output label population easier
    value = DB.Column(DB.Integer, nullable=True)  # in sats

    # Relationship to labels
    labels = DB.relationship(
        "Label", secondary=output_labels, back_populates="outputs")

    # Unique constraint on the combination of txid and vout
    __table_args__ = (DB.UniqueConstraint(
        "txid", "vout", name="uq_txid_vout"),)
