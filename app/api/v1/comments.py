from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.dependencies.database import get_db
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services.comment import CommentService


router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/comments",
    tags=["Comments"],
)


@router.post(
    "/",
    response_model=CommentResponse,
    status_code=201,
)
async def create_comment(
    project_id: int,
    task_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CommentService(session)

    try:
        return await service.create_comment(
            project_id=project_id,
            task_id=task_id,
            comment_data=comment_data,
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
    response_model=list[CommentResponse],
)
async def get_comments(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CommentService(session)

    try:
        return await service.get_comments_for_task(
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


@router.get(
    "/{comment_id}",
    response_model=CommentResponse,
)
async def get_comment(
    project_id: int,
    task_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CommentService(session)

    try:
        return await service.get_comment_by_id(
            project_id=project_id,
            task_id=task_id,
            comment_id=comment_id,
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
    "/{comment_id}",
    response_model=CommentResponse,
)
async def update_comment(
    project_id: int,
    task_id: int,
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CommentService(session)

    try:
        return await service.update_comment(
            project_id=project_id,
            task_id=task_id,
            comment_id=comment_id,
            comment_data=comment_data,
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


@router.delete(
    "/{comment_id}",
)
async def delete_comment(
    project_id: int,
    task_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CommentService(session)

    try:
        await service.delete_comment(
            project_id=project_id,
            task_id=task_id,
            comment_id=comment_id,
            user_id=current_user.id,
        )

        return {
            "message": "Comment deleted successfully",
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
