from decimal import Decimal

from pydantic import BaseModel


class DepartmentCount(BaseModel):
    name: str
    color: str
    employee_count: int


class RoleSalary(BaseModel):
    role: str
    employee_count: int
    average_salary: Decimal


class Stats(BaseModel):
    employee_count: int
    department_count: int
    average_salary: Decimal | None
    without_manager: int
    headcount_by_department: list[DepartmentCount]
    salary_by_role: list[RoleSalary]
