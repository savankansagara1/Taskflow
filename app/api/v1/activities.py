from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.activity import ActivityResponse
from app.services.activity import ActivityService


router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/activity",
    tags=["Activity"],
)


@router.get(
    "/",
    response_model=list[ActivityResponse],
)
async def get_task_activity(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = ActivityService(session)

    try:
        return await service.get_activities_for_task(
            project_id=project_id,
            task_id=task_id,
            user_id=current_user.id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except PermissionError as error:
        raise HTTPException(
            status_code=403,
            detail=str(error),
        )
