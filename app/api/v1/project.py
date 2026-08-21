from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectResponse
from app.services.project import ProjectService


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.post(
    "",
    response_model=ProjectResponse,
)
async def create_project(
    project_data: ProjectCreate,
    session: AsyncSession = Depends(get_db),
):
    service = ProjectService(session)

    return await service.create_project(
        project_data=project_data,
    )