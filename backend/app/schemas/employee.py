from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.department import DepartmentOut

MIN_AGE = 16


class EmployeeIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    birth_date: date
    salary: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    role: str = Field(min_length=1, max_length=100)
    department_id: int | None = None
    manager_id: int | None = None

    @field_validator("birth_date")
    @classmethod
    def check_age(cls, value: date) -> date:
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if value >= today:
            raise ValueError("The birth date must be in the past.")
        if age < MIN_AGE:
            raise ValueError(f"An employee must be at least {MIN_AGE} years old.")
        return value

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_number: str
    first_name: str
    last_name: str
    email: str
    birth_date: date
    salary: Decimal
    role: str
    manager_id: int | None
    avatar_key: str | None
    department: DepartmentOut | None
    avatar_url: str


class AvatarUploadIn(BaseModel):
    content_type: str


class AvatarUploadOut(BaseModel):
    url: str
    fields: dict[str, str]
    key: str


class AvatarSaveIn(BaseModel):
    key: str
