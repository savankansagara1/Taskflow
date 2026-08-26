from datetime import datetime

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    action: str
    detail: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }
