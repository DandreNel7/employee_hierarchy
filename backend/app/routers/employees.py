from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.deps import DbSession, get_current_user
from app.models import Department, Employee
from app.schemas.employee import EmployeeIn, EmployeeOut
from app.services.hierarchy import bad_request, check_manager, reassign_and_delete

router = APIRouter(
    prefix="/api/employees",
    tags=["employees"],
    dependencies=[Depends(get_current_user)],
)


def get_employee(db: Session, employee_id: int) -> Employee:
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


def check_email_is_free(db: Session, email: str, employee_id: int | None = None) -> None:
    query = select(Employee).where(Employee.email == email)
    if employee_id is not None:
        query = query.where(Employee.id != employee_id)
    if db.scalar(query):
        raise bad_request("Another employee already uses that email address.")


def check_department(db: Session, department_id: int | None) -> None:
    if department_id is not None and db.get(Department, department_id) is None:
        raise bad_request("That department does not exist.")


@router.get("", response_model=list[EmployeeOut])
def list_employees(db: DbSession) -> list[Employee]:
    """The whole list. The frontend builds the org chart and filters the table from it."""
    query = (
        select(Employee)
        .options(joinedload(Employee.department))
        .order_by(Employee.first_name, Employee.last_name)
    )
    return list(db.scalars(query))


@router.get("/{employee_id}", response_model=EmployeeOut)
def read_employee(employee_id: int, db: DbSession) -> Employee:
    return get_employee(db, employee_id)


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(data: EmployeeIn, db: DbSession) -> Employee:
    check_email_is_free(db, data.email)
    check_department(db, data.department_id)
    check_manager(db, data.manager_id)

    employee = Employee(**data.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, data: EmployeeIn, db: DbSession) -> Employee:
    employee = get_employee(db, employee_id)
    check_email_is_free(db, data.email, employee.id)
    check_department(db, data.department_id)
    check_manager(db, data.manager_id, employee)

    for field, value in data.model_dump().items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: DbSession, reassign_to: int | None = None) -> None:
    """Direct reports move to reassign_to, or to the top of the chart if it is left out."""
    employee = get_employee(db, employee_id)
    reassign_and_delete(db, employee, reassign_to)
