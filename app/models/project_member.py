from sqlalchemy import ForeignKey , UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column ,relationship

from app.core.database import Base

class ProjectMember(Base):
    __tablename__ = "project_members"

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "user_id",
            name="uq_project_member",
        ),
    )   

    id : Mapped[int] = mapped_column(
        primary_key = True,
    )

    project_id : Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        nullable=False,
    )

    user_id:Mapped[int]=mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
    back_populates="project_members",
    )

    project: Mapped["Project"] = relationship(
    back_populates="project_members",
    )