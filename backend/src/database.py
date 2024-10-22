from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


DB = SQLAlchemy()


def populate_labels():
    try:
        from src.models.label import Label, LabelName, label_descriptions

        for label_name in LabelName:
            # Check if the label already exists
            existing_label = DB.session.query(Label).filter_by(name=label_name).first()

            # If it does not exist, create a new one
            if not existing_label:
                label = Label(
                    name=label_name,
                    display_name=label_name.value,
                    description=label_descriptions[label_name],
                )
                DB.session.add(label)

        # Commit the session only once after all additions
        DB.session.commit()
    except Exception as e:
        DB.session.rollback()
        raise e
