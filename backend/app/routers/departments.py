from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import DbSession, get_current_user
from app.models import Department, Employee
from app.schemas.department import DepartmentIn, DepartmentOut
from app.services.hierarchy import bad_request

router = APIRouter(
    prefix="/api/departments",
    tags=["departments"],
    dependencies=[Depends(get_current_user)],
)


def get_department(db: Session, department_id: int) -> Department:
    department = db.get(Department, department_id)
    if department is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return department


def check_name_is_free(db: Session, name: str, department_id: int | None = None) -> None:
    query = select(Department).where(Department.name == name)
    if department_id is not None:
        query = query.where(Department.id != department_id)
    if db.scalar(query):
        raise bad_request("A department with that name already exists.")


@router.get("", response_model=list[DepartmentOut])
def list_departments(db: DbSession) -> list[Department]:
    return list(db.scalars(select(Department).order_by(Department.name)))


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(data: DepartmentIn, db: DbSession) -> Department:
    check_name_is_free(db, data.name)
    department = Department(**data.model_dump())
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, data: DepartmentIn, db: DbSession) -> Department:
    department = get_department(db, department_id)
    check_name_is_free(db, data.name, department.id)

    department.name = data.name
    department.color = data.color
    db.commit()
    db.refresh(department)
    return department


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: int, db: DbSession) -> None:
    department = get_department(db, department_id)
    if db.scalar(select(Employee).where(Employee.department_id == department.id)):
        raise bad_request("Move the employees in this department somewhere else first.")

    db.delete(department)
    db.commit()
