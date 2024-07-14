from src.database import DB
import uuid


class HardwareWallet(DB.Model):
    id = DB.Column(DB.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    path = DB.Column(DB.String, nullable=True, default=None)
    type = DB.Column(DB.String, nullable=True, default=None)
    label = DB.Column(DB.String, nullable=True, default=None)
    model = DB.Column(DB.String, nullable=True, default=None)
    needs_pin_sent = DB.Column(DB.Boolean, nullable=False, default=False)
    needs_passphrase_sent = DB.Column(DB.Boolean, nullable=False, default=False)
    fingerprint = DB.Column(DB.String, nullable=True, default=None)
