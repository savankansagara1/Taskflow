from datetime import datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class ProjectUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
    )

    description: str | None = None
    
# class ProjectResponse(BaseModel):
#     id: int
#     name: str
#     owner_id: int

#     model_config = {
#         "from_attributes": True,
#     }    