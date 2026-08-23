import asyncio
import selectors

from app.core.database import async_session
from app.schemas.user import UserLogin
from app.services.user import UserService


async def main():
    async with async_session() as session:
        service = UserService(session)

        login_data = UserLogin(
            email="savan@gmail.com",
            password="dev@123",
        )

        access_token = await service.login(
            login_data=login_data,
        )

        print("Access Token:")
        print(access_token)


# asyncio.run(main())
if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=lambda: asyncio.SelectorEventLoop(
            selectors.SelectSelector()
        ),
    )
