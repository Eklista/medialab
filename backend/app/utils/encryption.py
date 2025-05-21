# app/utils/encryption.py
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config.settings import SECRET_KEY

def get_encryption_key():
    """
    Genera una clave Fernet derivada del SECRET_KEY
    """
    salt = b'medialab_salt'  # Un salt fijo para nuestro propósito
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(SECRET_KEY.encode()))
    return key

def encrypt_value(value: str) -> str:
    """
    Encripta un valor utilizando Fernet
    """
    if not value:
        return ""
        
    key = get_encryption_key()
    f = Fernet(key)
    token = f.encrypt(value.encode())
    return token.decode()

def decrypt_value(encrypted_value: str) -> str:
    """
    Desencripta un valor utilizando Fernet
    """
    if not encrypted_value:
        return ""
        
    key = get_encryption_key()
    f = Fernet(key)
    try:
        value = f.decrypt(encrypted_value.encode())
        return value.decode()
    except Exception:
        return ""