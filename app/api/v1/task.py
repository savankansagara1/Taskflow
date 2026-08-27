from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.task import (
    TaskAssign,
    TaskCreate,
    TaskPriorityUpdate,
    TaskResponse,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services.task import TaskService


router = APIRouter(
    prefix="/projects/{project_id}/tasks",
    tags=["Tasks"],
)

my_tasks_router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


@my_tasks_router.get(
    "/me",
    response_model=list[TaskResponse],
)
async def get_my_tasks(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get all tasks for the current user irrespective of projects."""
    service = TaskService(session)

    return await service.get_my_tasks(
        user_id=current_user.id,
    )


@router.post(
    "/",
    response_model=TaskResponse,
)
async def create_task(
    project_id: int,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        return await service.create_task(
            project_id=project_id,
            task_data=task_data,
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


@router.get(
    "/",
    response_model=list[TaskResponse],
)
async def get_all_tasks(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        return await service.get_all_tasks(
            project_id=project_id,
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


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
async def get_task_by_id(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        return await service.get_task_by_id(
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


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
)
async def update_task(
    project_id: int,
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        return await service.update_task(
            project_id=project_id,
            task_id=task_id,
            task_data=task_data,
            user_id=current_user.id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except PermissionError as error:
        raise HTTPException(
            status_code=403,
            detail=str(error),
        )


@router.delete(
    "/{task_id}",
)
async def delete_task(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        await service.delete_task(
            project_id=project_id,
            task_id=task_id,
            user_id=current_user.id,
        )

        return {
            "message": "Task deleted successfully",
        }

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


@router.patch(
    "/{task_id}/assign",
    response_model=TaskResponse,
)
async def assign_task(
    project_id: int,
    task_id: int,
    assign_data: TaskAssign,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        return await service.assign_task(
            project_id=project_id,
            task_id=task_id,
            assignee_id=assign_data.assignee_id,
            user_id=current_user.id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except PermissionError as error:
        raise HTTPException(
            status_code=403,
            detail=str(error),
        )


@router.patch(
    "/{task_id}/status",
    response_model=TaskResponse,
)
async def change_task_status(
    project_id: int,
    task_id: int,
    status_data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        return await service.change_status(
            project_id=project_id,
            task_id=task_id,
            new_status=status_data.status.value,
            user_id=current_user.id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except PermissionError as error:
        raise HTTPException(
            status_code=403,
            detail=str(error),
        )


@router.patch(
    "/{task_id}/priority",
    response_model=TaskResponse,
)
async def change_task_priority(
    project_id: int,
    task_id: int,
    priority_data: TaskPriorityUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TaskService(session)

    try:
        return await service.change_priority(
            project_id=project_id,
            task_id=task_id,
            new_priority=priority_data.priority.value,
            user_id=current_user.id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except PermissionError as error:
        raise HTTPException(
            status_code=403,
            detail=str(error),
        )