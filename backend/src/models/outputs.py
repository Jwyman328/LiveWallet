from sqlalchemy import Integer
from src.database import DB
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

    @property
    def is_simple_change(self) -> bool:
        """Check if the output is a simple change output


        # If the transaction it was created in the user has included inputs and also outputs
        # it is change but only
        # if it does not have more than one output though
        # since that means it is a more complex transaction, not just simple change.
        """
        is_there_change = (
            self.transaction.sent_amount > 0 and self.transaction.received_amount > 0
        )
        # if the user only has one output in the tx it has an input in
        # then consider it change
        is_simple_change = is_there_change and len(
            self.transaction.outputs) == 1
        return is_simple_change

    # Unique constraint on the combination of txid and vout
    __table_args__ = (DB.UniqueConstraint(
        "txid", "vout", name="uq_txid_vout"),)
