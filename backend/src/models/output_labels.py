from sqlalchemy import Table, Column, String, ForeignKey
from src.database import DB

output_labels = Table(
    "output_labels",
    DB.Model.metadata,
    Column("output_id", String, ForeignKey("outputs.id"), primary_key=True),
    Column("label_id", String, ForeignKey("labels.id"), primary_key=True),
)
