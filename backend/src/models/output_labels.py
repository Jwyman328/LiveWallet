# from sqlalchemy import Table, ForeignKey, Integer
#
# from src.database import DB
#
#
# class OutputLabel(DB.Model):
#     __tablename__ = "output_labels"
#     id = DB.Column(Integer, primary_key=True)
#     output_id = DB.Column(
#         "output_id", DB.String, ForeignKey("outputs.id"), primary_key=True
#     )
#     label_id = DB.Column(
#         "label_id", DB.String, ForeignKey("labels.id"), primary_key=True
#     )


from sqlalchemy import Table, Column, String, ForeignKey
from src.database import DB

output_labels = Table(
    "output_labels",
    DB.Model.metadata,
    Column("output_id", String, ForeignKey("outputs.id"), primary_key=True),
    Column("label_id", String, ForeignKey("labels.id"), primary_key=True),
)
