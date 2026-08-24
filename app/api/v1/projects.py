from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.schemas.project import ProjectCreate
from app.services.project import ProjectService

from app.api.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.post("/")
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        project = await service.create_project(
            project_data=project_data,
            owner_id=current_user.id,
        )

        return project

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )
        
        
        
@router.get("/")
async def get_all_projects(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    projects = await service.get_all_projects(
        owner_id=current_user.id,
    )

    return projects

@router.get("/{project_id}")
async def get_project_by_id(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        project = await service.get_project_by_id(
            project_id=project_id,
            owner_id = current_user.id
        )

        return project

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except PermissionError as error:
        raise HTTPException(
            status_code = 403,
            detail=str(error),
        )    
        
        
@router.patch("/{project_id}")
async def update_project(
    project_id: int,
    name: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        project = await service.update_project(
            project_id=project_id,
            name=name,
            owner_id=current_user.id,
        )

        return project

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
        
        
@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        await service.delete_project(
            project_id=project_id,
            owner_id=current_user.id,
        )

        return {
            "message": "Project deleted successfully"
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