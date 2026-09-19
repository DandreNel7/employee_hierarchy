from fastapi.testclient import TestClient

from tests.conftest import make_employee


def update(client: TestClient, employee: dict, **changes) -> dict:
    payload = {
        "first_name": employee["first_name"],
        "last_name": employee["last_name"],
        "email": employee["email"],
        "birth_date": employee["birth_date"],
        "salary": employee["salary"],
        "role": employee["role"],
        "department_id": None,
        "manager_id": employee["manager_id"],
    }
    payload.update(changes)
    return client.put(f"/api/employees/{employee['id']}", json=payload)


def test_an_employee_cannot_manage_themselves(signed_in: TestClient) -> None:
    employee = make_employee(signed_in)

    response = update(signed_in, employee, manager_id=employee["id"])

    assert response.status_code == 400
    assert "their own manager" in response.json()["detail"]


def test_a_manager_cannot_report_to_their_own_report(signed_in: TestClient) -> None:
    boss = make_employee(signed_in)
    report = make_employee(signed_in, email="sipho@example.com", manager_id=boss["id"])

    response = update(signed_in, boss, manager_id=report["id"])

    assert response.status_code == 400
    assert "cannot be the manager" in response.json()["detail"]


def test_a_loop_further_down_the_chain_is_rejected(signed_in: TestClient) -> None:
    top = make_employee(signed_in)
    middle = make_employee(signed_in, email="sipho@example.com", manager_id=top["id"])
    bottom = make_employee(signed_in, email="naledi@example.com", manager_id=middle["id"])

    response = update(signed_in, top, manager_id=bottom["id"])

    assert response.status_code == 400


def test_deleting_a_manager_moves_reports_to_the_top(signed_in: TestClient) -> None:
    boss = make_employee(signed_in)
    report = make_employee(signed_in, email="sipho@example.com", manager_id=boss["id"])

    assert signed_in.delete(f"/api/employees/{boss['id']}").status_code == 204

    moved = signed_in.get(f"/api/employees/{report['id']}").json()
    assert moved["manager_id"] is None


def test_deleting_a_manager_can_hand_the_team_over(signed_in: TestClient) -> None:
    boss = make_employee(signed_in)
    report = make_employee(signed_in, email="sipho@example.com", manager_id=boss["id"])
    replacement = make_employee(signed_in, email="naledi@example.com")

    response = signed_in.delete(
        f"/api/employees/{boss['id']}", params={"reassign_to": replacement["id"]}
    )

    assert response.status_code == 204
    moved = signed_in.get(f"/api/employees/{report['id']}").json()
    assert moved["manager_id"] == replacement["id"]


def test_a_direct_report_can_be_promoted_into_the_role(signed_in: TestClient) -> None:
    top = make_employee(signed_in)
    manager = make_employee(signed_in, email="sipho@example.com", manager_id=top["id"])
    first = make_employee(signed_in, email="naledi@example.com", manager_id=manager["id"])
    second = make_employee(signed_in, email="kagiso@example.com", manager_id=manager["id"])

    response = signed_in.delete(
        f"/api/employees/{manager['id']}", params={"reassign_to": first["id"]}
    )

    assert response.status_code == 204
    promoted = signed_in.get(f"/api/employees/{first['id']}").json()
    colleague = signed_in.get(f"/api/employees/{second['id']}").json()
    assert promoted["manager_id"] == top["id"]
    assert colleague["manager_id"] == first["id"]
