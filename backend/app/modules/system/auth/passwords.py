import hashlib
import hmac


def hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return digest.hex()


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    actual_hash = hash_password(password=password, salt=salt)
    return hmac.compare_digest(actual_hash, expected_hash)
