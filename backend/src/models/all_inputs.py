from sqlalchemy import Integer
from src.database import DB


class AllInput(DB.Model):
    """Input for all inputs of related transactions, even if it is not the users input"""

    __tablename__ = "all_inputs"  # Specify the table name

    # Auto-incrementing integer
    id = DB.Column(Integer, primary_key=True, autoincrement=True)

    txid = DB.Column(DB.String(), nullable=False)

    vout = DB.Column(DB.Integer, nullable=False, default=0)

    address = DB.Column(DB.String(), nullable=False)

    value = DB.Column(DB.Integer, nullable=True)  # in sats
