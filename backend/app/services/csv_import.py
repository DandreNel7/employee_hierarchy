"""Bulk import of employees from a CSV file."""

import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Department, Employee
from app.schemas.employee import EmployeeIn

COLUMNS = [
    "first_name",
    "last_name",
    "email",
    "birth_date",
    "salary",
    "role",
    "department",
    "manager_email",
]
MAX_ROWS = 2000
MAX_BYTES = 1024 * 1024

FIRST_DATA_ROW = 2


class ImportError_(Exception):
    """Carries the per row messages back to the router."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("The file could not be imported.")


def read_rows(content: bytes) -> list[dict[str, str]]:
    if len(content) > MAX_BYTES:
        raise ImportError_(["The file is larger than 1 MB."])

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ImportError_(["The file must be saved as UTF-8 text."]) from None

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise ImportError_(["The file is empty."])

    missing = [column for column in COLUMNS if column not in reader.fieldnames]
    if missing:
        raise ImportError_([f"The file is missing these columns: {', '.join(missing)}."])

    rows = list(reader)
    if not rows:
        raise ImportError_(["The file has a header but no employees."])
    if len(rows) > MAX_ROWS:
        raise ImportError_([f"The file has more than {MAX_ROWS} rows."])
    return rows


def parse_row(row: dict[str, str], line: int, errors: list[str]) -> dict | None:
    values = {key: (row.get(key) or "").strip() for key in COLUMNS}

    try:
        salary = Decimal(values["salary"].replace(" ", "").replace(",", ""))
    except InvalidOperation:
        errors.append(f"Row {line}: salary must be a number.")
        return None

    try:
        birth_date = date.fromisoformat(values["birth_date"])
    except ValueError:
        errors.append(f"Row {line}: birth date must look like 1990-04-12.")
        return None

    try:
        checked = EmployeeIn(
            first_name=values["first_name"],
            last_name=values["last_name"],
            email=values["email"],
            birth_date=birth_date,
            salary=salary,
            role=values["role"],
        )
    except ValidationError as error:
        for problem in error.errors():
            field = problem["loc"][0] if problem["loc"] else "row"
            errors.append(f"Row {line}: {field} - {problem['msg']}")
        return None

    return {
        "fields": checked.model_dump(exclude={"department_id", "manager_id"}),
        "department": values["department"],
        "manager_email": values["manager_email"].lower(),
    }


def check_managers(parsed: list[dict], existing_emails: set[str], errors: list[str]) -> None:
    file_emails = {item["fields"]["email"] for item in parsed}
    manager_of = {
        item["fields"]["email"]: item["manager_email"] for item in parsed if item["manager_email"]
    }

    for index, item in enumerate(parsed, start=FIRST_DATA_ROW):
        manager = item["manager_email"]
        if not manager:
            continue
        if manager == item["fields"]["email"]:
            errors.append(f"Row {index}: an employee cannot be their own manager.")
        elif manager not in file_emails and manager not in existing_emails:
            errors.append(f"Row {index}: no employee found with the manager email {manager}.")

    for email in manager_of:
        seen = {email}
        current = manager_of.get(email)
        while current in manager_of:
            if current in seen:
                errors.append(f"The file has a circular reporting line involving {current}.")
                break
            seen.add(current)
            current = manager_of.get(current)


def import_employees(db: Session, content: bytes) -> int:
    rows = read_rows(content)
    errors: list[str] = []

    parsed = []
    for line, row in enumerate(rows, start=FIRST_DATA_ROW):
        item = parse_row(row, line, errors)
        if item is not None:
            parsed.append(item)

    seen_emails: set[str] = set()
    for index, item in enumerate(parsed, start=FIRST_DATA_ROW):
        email = item["fields"]["email"]
        if email in seen_emails:
            errors.append(f"Row {index}: {email} appears more than once in the file.")
        seen_emails.add(email)

    taken = set(db.scalars(select(Employee.email)))
    for index, item in enumerate(parsed, start=FIRST_DATA_ROW):
        if item["fields"]["email"] in taken:
            errors.append(f"Row {index}: {item['fields']['email']} is already on the system.")

    check_managers(parsed, taken, errors)

    if errors:
        raise ImportError_(errors)

    departments = {
        name.lower(): department
        for name, department in db.execute(select(Department.name, Department)).all()
    }

    created: dict[str, Employee] = {}
    for item in parsed:
        name = item["department"]
        department = None
        if name:
            department = departments.get(name.lower())
            if department is None:
                department = Department(name=name)
                db.add(department)
                departments[name.lower()] = department

        employee = Employee(**item["fields"], department=department)
        db.add(employee)
        created[employee.email] = employee

    db.flush()
    existing = {
        employee.email: employee
        for employee in db.scalars(
            select(Employee).where(
                Employee.email.in_(
                    [item["manager_email"] for item in parsed if item["manager_email"]]
                )
            )
        )
    }
    for item in parsed:
        manager_email = item["manager_email"]
        if not manager_email:
            continue
        manager = created.get(manager_email) or existing.get(manager_email)
        created[item["fields"]["email"]].manager = manager

    db.commit()
    return len(parsed)
