from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.services.avatars import gravatar_url

if TYPE_CHECKING:
    from app.models.department import Department

# Postgres builds the employee number from this sequence.
EMPLOYEE_NUMBER_DEFAULT = "'EMP-' || lpad(nextval('employee_number_seq')::text, 4, '0')"


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        CheckConstraint("manager_id <> id", name="ck_employees_not_own_manager"),
        CheckConstraint("salary >= 0", name="ck_employees_salary_not_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_number: Mapped[str] = mapped_column(
        String(20), unique=True, server_default=text(EMPLOYEE_NUMBER_DEFAULT)
    )
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    # Gravatar looks up avatars by email.
    email: Mapped[str] = mapped_column(String(255), unique=True)
    birth_date: Mapped[date] = mapped_column(Date)
    salary: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    role: Mapped[str] = mapped_column(String(100))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), index=True)
    # Empty for the top of the hierarchy.
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), index=True)
    avatar_key: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    manager: Mapped["Employee | None"] = relationship(back_populates="reports", remote_side=[id])
    reports: Mapped[list["Employee"]] = relationship(back_populates="manager")
    department: Mapped["Department | None"] = relationship(back_populates="employees")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def avatar_url(self) -> str:
        return gravatar_url(self.email)
