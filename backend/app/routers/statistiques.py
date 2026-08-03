from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
from io import BytesIO
import openpyxl
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.database import get_db
from app.models import Convention, Partenaire, Budget
from app.services.statistiques_service import StatistiquesService

router = APIRouter(prefix="/statistiques", tags=["statistiques"])

@router.get("/")
def get_statistiques(
    periode: Optional[str] = Query("all", description="Période: all, 2026, 2025, 2024, personnalise"),
    date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les statistiques"""
    service = StatistiquesService(db)
    return service.get_stats(periode, date_debut, date_fin)

@router.get("/export")
def export_statistiques(
    format: str = Query("excel", description="Format: excel, pdf, word"),
    type: str = Query("plat", description="Type: plat, croise"),
    periode: Optional[str] = Query("all"),
    date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None),
    correlation1: Optional[str] = Query(None),
    correlation2: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Exporter les statistiques"""
    service = StatistiquesService(db)
    data = service.get_stats(periode, date_debut, date_fin)
    
    if format == "excel":
        return export_excel(data, type, correlation1, correlation2)
    elif format == "pdf":
        return export_pdf(data, type, correlation1, correlation2)
    elif format == "word":
        return export_word(data, type, correlation1, correlation2)

def export_excel(data, type_analyse, correlation1, correlation2):
    """Export en Excel"""
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Feuille 1: Résumé
        resume = pd.DataFrame({
            'Métrique': ['Total conventions', 'En cours', 'Expirées', 'À renouveler', 'Taux de renouvellement'],
            'Valeur': [
                data['total_conventions'],
                data['en_cours'],
                data['expirees'],
                data['a_renouveler'],
                f"{data['taux_renouvellement']}%"
            ]
        })
        resume.to_excel(writer, sheet_name='Résumé', index=False)
        
        # Feuille 2: Type de convention
        if data.get('par_type'):
            df = pd.DataFrame(data['par_type'])
            df.to_excel(writer, sheet_name='Type convention', index=False)
        
        # Feuille 3: Statut
        if data.get('par_statut'):
            df = pd.DataFrame(data['par_statut'])
            df.to_excel(writer, sheet_name='Statut', index=False)
        
        # Feuille 4: Type partenaire
        if data.get('par_type_partenaire'):
            df = pd.DataFrame(data['par_type_partenaire'])
            df.to_excel(writer, sheet_name='Type partenaire', index=False)
        
        # Feuille 5: Corrélations (si demandé)
        if type_analyse == 'croise' and data.get('correlations'):
            df = pd.DataFrame(data['correlations']['donnees'])
            df.to_excel(writer, sheet_name='Corrélations', index=False)
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=statistiques.xlsx"}
    )

def export_pdf(data, type_analyse, correlation1, correlation2):
    """Export en PDF"""
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    # Titre
    elements.append(Paragraph("Statistiques des Conventions", styles['Title']))
    elements.append(Spacer(1, 12))
    
    # Résumé
    elements.append(Paragraph("Résumé", styles['Heading2']))
    data_resume = [
        ['Métrique', 'Valeur'],
        ['Total conventions', str(data['total_conventions'])],
        ['En cours', str(data['en_cours'])],
        ['Expirées', str(data['expirees'])],
        ['À renouveler', str(data['a_renouveler'])],
        ['Taux de renouvellement', f"{data['taux_renouvellement']}%"]
    ]
    table = Table(data_resume)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    # Type de convention
    if data.get('par_type'):
        elements.append(Paragraph("Type de convention", styles['Heading2']))
        data_type = [['Type', 'Nombre', 'Pourcentage']]
        for item in data['par_type']:
            data_type.append([item['type'], str(item['count']), f"{item['pourcentage']}%"])
        table = Table(data_type)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
    
    doc.build(elements)
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=statistiques.pdf"}
    )

def export_word(data, type_analyse, correlation1, correlation2):
    """Export en Word (HTML simplifié)"""
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #1a56db; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th {{ background-color: #1a56db; color: white; padding: 10px; text-align: left; }}
            td {{ padding: 8px; border: 1px solid #ddd; }}
            tr:nth-child(even) {{ background-color: #f9fafb; }}
            .summary {{ display: flex; gap: 20px; flex-wrap: wrap; }}
            .card {{ border: 1px solid #ddd; border-radius: 8px; padding: 15px; min-width: 150px; }}
            .card h3 {{ margin: 0; color: #6b7280; font-size: 14px; }}
            .card p {{ margin: 5px 0 0; font-size: 24px; font-weight: bold; }}
        </style>
    </head>
    <body>
        <h1>Statistiques des Conventions</h1>
        <p>Généré le {pd.Timestamp.now().strftime('%d/%m/%Y %H:%M')}</p>
        
        <h2>Résumé</h2>
        <div class="summary">
            <div class="card"><h3>Total</h3><p>{data['total_conventions']}</p></div>
            <div class="card"><h3>En cours</h3><p>{data['en_cours']}</p></div>
            <div class="card"><h3>Expirées</h3><p>{data['expirees']}</p></div>
            <div class="card"><h3>À renouveler</h3><p>{data['a_renouveler']}</p></div>
        </div>
    """
    
    if data.get('par_type'):
        html += f"""
        <h2>Type de convention</h2>
        <table>
            <tr><th>Type</th><th>Nombre</th><th>Pourcentage</th></tr>
        """
        for item in data['par_type']:
            html += f"<tr><td>{item['type']}</td><td>{item['count']}</td><td>{item['pourcentage']}%</td></tr>"
        html += "</table>"
    
    if data.get('par_statut'):
        html += f"""
        <h2>Statut</h2>
        <table>
            <tr><th>Statut</th><th>Nombre</th><th>Pourcentage</th></tr>
        """
        for item in data['par_statut']:
            html += f"<tr><td>{item['statut']}</td><td>{item['count']}</td><td>{item['pourcentage']}%</td></tr>"
        html += "</table>"
    
    html += """
    </body>
    </html>
    """
    
    return Response(
        content=html.encode('utf-8'),
        media_type="application/msword",
        headers={"Content-Disposition": "attachment; filename=statistiques.doc"}
    )