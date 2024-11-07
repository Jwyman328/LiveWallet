from sqlalchemy import Enum, Integer
from enum import Enum as PyEnum


from src.database import DB


class LastFetchedType(PyEnum):
    OUTPUTS = "outputs"
    TRANSACTIONS = "transactions"


class LastFetched(DB.Model):
    __tablename__ = "last_fetched"

    id = DB.Column(Integer, primary_key=True, autoincrement=True)
    type = DB.Column(Enum(LastFetchedType), unique=True, nullable=False)
    timestamp = DB.Column(DB.DateTime, nullable=False, default=None)
