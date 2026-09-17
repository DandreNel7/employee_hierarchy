import hashlib


def gravatar_url(email: str, size: int = 200) -> str:
    """Gravatar looks the person up by a hash of their email address."""
    digest = hashlib.sha256(email.strip().lower().encode()).hexdigest()
    return f"https://gravatar.com/avatar/{digest}?s={size}&d=identicon"
