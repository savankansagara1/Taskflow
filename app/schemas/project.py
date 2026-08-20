from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    owner_id: int


class ProjectResponse(BaseModel):
    id: int
    name: str
    owner_id: int

    model_config = {
        "from_attributes": True
    }