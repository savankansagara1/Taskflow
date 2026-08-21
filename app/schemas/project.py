from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1)
    owner_id: int


class ProjectResponse(BaseModel):
    id: int
    name: str
    owner_id: int

    model_config = {
        "from_attributes": True
    }

class ProjectResponse(BaseModel):
    id: int
    name: str
    owner_id: int

    model_config = {
        "from_attributes": True,
    }    