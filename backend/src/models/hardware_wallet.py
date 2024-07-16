from cryptography.fernet import Fernet
from src.database import DB
import uuid
from src.encryption.utils import encrypt, decrypt


class HardwareWallet(DB.Model):
    id = DB.Column(DB.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    path = DB.Column(DB.String, nullable=True, default=None)
    type = DB.Column(DB.String, nullable=True, default=None)
    label = DB.Column(DB.String, nullable=True, default=None)
    model = DB.Column(DB.String, nullable=True, default=None)
    needs_pin_sent = DB.Column(DB.Boolean, nullable=False, default=False)
    needs_passphrase_sent = DB.Column(DB.Boolean, nullable=False, default=False)
    fingerprint = DB.Column(DB.String, nullable=True, default=None)
    encrypted_passphrase = DB.Column(DB.String, nullable=True, default=None)

    def get_decrypted_passphrase(self, cipher_suite: Fernet):
        """Decrypt email on access."""
        return decrypt(self.encrypted_passphrase, cipher_suite)

    def set_encrypted_passphrase(self, value: bytes | str, cipher_suite: Fernet):
        """Encrypt email on setting."""
        self.encrypted_passphrase = encrypt(value, cipher_suite)
