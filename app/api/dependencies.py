from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user import UserRepository


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/users/login",
)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db),
) -> User:
    try:
        user_id = decode_access_token(token)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    repository = UserRepository(session)

    user = await repository.get_by_id(
        user_id=user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user