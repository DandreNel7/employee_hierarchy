from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.deps import DbSession, get_current_user
from app.models import Department, Employee
from app.schemas.stats import DepartmentCount, RoleSalary, Stats

router = APIRouter(prefix="/api/stats", tags=["stats"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=Stats)
def read_stats(db: DbSession) -> Stats:
    """The numbers behind the dashboard."""
    employee_count = db.scalar(select(func.count()).select_from(Employee)) or 0
    department_count = db.scalar(select(func.count()).select_from(Department)) or 0
    average_salary = db.scalar(select(func.avg(Employee.salary)))
    without_manager = (
        db.scalar(select(func.count()).select_from(Employee).where(Employee.manager_id.is_(None)))
        or 0
    )

    by_department = db.execute(
        select(Department.name, Department.color, func.count(Employee.id))
        .join(Employee, Employee.department_id == Department.id, isouter=True)
        .group_by(Department.name, Department.color)
        .order_by(func.count(Employee.id).desc())
    ).all()

    by_role = db.execute(
        select(Employee.role, func.count(Employee.id), func.avg(Employee.salary))
        .group_by(Employee.role)
        .order_by(func.avg(Employee.salary).desc())
    ).all()

    return Stats(
        employee_count=employee_count,
        department_count=department_count,
        average_salary=round(average_salary, 2) if average_salary is not None else None,
        without_manager=without_manager,
        headcount_by_department=[
            DepartmentCount(name=name, color=color, employee_count=count)
            for name, color, count in by_department
        ],
        salary_by_role=[
            RoleSalary(role=role, employee_count=count, average_salary=round(average, 2))
            for role, count, average in by_role
        ],
    )
