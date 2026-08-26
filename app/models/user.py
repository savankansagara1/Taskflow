from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
    )
    
    password_hash : Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    projects: Mapped[list["Project"]] = relationship(
        back_populates="owner"
    )

    project_members: Mapped[list["ProjectMember"]] = relationship(
        back_populates="user",
    )

    tasks_created: Mapped[list["Task"]] = relationship(
        foreign_keys="[Task.creator_id]",
        back_populates="creator",
    )

    tasks_assigned: Mapped[list["Task"]] = relationship(
        foreign_keys="[Task.assignee_id]",
        back_populates="assignee",
    )

    comments: Mapped[list["Comment"]] = relationship(
        back_populates="author",
    )

    activities: Mapped[list["Activity"]] = relationship(
        back_populates="user",
    )