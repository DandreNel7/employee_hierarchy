from fastapi.testclient import TestClient

from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


def test_login_sets_a_session_cookie(client: TestClient, admin) -> None:
    response = client.post(
        "/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )

    assert response.status_code == 200
    assert response.json() == {"id": admin.id, "email": ADMIN_EMAIL}
    cookie = response.headers["set-cookie"]
    assert "session=" in cookie
    assert "HttpOnly" in cookie


def test_wrong_password_is_rejected(client: TestClient, admin) -> None:
    response = client.post(
        "/api/auth/login", json={"email": ADMIN_EMAIL, "password": "not-the-password"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_unknown_email_gives_the_same_message(client: TestClient, admin) -> None:
    """The message must not reveal which email addresses exist."""
    response = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": ADMIN_PASSWORD}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_employees_need_a_signed_in_user(client: TestClient) -> None:
    assert client.get("/api/employees").status_code == 401


def test_logout_clears_the_session(signed_in: TestClient) -> None:
    assert signed_in.get("/api/employees").status_code == 200

    signed_in.post("/api/auth/logout")

    assert signed_in.get("/api/employees").status_code == 401


def test_repeated_failed_logins_are_blocked(client: TestClient, admin, rate_limited) -> None:
    """Five attempts a minute, so a password cannot be guessed at speed."""
    for _ in range(5):
        client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})

    response = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})

    assert response.status_code == 429
