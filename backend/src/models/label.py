from sqlalchemy import String, Enum, Integer
from enum import Enum as PyEnum
from .output_labels import output_labels


from src.database import DB


class LabelName(PyEnum):
    DO_NOT_SPEND = "do not spend"
    KYCED = "kyced"
    # Add more labels as needed


label_descriptions = {
    LabelName.DO_NOT_SPEND: "This output should not be spent. This can be helpful for outputs that may comprimise your privacy, like KYCED outputs, or toxic change from a coinjoin.",
    LabelName.KYCED: "KYC, also known as Know Your Customer, is the process of verifying the identity of customers. This output has been KYCed, which means it is attached to your name, and therefore you should be careful when spending it as it may be being monitoring.",
}


class Label(DB.Model):
    __tablename__ = "labels"  # Specify the table name

    id = DB.Column(Integer, primary_key=True, autoincrement=True)
    name = DB.Column(Enum(LabelName), unique=True, nullable=False)
    display_name = DB.Column(String, unique=True, nullable=False)
    description = DB.Column(String, unique=True, nullable=False)

    outputs = DB.relationship(
        "Output", secondary=output_labels, back_populates="labels"
    )
