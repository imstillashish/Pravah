"""add_manager_approved_to_decision_records

Revision ID: a1b2c3d4e5f6
Revises: 337ad255a2ab
Create Date: 2026-09-28 10:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '337ad255a2ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('decision_records')]
    
    if 'manager_approved' not in columns:
        op.add_column('decision_records', sa.Column('manager_approved', sa.Boolean(), nullable=True))
    if 'approval_notes' not in columns:
        op.add_column('decision_records', sa.Column('approval_notes', sa.Text(), nullable=True))
    if 'approved_at' not in columns:
        op.add_column('decision_records', sa.Column('approved_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('decision_records', 'approved_at')
    op.drop_column('decision_records', 'approval_notes')
    op.drop_column('decision_records', 'manager_approved')
