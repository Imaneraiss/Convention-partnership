import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';

// Palette de couleurs personnalisée
const COLORS = {
  primary: '#1a56db',
  secondary: '#3b82f6',
  accent: '#f59e0b',
  background: '#f3f4f6',
  text: '#1f2937',
  border: '#d1d5db',
  headerBg: '#1e3a8a',
  headerText: '#ffffff',
  sectionBg: '#eff6ff',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// Fonction pour formater les articles
const formatArticles = (articles) => {
  if (!articles || typeof articles !== 'object') return [];
  
  const sections = [];
  const articleOrder = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
  
  for (const key of articleOrder) {
    if (articles[key]) {
      const article = articles[key];
      sections.push({
        numero: key,
        titre: article.titre || `Article ${key}`,
        contenu: article.contenu || '',
        alineas: article.alineas || []
      });
    }
  }
  
  if (articles.personnalises && Array.isArray(articles.personnalises)) {
    for (const art of articles.personnalises) {
      sections.push({
        numero: art.numero || 'Perso',
        titre: art.titre || 'Article personnalisé',
        contenu: art.contenu || '',
        alineas: art.alineas || []
      });
    }
  }
  
  return sections;
};

export const generateWordDocument = (conventionData, partenaires, comites, budget, alertes, uploadedFileInfo) => {
  const articlesList = formatArticles(conventionData.articles || {});
  const articlesPersonnalises = conventionData.articles_personnalises || [];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            bottom: 1440,
            left: 1728, // 1.2 inches
            right: 1728,
          },
        },
      },
      children: [
        // EN-TÊTE
        new Paragraph({
          children: [
            new TextRun({
              text: 'UNIVERSITÉ MOHAMMED V - RABAT',
              size: 28,
              bold: true,
              color: COLORS.headerBg.replace('#', ''),
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: 'CONVENTION DE PARTENARIAT',
              size: 32,
              bold: true,
              color: COLORS.primary.replace('#', ''),
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '═══════════════════════════════════════════════════════════════════════════════',
              size: 20,
              color: COLORS.primary.replace('#', ''),
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),

        // 1. INFORMATIONS GÉNÉRALES
        new Paragraph({
          children: [
            new TextRun({
              text: '1. INFORMATIONS GÉNÉRALES',
              size: 24,
              bold: true,
              color: COLORS.headerBg.replace('#', ''),
              font: 'Arial',
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Champ', bold: true, color: COLORS.headerBg.replace('#', '') })] })],
                  shading: { fill: COLORS.sectionBg.replace('#', '') },
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Valeur', bold: true, color: COLORS.headerBg.replace('#', '') })] })],
                  shading: { fill: COLORS.sectionBg.replace('#', '') },
                  width: { size: 70, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Intitulé')] }),
                new TableCell({ children: [new Paragraph(conventionData.intitule || 'Non renseigné')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Type')] }),
                new TableCell({ children: [new Paragraph(conventionData.type || 'Non renseigné')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Numéro de référence')] }),
                new TableCell({ children: [new Paragraph(conventionData.numero_reference || 'Non renseigné')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Date de signature')] }),
                new TableCell({ children: [new Paragraph(conventionData.date_signature || 'Non renseigné')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Date d'expiration")] }),
                new TableCell({ children: [new Paragraph(conventionData.date_expiration || 'Non renseigné')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Mode de renouvellement')] }),
                new TableCell({ children: [new Paragraph(conventionData.mode_renouvellement || 'Non renseigné')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Statut')] }),
                new TableCell({ 
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: conventionData.statut || 'EN_COURS',
                          color: conventionData.statut === 'TERMINE' ? COLORS.success.replace('#', '') : 
                                  conventionData.statut === 'ANNULE' ? COLORS.danger.replace('#', '') : 
                                  COLORS.warning.replace('#', ''),
                          bold: true,
                        })
                      ]
                    })
                  ] 
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Avec budget')] }),
                new TableCell({ children: [new Paragraph(conventionData.avec_budget ? 'Oui' : 'Non')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Validation conseil')] }),
                new TableCell({ children: [new Paragraph(conventionData.validation_conseil ? 'Oui' : 'Non')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Formation continue')] }),
                new TableCell({ children: [new Paragraph(conventionData.formation_continue ? 'Oui' : 'Non')] }),
              ],
            }),
          ],
        }),
        
        new Paragraph({ spacing: { after: 200 } }),

        // 2. SIGNATAIRES
        new Paragraph({
          children: [
            new TextRun({
              text: '2. SIGNATAIRES',
              size: 24,
              bold: true,
              color: COLORS.headerBg.replace('#', ''),
              font: 'Arial',
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Signataire UM5', bold: true })] })],
                  shading: { fill: COLORS.sectionBg.replace('#', '') },
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph(conventionData.signataire_um5 || 'Non renseigné')],
                  width: { size: 70, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Signataire UM5 (autre)', bold: true })] })],
                  shading: { fill: COLORS.sectionBg.replace('#', '') },
                }),
                new TableCell({
                  children: [new Paragraph(conventionData.signataire_um5_autre || 'Non renseigné')],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Signataire Partenaire', bold: true })] })],
                  shading: { fill: COLORS.sectionBg.replace('#', '') },
                }),
                new TableCell({
                  children: [new Paragraph(conventionData.signataire_partenaire || 'Non renseigné')],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Signataire Partenaire (autre)', bold: true })] })],
                  shading: { fill: COLORS.sectionBg.replace('#', '') },
                }),
                new TableCell({
                  children: [new Paragraph(conventionData.signataire_partenaire_autre || 'Non renseigné')],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { after: 200 } }),

        // 3. PARTENAIRES
        new Paragraph({
          children: [
            new TextRun({
              text: '3. PARTENAIRES',
              size: 24,
              bold: true,
              color: COLORS.headerBg.replace('#', ''),
              font: 'Arial',
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Nom', bold: true, color: COLORS.headerText.replace('#', '') })] })],
                  shading: { fill: COLORS.headerBg.replace('#', '') },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Type', bold: true, color: COLORS.headerText.replace('#', '') })] })],
                  shading: { fill: COLORS.headerBg.replace('#', '') },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Ville', bold: true, color: COLORS.headerText.replace('#', '') })] })],
                  shading: { fill: COLORS.headerBg.replace('#', '') },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: 'Pays', bold: true, color: COLORS.headerText.replace('#', '') })] })],
                  shading: { fill: COLORS.headerBg.replace('#', '') },
                }),
              ],
            }),
            ...(partenaires || []).filter(p => p.nom).map(p => 
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(p.nom || '')] }),
                  new TableCell({ children: [new Paragraph(p.type || '')] }),
                  new TableCell({ children: [new Paragraph(p.ville || '')] }),
                  new TableCell({ children: [new Paragraph(p.pays || 'Maroc')] }),
                ],
              })
            ),
          ],
        }),

        new Paragraph({ spacing: { after: 200 } }),

        // 4. MOTS-CLÉS
        new Paragraph({
          children: [
            new TextRun({
              text: '4. MOTS-CLÉS',
              size: 24,
              bold: true,
              color: COLORS.headerBg.replace('#', ''),
              font: 'Arial',
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: (conventionData.mots_cles || []).join(' • ') || 'Aucun mot-clé',
              size: 20,
              color: COLORS.text.replace('#', ''),
            }),
          ],
        }),

        new Paragraph({ spacing: { after: 200 } }),

        // 5. ARTICLES
        new Paragraph({
          children: [
            new TextRun({
              text: '5. ARTICLES DE LA CONVENTION',
              size: 24,
              bold: true,
              color: COLORS.headerBg.replace('#', ''),
              font: 'Arial',
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        ...articlesList.map(article => [
          new Paragraph({
            children: [
              new TextRun({
                text: `Article ${article.numero} : ${article.titre}`,
                size: 20,
                bold: true,
                color: COLORS.primary.replace('#', ''),
                font: 'Arial',
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          ...(article.contenu ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: article.contenu,
                  size: 18,
                  color: COLORS.text.replace('#', ''),
                }),
              ],
              spacing: { after: 100 },
            }),
          ] : []),
          ...(article.alineas && article.alineas.length > 0 ? 
            article.alineas.map((alinea, index) => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. ${alinea}`,
                    size: 18,
                    color: COLORS.text.replace('#', ''),
                  }),
                ],
                spacing: { after: 50 },
              })
            ) 
          : []),
          new Paragraph({ spacing: { after: 50 } }),
        ]).flat(),

        // Articles personnalisés
        ...(articlesPersonnalises && articlesPersonnalises.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Articles personnalisés',
                size: 22,
                bold: true,
                color: COLORS.accent.replace('#', ''),
                font: 'Arial',
              }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          ...articlesPersonnalises.map((art, index) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Article ${art.numero || index + 1} : ${art.titre || 'Article personnalisé'}`,
                  size: 20,
                  bold: true,
                  color: COLORS.secondary.replace('#', ''),
                  font: 'Arial',
                }),
              ],
              spacing: { before: 150, after: 100 },
            }),
            ...(art.contenu ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: art.contenu,
                    size: 18,
                    color: COLORS.text.replace('#', ''),
                  }),
                ],
                spacing: { after: 100 },
              }),
            ] : []),
            ...(art.alineas && art.alineas.length > 0 ?
              art.alineas.map((alinea, idx) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${idx + 1}. ${alinea}`,
                      size: 18,
                      color: COLORS.text.replace('#', ''),
                    }),
                  ],
                  spacing: { after: 50 },
                })
              )
            : []),
            new Paragraph({ spacing: { after: 50 } }),
          ]).flat(),
        ] : []),

        new Paragraph({ spacing: { after: 200 } }),

        // 6. COMITÉS
        ...(comites && comites.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: '6. COMITÉS',
                size: 24,
                bold: true,
                color: COLORS.headerBg.replace('#', ''),
                font: 'Arial',
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),
          ...comites.map(comite => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${comite.nom || 'Comité'}`,
                  size: 20,
                  bold: true,
                  color: COLORS.primary.replace('#', ''),
                }),
              ],
              spacing: { after: 80 },
            }),
            ...(comite.membres && comite.membres.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `  Membres: ${comite.membres.join(', ')}`,
                    size: 18,
                    color: COLORS.text.replace('#', ''),
                  }),
                ],
                spacing: { after: 50 },
              }),
            ] : []),
          ]).flat(),
          new Paragraph({ spacing: { after: 200 } }),
        ] : []),

        // 7. BUDGET
        ...(budget ? [
          new Paragraph({
            children: [
              new TextRun({
                text: '7. BUDGET',
                size: 24,
                bold: true,
                color: COLORS.headerBg.replace('#', ''),
                font: 'Arial',
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Champ', bold: true, color: COLORS.headerText.replace('#', '') })] })],
                    shading: { fill: COLORS.headerBg.replace('#', '') },
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Valeur', bold: true, color: COLORS.headerText.replace('#', '') })] })],
                    shading: { fill: COLORS.headerBg.replace('#', '') },
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Montant total')] }),
                  new TableCell({ children: [new Paragraph(budget.montant_total ? `${budget.montant_total} MAD` : 'Non renseigné')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Budget UM5')] }),
                  new TableCell({ children: [new Paragraph(budget.budget_um5 ? `${budget.budget_um5} MAD` : 'Non renseigné')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Budget Partenaire')] }),
                  new TableCell({ children: [new Paragraph(budget.budget_partenaire ? `${budget.budget_partenaire} MAD` : 'Non renseigné')] }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 200 } }),
        ] : []),

        // 8. ALERTES
        ...(alertes && (alertes.auto?.length > 0 || alertes.manual?.length > 0) ? [
          new Paragraph({
            children: [
              new TextRun({
                text: '8. ALERTES',
                size: 24,
                bold: true,
                color: COLORS.headerBg.replace('#', ''),
                font: 'Arial',
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),
          ...(alertes.auto?.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Alertes automatiques:',
                  size: 20,
                  bold: true,
                  color: COLORS.primary.replace('#', ''),
                }),
              ],
              spacing: { after: 100 },
            }),
            ...alertes.auto.map(alerte => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `  • ${alerte}`,
                    size: 18,
                    color: COLORS.warning.replace('#', ''),
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
          ] : []),
          ...(alertes.manual?.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Alertes manuelles:',
                  size: 20,
                  bold: true,
                  color: COLORS.primary.replace('#', ''),
                }),
              ],
              spacing: { before: 100, after: 100 },
            }),
            ...alertes.manual.map(alerte => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `  • ${alerte}`,
                    size: 18,
                    color: COLORS.text.replace('#', ''),
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
          ] : []),
          new Paragraph({ spacing: { after: 200 } }),
        ] : []),

        // PIED DE PAGE
        new Paragraph({
          children: [
            new TextRun({
              text: '─────────────────────────────────────────────────────────────',
              size: 16,
              color: COLORS.border.replace('#', ''),
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Document généré le ${new Date().toLocaleString('fr-FR')}`,
              size: 16,
              color: COLORS.border.replace('#', ''),
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'UM5 - Direction des Partenariats',
              size: 16,
              bold: true,
              color: COLORS.primary.replace('#', ''),
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
        }),
      ],
    }],
  });

  return doc;
};

export const exportConventionToWord = async (conventionData, partenaires, comites, budget, alertes, uploadedFileInfo, fileName = 'convention.docx') => {
  try {
    const doc = generateWordDocument(conventionData, partenaires, comites, budget, alertes, uploadedFileInfo);
    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'exportation Word:', error);
    return { success: false, error: error.message };
  }
};