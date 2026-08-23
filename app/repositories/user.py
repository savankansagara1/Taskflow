from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import User

class UserRepository:
    def __init__(self, db:AsyncSession):
        self.db = db 

    async def create(
     self,
     username: str,
     email: str,
     password_hash: str,
    ) -> User:
     user = User(
        username=username,
        email=email,
        password_hash=password_hash,
    )

     self.db.add(user)

     return user



    async def get_by_id(self,user_id:int) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )

        return result.scalar_one_or_none()


    async def get_all(self) -> list[User]:
        result = await self.db.execute(
            select(User)
        )

        return result.scalars().all()



    async def update(
     self,
     user: User,
     data: dict,
    ) -> User:
     for field, value in data.items():
        setattr(user, field, value)

     return user


    async def delete(
          self,
          user: User,
    ) -> None:
       await self.db.delete(user)
       
       
    async def get_by_id_with_projects(
        self,
        user_id: int,
    ) -> User | None:  

      result = await self.db.execute(
          select(User)
          .options(
              selectinload(User.projects)
          )
          .where(User.id == user_id)
      )
      
      return result.scalar_one_or_none()
  
    async def get_by_email(
     self,
     email: str,
    ) -> User | None:
     result = await self.db.execute(
        select(User).where(User.email == email)
    )

     return result.scalar_one_or_none() 
  


    