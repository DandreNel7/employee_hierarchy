from collections.abc import Iterator

import pytest
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text

from alembic import command
from app.config import settings
from app.database import SessionLocal, engine
from app.main import app
from app.models import User
from app.rate_limit import limiter
from app.security import hash_password

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "test-password"

if not settings.database_url.endswith("_test"):
    raise SystemExit(
        "Tests must run against a database whose name ends in _test.\n"
        "Try: DATABASE_URL=postgresql+psycopg://employee:employee@localhost:5432/"
        "employee_hierarchy_test uv run pytest"
    )


@pytest.fixture(scope="session", autouse=True)
def schema() -> None:
    """Build the schema the same way the real deployment does."""
    command.upgrade(Config("alembic.ini"), "head")


@pytest.fixture(autouse=True)
def without_rate_limiting() -> Iterator[None]:
    """Every test signs in from the same address, which would trip the login limit."""
    limiter.enabled = False
    yield
    limiter.enabled = True
    limiter.reset()


@pytest.fixture
def rate_limited() -> Iterator[None]:
    """For the test that checks the limit actually works."""
    limiter.reset()
    limiter.enabled = True
    yield
    limiter.enabled = False
    limiter.reset()


@pytest.fixture(autouse=True)
def clean_tables() -> Iterator[None]:
    """Each test starts from an empty database."""
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE employees, departments, users RESTART IDENTITY CASCADE"))
        connection.execute(text("ALTER SEQUENCE employee_number_seq RESTART WITH 1"))
    yield


@pytest.fixture
def db() -> Iterator[SessionLocal]:
    with SessionLocal() as session:
        yield session


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin(db) -> User:
    user = User(email=ADMIN_EMAIL, password_hash=hash_password(ADMIN_PASSWORD))
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def signed_in(client: TestClient, admin: User) -> TestClient:
    """A client that already holds the session cookie."""
    response = client.post(
        "/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200
    return client


def make_employee(client: TestClient, **overrides) -> dict:
    payload = {
        "first_name": "Thandi",
        "last_name": "Mokoena",
        "email": "thandi@example.com",
        "birth_date": "1990-04-12",
        "salary": "650000",
        "role": "SAP Consultant",
        "department_id": None,
        "manager_id": None,
    }
    payload.update(overrides)
    response = client.post("/api/employees", json=payload)
    assert response.status_code == 201, response.text
    return response.json()
