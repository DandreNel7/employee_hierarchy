from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Employee


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


def subtree_ids(db: Session, employee_id: int) -> set[int]:
    """The employee plus everyone below them, found with a recursive query."""
    top = select(Employee.id).where(Employee.id == employee_id).cte("subtree", recursive=True)
    below = select(Employee.id).join(top, Employee.manager_id == top.c.id)
    tree = top.union_all(below)
    return set(db.scalars(select(tree.c.id)))


def check_manager(db: Session, manager_id: int | None, employee: Employee | None = None) -> None:
    """Make sure a manager choice keeps the hierarchy a tree."""
    if manager_id is None:
        return

    manager = db.get(Employee, manager_id)
    if manager is None:
        raise bad_request("That manager does not exist.")

    if employee is None:
        return

    if manager_id == employee.id:
        raise bad_request("An employee cannot be their own manager.")

    # Reporting to someone below you would create a loop with no one at the top.
    if manager_id in subtree_ids(db, employee.id):
        raise bad_request(
            f"{manager.full_name} already reports to {employee.full_name}, "
            "so they cannot be the manager."
        )


def reassign_and_delete(db: Session, employee: Employee, reassign_to: int | None) -> None:
    """Delete an employee, moving their direct reports somewhere sensible first."""
    reports = list(employee.reports)

    if reports and reassign_to is not None:
        new_manager = db.get(Employee, reassign_to)
        if new_manager is None:
            raise bad_request("The employee you picked to take over does not exist.")
        if new_manager.id == employee.id:
            raise bad_request("Pick someone else to take over the team.")

        if new_manager.manager_id == employee.id:
            # Promoting one of the direct reports: they take their manager's place.
            new_manager.manager_id = employee.manager_id
            for report in reports:
                if report.id != new_manager.id:
                    report.manager_id = new_manager.id
        elif new_manager.id in subtree_ids(db, employee.id):
            raise bad_request(
                "Pick someone outside this person's team, or one of their direct reports."
            )
        else:
            for report in reports:
                report.manager_id = new_manager.id
    else:
        # No one chosen, so the reports end up at the top of the chart.
        for report in reports:
            report.manager_id = None

    db.delete(employee)
    db.commit()
