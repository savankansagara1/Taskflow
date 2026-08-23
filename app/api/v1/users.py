from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.exc import IntegrityError

from app.services.user import UserService

from app.schemas.user import UserCreate, UserResponse, UserUpdate, UserLogin
from app.api.dependencies import get_current_user
from app.models.user import User

from app.api.dependencies import get_current_user

from fastapi import status

from app.dependencies.database import get_db


router = APIRouter()

@router.get(
    "/",
    response_model=list[UserResponse],
)
async def get_users(
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    users = await service.get_users()

    return users


@router.post(
    "/",
    response_model=UserResponse,
)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    try:
        user = await service.create_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Email already exists",
        )

    return user

@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }

@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    user = await service.get_user(user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user 


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    update_data = user_data.model_dump(
        exclude_unset=True,
    )

    try:
        user = await service.update_user(
            user_id=user_id,
            data=update_data,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Email already exists",
        )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    deleted = await service.delete_user(user_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


@router.post("/login")
async def login_user(
    login_data: UserLogin,
    session: AsyncSession = Depends(get_db),
):
    service = UserService(session)

    try:
        access_token = await service.login(
            login_data=login_data,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        )
        
