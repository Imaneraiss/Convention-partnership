"""fix historique cascade to set null

Revision ID: bb4e78ace6c0
Revises: 9a707899ae03
Create Date: 2026-08-14 00:31:51.299903

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'bb4e78ace6c0'
down_revision: Union[str, Sequence[str], None] = '9a707899ae03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ═══════════════════════════════════════════════════════════
# HELPERS — Vérifications d'existence
# ═══════════════════════════════════════════════════════════

def index_exists(conn, index_name):
    """Vérifie si un index existe."""
    result = conn.execute(text(
        "SELECT 1 FROM pg_indexes WHERE indexname = :name"
    ), {"name": index_name})
    return result.fetchone() is not None


def constraint_exists(conn, constraint_name, table_name):
    """Vérifie si une contrainte existe."""
    result = conn.execute(text(
        "SELECT 1 FROM pg_constraint "
        "WHERE conname = :name "
        "AND conrelid = CAST(:table AS regclass)"
    ), {"name": constraint_name, "table": table_name})
    return result.fetchone() is not None

def column_exists(conn, table_name, column_name):
    """Vérifie si une colonne existe."""
    result = conn.execute(text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name = :table AND column_name = :column"
    ), {"table": table_name, "column": column_name})
    return result.fetchone() is not None


def safe_drop_constraint(constraint_name, table_name, type_='foreignkey'):
    """Supprime une contrainte seulement si elle existe."""
    conn = op.get_bind()
    if constraint_exists(conn, constraint_name, table_name):
        op.drop_constraint(constraint_name, table_name, type_=type_)


def safe_drop_index(index_name, table_name):
    """Supprime un index seulement s'il existe."""
    conn = op.get_bind()
    if index_exists(conn, index_name):
        op.drop_index(index_name, table_name=table_name)


# ═══════════════════════════════════════════════════════════
# UPGRADE
# ═══════════════════════════════════════════════════════════

def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()

    # ─── Alertes ───
    safe_drop_constraint(op.f('alertes_convention_id_fkey'), 'alertes', 'foreignkey')
    op.create_foreign_key(None, 'alertes', 'conventions', ['convention_id'], ['id'])

    # ─── Budgets ───
    safe_drop_constraint(op.f('budgets_convention_id_fkey'), 'budgets', 'foreignkey')
    op.create_foreign_key(None, 'budgets', 'conventions', ['convention_id'], ['id'])

    # ─── Comités ───
    op.alter_column('comites', 'taches',
               existing_type=postgresql.JSON(astext_type=sa.Text()),
               nullable=False,
               existing_server_default=sa.text("'[]'::json"))
    safe_drop_constraint(op.f('comites_convention_id_fkey'), 'comites', 'foreignkey')
    op.create_foreign_key(None, 'comites', 'conventions', ['convention_id'], ['id'])

    # ─── Fichiers ───
    op.alter_column('fichiers', 'chemin',
               existing_type=sa.VARCHAR(),
               type_=sa.Text(),
               existing_nullable=False)
    safe_drop_constraint(op.f('fichiers_budget_id_fkey'), 'fichiers', 'foreignkey')
    op.create_foreign_key(None, 'fichiers', 'budgets', ['budget_id'], ['id'], ondelete='CASCADE')

    # ─── Historique (⚠️ c'est ici que ça plantait) ───
    safe_drop_index(op.f('idx_historique_convention'), 'historique')  # ✅ TOLÉRANT
    safe_drop_index(op.f('idx_historique_date'), 'historique')        # ✅ TOLÉRANT
    safe_drop_index(op.f('idx_historique_user'), 'historique')        # ✅ TOLÉRANT
    
    safe_drop_constraint(op.f('historique_user_id_fkey'), 'historique', 'foreignkey')
    safe_drop_constraint(op.f('historique_convention_id_fkey'), 'historique', 'foreignkey')
    
    op.create_foreign_key(None, 'historique', 'conventions', ['convention_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'historique', 'users', ['user_id'], ['id'], ondelete='SET NULL')


# ═══════════════════════════════════════════════════════════
# DOWNGRADE
# ═══════════════════════════════════════════════════════════

def downgrade() -> None:
    """Downgrade schema."""
    # ─── Historique ───
    op.drop_constraint(None, 'historique', type_='foreignkey')
    op.drop_constraint(None, 'historique', type_='foreignkey')
    op.create_foreign_key(op.f('historique_convention_id_fkey'), 'historique', 'conventions', ['convention_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('historique_user_id_fkey'), 'historique', 'users', ['user_id'], ['id'])
    op.create_index(op.f('idx_historique_user'), 'historique', ['user_id'], unique=False)
    op.create_index(op.f('idx_historique_date'), 'historique', [sa.literal_column('date_action DESC')], unique=False)
    op.create_index(op.f('idx_historique_convention'), 'historique', ['convention_id'], unique=False)

    # ─── Fichiers ───
    op.drop_constraint(None, 'fichiers', type_='foreignkey')
    op.create_foreign_key(op.f('fichiers_budget_id_fkey'), 'fichiers', 'budgets', ['budget_id'], ['id'])
    op.alter_column('fichiers', 'chemin',
               existing_type=sa.Text(),
               type_=sa.VARCHAR(),
               existing_nullable=False)

    # ─── Comités ───
    op.drop_constraint(None, 'comites', type_='foreignkey')
    op.create_foreign_key(op.f('comites_convention_id_fkey'), 'comites', 'conventions', ['convention_id'], ['id'], ondelete='CASCADE')
    op.alter_column('comites', 'taches',
               existing_type=postgresql.JSON(astext_type=sa.Text()),
               nullable=True,
               existing_server_default=sa.text("'[]'::json"))

    # ─── Budgets ───
    op.drop_constraint(None, 'budgets', type_='foreignkey')
    op.create_foreign_key(op.f('budgets_convention_id_fkey'), 'budgets', 'conventions', ['convention_id'], ['id'], ondelete='CASCADE')

    # ─── Alertes ───
    op.drop_constraint(None, 'alertes', type_='foreignkey')
    op.create_foreign_key(op.f('alertes_convention_id_fkey'), 'alertes', 'conventions', ['convention_id'], ['id'], ondelete='CASCADE')