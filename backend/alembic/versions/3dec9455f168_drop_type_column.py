"""drop type column

Revision ID: 3dec9455f168
Revises: 13fb21087f0f
Create Date: 2026-10-08 18:55:32.732569

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3dec9455f168'
down_revision: Union[str, Sequence[str], None] = '13fb21087f0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_column('conventions', 'type')

def downgrade():
    op.add_column('conventions', sa.Column('type', sa.String(), nullable=True))