from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.repositories.project import ProjectRepository
# from app.repositories.user import UserRepository
from app.schemas.project import ProjectCreate


class ProjectService:

    def __init__(self, session: AsyncSession):
        # self.user_repository = UserRepository(session)
        self.project_repository = ProjectRepository(session)
        self.session = session

    async def create_project(
          self,
          project_data : ProjectCreate,
          owner_id :int,
    ) -> Project:

       project = await self.project_repository.create(
          name=project_data.name,
          owner_id=owner_id,
       )
       await self.session.commit()

       return project
    
    
    async def get_project_by_id(
        self,
        project_id:int,
        owner_id:int,
    ) -> Project:
        
        project = await self.project_repository.get_by_id(
            project_id=project_id
        )
        
        if project is None:
            raise ValueError("Project not found")

        if project.owner_id != owner_id:
           raise PermissionError("You do not have permission to access this project")
        
        return project
    
    
    async def get_all_projects(
     self,
     owner_id: int,
    )-> list[Project]:

     project = await self.project_repository.get_by_owner_id(owner_id=owner_id)

     return project
 
 
    async def update_project(
     self,
     project_id: int,
     name: str,
     owner_id: int,
    ) -> Project:

     project = await self.project_repository.get_by_id(
        project_id=project_id,
    )

     if project is None:
        raise ValueError("Project not found")

     if project.owner_id != owner_id:
        raise PermissionError(
            "You are not allowed to update this project"
        )

     updated_project = await self.project_repository.update(
        project=project,
        name=name,
    )

     await self.session.commit()

     return updated_project

    
    async def delete_project(
     self,
     project_id: int,
     owner_id: int,
    ) -> None:

     project = await self.  project_repository.get_by_id(
        project_id=project_id,
    )
     print(project)

     if project is None:
        raise ValueError("Project not found")

     if project.owner_id != owner_id:
        raise PermissionError(
            "You are not allowed to delete this project"
        )

     await self.project_repository.  delete(
        project=project,
    )

     await self.session.commit() 