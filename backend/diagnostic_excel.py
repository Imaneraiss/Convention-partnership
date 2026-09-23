"""
Diagnostic : affiche tous les noms de colonnes de l'Excel.
Utilisation : python diagnostic_excel.py /app/conventions.xlsx
"""
import sys
import pandas as pd
from pathlib import Path

def main(excel_path):
    print(f"\n{'=' * 70}")
    print(f"📂 Fichier : {excel_path}")
    print(f"{'=' * 70}\n")
    
    xls = pd.ExcelFile(excel_path)
    print(f"📄 Feuilles : {xls.sheet_names}\n")
    
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet)
        print(f"\n{'─' * 70}")
        print(f"📋 Feuille : {sheet} ({len(df)} lignes)")
        print(f"{'─' * 70}")
        print(f"\n🔍 Colonnes ({len(df.columns)}) :")
        for i, col in enumerate(df.columns):
            # Afficher les 40 premiers caractères + longueur exacte
            col_str = str(col)
            print(f"   {i+1:2d}. [{len(col_str):3d}] {repr(col_str)}")
        
        # Afficher la 1ère ligne pour vérifier les valeurs
        if len(df) > 0:
            print(f"\n📊 Première ligne (aperçu) :")
            for col in df.columns[:10]:  # Les 10 premières colonnes
                val = df.iloc[0][col]
                val_str = str(val)[:60] if pd.notna(val) else "NULL"
                print(f"   {repr(str(col)):40s} = {val_str}")
            print("   ...")
        print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage : python diagnostic_excel.py /app/conventions.xlsx")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    if not Path(excel_path).exists():
        print(f"❌ Fichier introuvable : {excel_path}")
        sys.exit(1)
    
    main(excel_path)