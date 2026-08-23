from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.schemas.project import ProjectCreate
from app.services.project import ProjectService


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.post("/")
async def create_project(
    project_data: ProjectCreate,
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        project = await service.create_project(
            project_data=project_data,
        )

        return project

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )
        
        
        
@router.get("/")
async def get_all_projects(
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    projects = await service.get_all_projects()

    return projects               


@router.get("/{project_id}")
async def get_project_by_id(
    project_id: int,
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        project = await service.get_project_by_id(
            project_id=project_id,
        )

        return project

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )
        
        
@router.patch("/{project_id}")
async def update_project(
    project_id: int,
    name: str,
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        project = await service.update_project(
            project_id=project_id,
            name=name,
        )

        return project

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )        
        
        
        
@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    try:
        await service.delete_project(
            project_id=project_id,
        )

        return {
            "message": "Project deleted successfully"
        }

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )    