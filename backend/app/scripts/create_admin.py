"""Create an admin account. Run with: uv run python -m app.scripts.create_admin"""

import getpass
import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User
from app.security import hash_password

MIN_PASSWORD_LENGTH = 8


def main() -> None:
    email = input("Email: ").strip().lower()
    password = getpass.getpass("Password: ")
    if password != getpass.getpass("Confirm password: "):
        sys.exit("The passwords do not match.")
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.exit(f"The password must be at least {MIN_PASSWORD_LENGTH} characters.")

    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)):
            sys.exit("That email already has an account.")
        db.add(User(email=email, password_hash=hash_password(password)))
        db.commit()

    print(f"Created admin account for {email}")


if __name__ == "__main__":
    main()
