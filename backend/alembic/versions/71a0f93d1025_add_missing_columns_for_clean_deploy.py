"""add missing columns for clean deploy

Revision ID: 71a0f93d1025
Revises: 3dec9455f168
Create Date: 2026-10-16 07:38:32.639153

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# ═══════════════════════════════════════════════════════════
# IDENTIFIANTS ALEMBIC (⚠️ NE PAS SUPPRIMER)
# ═══════════════════════════════════════════════════════════
revision: str = '71a0f93d1025'
down_revision: Union[str, Sequence[str], None] = '3dec9455f168'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    conn = op.get_bind()

    # ═══ Conventions ═══
    result = conn.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'conventions'
    """))
    existing = {r[0] for r in result.fetchall()}

    if 'signataire_partenaire' not in existing:
        op.add_column('conventions', sa.Column('signataire_partenaire', sa.String(), nullable=True))
    if 'signataire_partenaire_autre' not in existing:
        op.add_column('conventions', sa.Column('signataire_partenaire_autre', sa.String(), nullable=True))
    if 'signe' not in existing:
        op.add_column('conventions', sa.Column('signe', sa.Boolean(), server_default='false'))
    if 'expiree_manuellement' not in existing:
        op.add_column('conventions', sa.Column('expiree_manuellement', sa.Boolean(), server_default='false'))

    # Retirer NOT NULL sur date_signature
    op.alter_column('conventions', 'date_signature', existing_type=sa.Date(), nullable=True)

    # ═══ Comites ═══
    result = conn.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'comites'
    """))
    existing = {r[0] for r in result.fetchall()}

    if 'reunions' not in existing:
        op.add_column('comites', sa.Column('reunions', sa.dialects.postgresql.JSON(), server_default='[]'))
    if 'membres_um5' not in existing:
        op.add_column('comites', sa.Column('membres_um5', sa.dialects.postgresql.JSON(), server_default='[]'))
    if 'membres_partenaires' not in existing:
        op.add_column('comites', sa.Column('membres_partenaires', sa.dialects.postgresql.JSON(), server_default='[]'))
    if 'date_debut' not in existing:
        op.add_column('comites', sa.Column('date_debut', sa.Date(), nullable=True))
    if 'prochaine_reunion' not in existing:
        op.add_column('comites', sa.Column('prochaine_reunion', sa.Date(), nullable=True))

    # ═══ Alertes ═══
    result = conn.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'alertes'
    """))
    existing = {r[0] for r in result.fetchall()}

    if 'created_by' not in existing:
        op.add_column('alertes', sa.Column('created_by', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))

    # ═══ Historique ═══
    result = conn.execute(text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'historique'
    """))
    existing = {r[0] for r in result.fetchall()}

    if 'description' not in existing:
        op.add_column('historique', sa.Column('description', sa.Text(), nullable=True))
    if 'ip_address' not in existing:
        op.add_column('historique', sa.Column('ip_address', sa.String(), nullable=True))
    if 'statut' not in existing:
        op.add_column('historique', sa.Column('statut', sa.String(), server_default='success'))
    if 'user_agent' not in existing:
        op.add_column('historique', sa.Column('user_agent', sa.String(), nullable=True))


def downgrade():
    # Pas critique pour le downgrade
    pass