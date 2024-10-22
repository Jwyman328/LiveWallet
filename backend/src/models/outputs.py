from sqlalchemy import Integer
from src.database import DB
import uuid
from .output_labels import output_labels


class Output(DB.Model):
    __tablename__ = "outputs"  # Specify the table name

    # Auto-incrementing integer
    id = DB.Column(Integer, primary_key=True, autoincrement=True)

    txid = DB.Column(
        DB.String(),
        nullable=False,
    )
    vout = DB.Column(DB.Integer, nullable=False, default=0)

    # Relationship to labels
    labels = DB.relationship("Label", secondary=output_labels, back_populates="outputs")

    # Unique constraint on the combination of txid and vout
    __table_args__ = (DB.UniqueConstraint("txid", "vout", name="uq_txid_vout"),)
