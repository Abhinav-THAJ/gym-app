"""Add calories column to workout

Revision ID: add_calories_001
Revises: 097456bffe2d
Create Date: 2026-01-05 02:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_calories_001'
down_revision: Union[str, None] = '097456bffe2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add calories column to workouts table with default value 0.0
    op.add_column('workouts', sa.Column('calories', sa.Float(), nullable=True, server_default='0.0'))


def downgrade() -> None:
    # Remove calories column from workouts table
    op.drop_column('workouts', 'calories')
