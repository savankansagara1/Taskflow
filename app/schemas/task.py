from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    priority: TaskPriority = TaskPriority.MEDIUM

    assignee_id: int | None = None

    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    status: TaskStatus | None = None

    priority: TaskPriority | None = None

    assignee_id: int | None = None

    due_date: datetime | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    project_id: int
    creator_id: int
    assignee_id: int | None
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class TaskAssign(BaseModel):
    assignee_id: int | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskPriorityUpdate(BaseModel):
    priority: TaskPriority