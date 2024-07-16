from cryptography.fernet import Fernet


def encrypt(data: bytes | str, cipher_suite: Fernet):
    """Encrypt the given data."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    encrypted_data = cipher_suite.encrypt(data)
    return encrypted_data


def decrypt(encrypted_data: bytes | str, cipher_suite: Fernet):
    """Decrypt the given data."""
    decrypted_data = cipher_suite.decrypt(encrypted_data)
    return decrypted_data.decode("utf-8")
