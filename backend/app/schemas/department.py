from pydantic import BaseModel, ConfigDict, Field


class DepartmentIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = Field(default="#051641", pattern=r"^#[0-9A-Fa-f]{6}$")


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str
