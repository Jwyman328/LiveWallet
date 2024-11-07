from sqlalchemy import String, Integer


from src.database import DB


class Transaction(DB.Model):
    __tablename__ = "transactions"

    id = DB.Column(Integer, primary_key=True, autoincrement=True)
    txid = DB.Column(String, unique=True, nullable=False)
    received_amount = DB.Column(Integer, nullable=False)
    sent_amount = DB.Column(Integer, nullable=False)
    fee = DB.Column(Integer, nullable=False)

    # at some point I will need an output relationship
    # prob just need it on the output
    # outputs = DB.relationship(
    #     "Output", secondary=output_labels, back_populates="transactions"
    # )
