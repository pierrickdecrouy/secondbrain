import sqlite3
import re
import os
import glob

# Regex pour capturer la partie intéressante après l'UUID et le chiffre d'index
# Ex: "7A88E58D-Ff07-4Dc6-9477-Ee57F587510E 2 Cours 9 - Hypersensibilites"
# Groupe 1: "Cours 9 - Hypersensibilites"
CLEAN_REGEX = re.compile(r"^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}\s+\d+\s+(.*)$")

def clean_database(db_path):
    print(f"\nNettoyage de la base de données : {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Récupérer tous les noms de cours uniques
        cursor.execute("SELECT DISTINCT course_name FROM documents")
        courses = cursor.fetchall()
        
        updates = 0
        for row in courses:
            raw_name = row[0]
            if not raw_name:
                continue
                
            match = CLEAN_REGEX.match(raw_name)
            if match:
                clean_name = match.group(1).strip()
                
                # Mise à jour de tous les documents ayant ce course_name "sale"
                cursor.execute(
                    "UPDATE documents SET course_name = ? WHERE course_name = ?",
                    (clean_name, raw_name)
                )
                updates += cursor.rowcount
                print(f"  [CORRIGÉ] '{raw_name[:20]}...' -> '{clean_name}'")
        
        conn.commit()
        if updates > 0:
            print(f"✅ Terminé ! {updates} documents mis à jour.")
        else:
            print("✅ Aucun nom de cours 'sale' n'a été trouvé/mis à jour.")
            
    except sqlite3.OperationalError as e:
        print(f"Erreur d'accès à la table : {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    # Chercher les fichiers .sqlite dans le dossier outputs/
    db_files = glob.glob("outputs/*.sqlite")
    if not db_files:
        print("Aucun fichier .sqlite trouvé dans le dossier outputs/.")
        # Fallback pour demander le chemin
        db_path = input("Veuillez entrer le chemin vers votre base de données SQLite : ").strip()
        if os.path.exists(db_path):
            clean_database(db_path)
        else:
            print("Le fichier spécifié n'existe pas.")
    else:
        for db_file in db_files:
            clean_database(db_file)
