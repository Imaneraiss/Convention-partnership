"""ajouter_colonne_taille_fichiers

Revision ID: 9a707899ae03
Revises: d2e746cbee4c
Create Date: 2026-08-09 16:34:44.668136

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9a707899ae03'
down_revision: Union[str, Sequence[str], None] = 'd2e746cbee4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. D'abord retirer les FK qui pointent vers reunions
    op.drop_constraint('alertes_reunion_id_fkey', 'alertes', type_='foreignkey')
    op.drop_constraint('fichiers_reunion_id_fkey', 'fichiers', type_='foreignkey')

    # 2. Ensuite supprimer les colonnes devenues inutiles
    op.drop_column('alertes', 'reunion_id')
    op.drop_column('fichiers', 'reunion_id')

    # 3. Puis seulement supprimer les tables
    op.drop_table('reunions')
    op.drop_table('comite_destinataires_internes')
    op.drop_table('comite_destinataires_externes')

    # 4. Le reste des changements
    op.alter_column('comites', 'taches',
               existing_type=postgresql.JSON(astext_type=sa.Text()),
               nullable=False,
               existing_server_default=sa.text("'[]'::json"))
    op.add_column('fichiers', sa.Column('taille', sa.Integer(), nullable=True))
    op.alter_column('fichiers', 'chemin',
               existing_type=sa.VARCHAR(),
               type_=sa.Text(),
               existing_nullable=False)

    # 5. Recréer les FK avec ON DELETE CASCADE, noms explicites
    op.drop_constraint('fichiers_convention_id_fkey', 'fichiers', type_='foreignkey')
    op.drop_constraint('fichiers_budget_id_fkey', 'fichiers', type_='foreignkey')
    op.create_foreign_key('fichiers_convention_id_fkey', 'fichiers', 'conventions',
                          ['convention_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fichiers_budget_id_fkey', 'fichiers', 'budgets',
                          ['budget_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    """Downgrade schema."""
    # 1. Recréer les tables supprimées
    op.create_table('reunions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('date_reunion', sa.DATE(), nullable=False),
        sa.Column('decisions', sa.TEXT(), nullable=True),
        sa.Column('comite_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['comite_id'], ['comites.id'], name='reunions_comite_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='reunions_pkey')
    )
    op.create_table('comite_destinataires_externes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('comite_id', sa.UUID(), nullable=False),
        sa.Column('email', sa.VARCHAR(), nullable=False),
        sa.ForeignKeyConstraint(['comite_id'], ['comites.id'], name='comite_destinataires_externes_comite_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='comite_destinataires_externes_pkey')
    )
    op.create_table('comite_destinataires_internes',
        sa.Column('comite_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['comite_id'], ['comites.id'], name='comite_destinataires_internes_comite_id_fkey'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='comite_destinataires_internes_user_id_fkey')
    )

    # 2. Recréer les colonnes reunion_id puis leurs FK
    op.add_column('fichiers', sa.Column('reunion_id', sa.UUID(), nullable=True))
    op.add_column('alertes', sa.Column('reunion_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fichiers_reunion_id_fkey', 'fichiers', 'reunions', ['reunion_id'], ['id'])
    op.create_foreign_key('alertes_reunion_id_fkey', 'alertes', 'reunions', ['reunion_id'], ['id'])

    # 3. Restaurer les FK sans CASCADE
    op.drop_constraint('fichiers_convention_id_fkey', 'fichiers', type_='foreignkey')
    op.drop_constraint('fichiers_budget_id_fkey', 'fichiers', type_='foreignkey')
    op.create_foreign_key('fichiers_convention_id_fkey', 'fichiers', 'conventions', ['convention_id'], ['id'])
    op.create_foreign_key('fichiers_budget_id_fkey', 'fichiers', 'budgets', ['budget_id'], ['id'])

    # 4. Annuler les autres changements
    op.alter_column('fichiers', 'chemin',
               existing_type=sa.Text(),
               type_=sa.VARCHAR(),
               existing_nullable=False)
    op.drop_column('fichiers', 'taille')
    op.alter_column('comites', 'taches',
               existing_type=postgresql.JSON(astext_type=sa.Text()),
               nullable=True,
               existing_server_default=sa.text("'[]'::json"))