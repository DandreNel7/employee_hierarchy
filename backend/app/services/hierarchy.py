from fastapi import HTTPException, status
from sqlalchemy import select, update
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
    moves_to = None

    if reassign_to is not None:
        new_manager = db.get(Employee, reassign_to)
        if new_manager is None:
            raise bad_request("The employee you picked to take over does not exist.")
        if new_manager.id == employee.id:
            raise bad_request("Pick someone else to take over the team.")

        if new_manager.manager_id == employee.id:
            # Promoting one of the direct reports: they take their manager's place.
            db.execute(
                update(Employee)
                .where(Employee.id == new_manager.id)
                .values(manager_id=employee.manager_id)
            )
        elif new_manager.id in subtree_ids(db, employee.id):
            raise bad_request(
                "Pick someone outside this person's team, or one of their direct reports."
            )
        moves_to = new_manager.id

    db.execute(
        update(Employee).where(Employee.manager_id == employee.id).values(manager_id=moves_to)
    )

    db.delete(employee)
    db.commit()
