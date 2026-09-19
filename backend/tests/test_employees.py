from fastapi.testclient import TestClient

from tests.conftest import make_employee


def test_employee_numbers_are_generated(signed_in: TestClient) -> None:
    first = make_employee(signed_in)
    second = make_employee(signed_in, email="sipho@example.com")

    assert first["employee_number"] == "EMP-0001"
    assert second["employee_number"] == "EMP-0002"


def test_email_must_be_unique(signed_in: TestClient) -> None:
    make_employee(signed_in)

    response = signed_in.post(
        "/api/employees",
        json={
            "first_name": "Sipho",
            "last_name": "Dlamini",
            "email": "thandi@example.com",
            "birth_date": "1988-01-05",
            "salary": "500000",
            "role": "Business Analyst",
            "department_id": None,
            "manager_id": None,
        },
    )

    assert response.status_code == 400
    assert "already uses that email" in response.json()["detail"]


def test_an_employee_can_have_no_manager(signed_in: TestClient) -> None:
    """The top of the hierarchy, for example the CEO."""
    employee = make_employee(signed_in)

    assert employee["manager_id"] is None


def test_gravatar_url_is_built_from_the_email(signed_in: TestClient) -> None:
    employee = make_employee(signed_in)

    assert employee["avatar_url"].startswith("https://gravatar.com/avatar/")


def test_salary_cannot_be_negative(signed_in: TestClient) -> None:
    response = signed_in.post(
        "/api/employees",
        json={
            "first_name": "Sipho",
            "last_name": "Dlamini",
            "email": "sipho@example.com",
            "birth_date": "1988-01-05",
            "salary": "-100",
            "role": "Business Analyst",
            "department_id": None,
            "manager_id": None,
        },
    )

    assert response.status_code == 422


def test_an_employee_must_be_at_least_sixteen(signed_in: TestClient) -> None:
    response = signed_in.post(
        "/api/employees",
        json={
            "first_name": "Sipho",
            "last_name": "Dlamini",
            "email": "sipho@example.com",
            "birth_date": "2020-01-05",
            "salary": "500000",
            "role": "Intern",
            "department_id": None,
            "manager_id": None,
        },
    )

    assert response.status_code == 422
