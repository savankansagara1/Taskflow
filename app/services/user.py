from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.repositories.user import UserRepository
from app.core.password import hash_password

from app.core.password import verify_password
from app.core.security import create_access_token
from app.schemas.user import UserLogin


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = UserRepository(db)

    async def create_user(
        self,
        username: str,
        email: str,
        password: str,
    ) -> User:
        
        password_hash = hash_password(password)
        
        user = await self.repository.create(
            username=username,
            email=email,
            password_hash=password_hash,
        )

        try:
         await self.db.commit()
        except IntegrityError:
         await self.db.rollback()
         raise

        await self.db.refresh(user)

        return user


    async def get_user(
        self,
        user_id: int,
    ) -> User | None:
        return await self.repository.get_by_id(user_id)


    async def get_users(self) -> list[User]:
        return await self.repository.get_all()



    async def update_user(
     self,
     user_id: int,
     data: dict,
    ) -> User | None:

     user = await self.repository.get_by_id(user_id)

     if user is None:
        return None

     updated_user = await self.repository.update(
        user=user,
        data=data,
    )

     try:
        await self.db.commit()
     except IntegrityError:
        await self.db.rollback()
        raise

     await self.db.refresh(updated_user)

     return updated_user


    async def delete_user(
     self,
     user_id: int,
    ) -> bool:
     user = await self.repository.get_by_id(user_id)

     if user is None:
        return False

     await self.repository.delete(user)

     try:
        await self.db.commit()
     except Exception:
        await self.db.rollback()
        raise

     return True 
 
 
 
 
    async def login(
     self,
     login_data: UserLogin,
     ) -> str:
      user = await self.repository.get_by_email(
        email=login_data.email,
    )

      if user is None:
        raise ValueError("Invalid email or password")

      is_password_correct = verify_password(
        login_data.password,
        user.password_hash,
    ) 

      if not is_password_correct:
        raise ValueError("Invalid email or password")

      access_token = create_access_token(
        user_id=user.id,
    )

      return access_token