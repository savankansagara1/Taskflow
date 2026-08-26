"""add_priority_creator_assignee_duedate_comments_activities

Revision ID: c6d5bd09f5c4
Revises: 42f42deac65c
Create Date: 2026-08-26 14:18:38.056800

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6d5bd09f5c4'
down_revision: Union[str, Sequence[str], None] = '42f42deac65c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # --- New tables ---
    op.create_table('activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('detail', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # --- New columns on tasks ---

    # priority: has server_default so safe to add as NOT NULL
    op.add_column('tasks', sa.Column('priority', sa.String(length=20), server_default='MEDIUM', nullable=False))

    # creator_id: add as nullable first, then backfill, then make NOT NULL
    op.add_column('tasks', sa.Column('creator_id', sa.Integer(), nullable=True))

    # Backfill creator_id: set to the project owner for existing tasks
    op.execute(
        """
        UPDATE tasks
        SET creator_id = (
            SELECT owner_id FROM projects WHERE projects.id = tasks.project_id
        )
        WHERE creator_id IS NULL
        """
    )

    # Now make creator_id NOT NULL
    op.alter_column('tasks', 'creator_id', nullable=False)

    op.add_column('tasks', sa.Column('assignee_id', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('due_date', sa.DateTime(timezone=True), nullable=True))

    op.create_foreign_key('fk_tasks_creator_id', 'tasks', 'users', ['creator_id'], ['id'])
    op.create_foreign_key('fk_tasks_assignee_id', 'tasks', 'users', ['assignee_id'], ['id'])

    # --- Data migration: update status values to uppercase ---
    op.execute("UPDATE tasks SET status = 'TODO' WHERE status = 'todo'")
    op.execute("UPDATE tasks SET status = 'IN_PROGRESS' WHERE status = 'in_progress'")
    op.execute("UPDATE tasks SET status = 'DONE' WHERE status = 'completed'")

    # Update server_default for status column
    op.alter_column('tasks', 'status', server_default='TODO')


def downgrade() -> None:
    """Downgrade schema."""

    # Revert status values
    op.execute("UPDATE tasks SET status = 'todo' WHERE status = 'TODO'")
    op.execute("UPDATE tasks SET status = 'in_progress' WHERE status = 'IN_PROGRESS'")
    op.execute("UPDATE tasks SET status = 'completed' WHERE status = 'DONE'")
    op.alter_column('tasks', 'status', server_default='todo')

    op.drop_constraint('fk_tasks_assignee_id', 'tasks', type_='foreignkey')
    op.drop_constraint('fk_tasks_creator_id', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'due_date')
    op.drop_column('tasks', 'assignee_id')
    op.drop_column('tasks', 'creator_id')
    op.drop_column('tasks', 'priority')
    op.drop_table('comments')
    op.drop_table('activities')
