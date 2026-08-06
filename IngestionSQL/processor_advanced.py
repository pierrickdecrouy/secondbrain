import os
import sys

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
sys.modules['google._upb._message'] = None

import sqlite3
import json
import uuid
import time
from google import genai
from google.genai import types
from pypdf import PdfReader, PdfWriter

# Liste des modèles par ordre de priorité (Fallback)
# En cas d'erreur avec le premier, le script tentera avec le second, etc.
FALLBACK_MODELS = [
    'gemini-3.5-flash',      # Le tout nouveau standard hyper performant
    'gemini-3.5-flash-lite', # La version très légère et ultra rapide (idéale en secours)
    'gemini-3-flash',        # Le modèle rapide de génération précédente
    'gemini-2.5-flash',      # Modèle très éprouvé
    'gemini-1.5-flash'       # Le standard très stable en dernier recours
]

def create_database(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            course_name TEXT,
            page_number INTEGER,
            content_type TEXT,
            title TEXT,
            content TEXT,
            created_at INTEGER
        )
    ''')
    conn.commit()
    return conn

def log_message(file_path, msg):
    print(msg)
    log_file = os.path.join(os.path.dirname(file_path), "ingestion_advanced.log")
    with open(log_file, "a") as logf:
        logf.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")

def process_pdf(file_path, output_path, api_key, progress_callback):
    """
    Pipeline d'ingestion avancé avec OCR Intelligent, Second Tri et Fallback multi-modèles.
    """
    progress_callback(5, "Initialisation de Gemini (Mode Avancé)...")
    client = genai.Client(api_key=api_key)
    
    progress_callback(10, "Lecture du document PDF...")
    reader = PdfReader(file_path)
    total_pages = len(reader.pages)
    
    base_title = os.path.basename(file_path).replace('.pdf', '').replace('_', ' ').title()
    
    conn = create_database(output_path)
    cursor = conn.cursor()
    
    base_prompt = """
Tu es un assistant expert en médecine, pharmacie et structuration de la donnée.
Voici une page numérisée d'un cours médical (tu as accès au visuel du PDF et à un texte brut extrait par OCR basique).

Ton but est de réaliser un **SECOND TRI INTELLIGENT**. Tu dois extraire l'information pertinente, la structurer, ET ignorer tout le bruit.

RÈGLES IMPORTANTES :
1. Tu DOIS renvoyer ta réponse sous forme d'un tableau JSON contenant un ou plusieurs objets.
2. Chaque objet doit avoir la structure suivante :
   {
      "title": "Titre explicite du concept ou de la section",
      "content": "Contenu formaté en Markdown clair, avec des puces et du gras",
      "type": "text" ou "schema" ou "table"
   }
3. **FILTRAGE DU BRUIT (TRÈS IMPORTANT) :** 
   - IGNORE complètement les numéros de page, les en-têtes de chapitres répétés, les pieds de page, les mentions de droits d'auteur, et les notes inutiles. Ne les inclus PAS dans le JSON.
4. **TRAITEMENT DU TEXTE :** Sers-toi du texte brut fourni pour ne rien oublier du contenu pertinent, et crée un ou plusieurs objets avec "type": "text".
5. **TRAITEMENT DES SCHÉMAS/TABLEAUX :** Regarde bien le visuel du PDF : si tu y vois des SCHÉMAS, des ARBRES DÉCISIONNELS, ou des TABLEAUX COMPLEXES, crée un objet distinct pour CHACUN d'eux avec "type": "schema" ou "table".
   - Le "title" doit commencer par "Schéma : " ou "Tableau : ".
   - Le "content" doit être une DESCRIPTION TEXTUELLE HYPER-DÉTAILLÉE et EXHAUSTIVE (étapes, liens logiques, pathologies, traitements, etc.).

Renvoie UNIQUEMENT le tableau JSON, sans aucun autre texte autour. Assure-toi que le JSON est valide.
"""

    temp_folder = os.path.join(os.path.dirname(file_path), "temp_pages_adv")
    os.makedirs(temp_folder, exist_ok=True)

    for i in range(total_pages):
        page_num = i + 1
        progress = 10 + int((i / total_pages) * 80)
        
        # Extraction du texte brut de la page pour aider l'IA
        raw_text = reader.pages[i].extract_text()
        current_prompt = base_prompt + "\n\n=== TEXTE BRUT EXTRAIT DE LA PAGE ===\n" + (raw_text if raw_text else "(Aucun texte brut détecté, base-toi uniquement sur l'image)")
        
        # Isoler la page courante dans un PDF temporaire
        writer = PdfWriter()
        writer.add_page(reader.pages[i])
        temp_pdf_path = os.path.join(temp_folder, f"temp_page_{page_num}.pdf")
        
        with open(temp_pdf_path, "wb") as f:
            writer.write(f)
            
        with open(temp_pdf_path, "rb") as f:
            pdf_data = f.read()
            
        # ---------------------------------------------------------
        # MÉCANISME DE CASCADE (FALLBACK) MULTI-MODÈLES
        # ---------------------------------------------------------
        success = False
        content_text = ""
        used_model = ""
        
        for model_idx, model_name in enumerate(FALLBACK_MODELS):
            try:
                progress_callback(progress, f"Page {page_num}/{total_pages} - Analyse avec {model_name}...")
                
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        current_prompt,
                        types.Part.from_bytes(data=pdf_data, mime_type="application/pdf")
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                
                content_text = response.text
                if content_text:
                    success = True
                    used_model = model_name
                    break # Sortir de la boucle de fallback, succès !
                
            except Exception as e:
                err_msg = f"Échec avec {model_name} sur la page {page_num}: {e}"
                log_message(file_path, err_msg)
                
                if model_idx < len(FALLBACK_MODELS) - 1:
                    progress_callback(progress, f"Échec {model_name}. Passage au modèle suivant...")
                    time.sleep(2) # Petite pause avant de réessayer avec le suivant
                else:
                    log_message(file_path, f"TOUS LES MODÈLES ONT ÉCHOUÉ pour la page {page_num}.")
        
        # ---------------------------------------------------------
        # TRAITEMENT DU RÉSULTAT
        # ---------------------------------------------------------
        if success and content_text:
            log_message(file_path, f"Page {page_num} traitée avec succès par {used_model}.")
            
            # Nettoyage du texte renvoyé par Gemini
            cleaned_text = content_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            try:
                extracted_items = json.loads(cleaned_text)
                if isinstance(extracted_items, dict):
                    extracted_items = [extracted_items]
                    
                for item in extracted_items:
                    item_type = item.get("type", "text")
                    item_title = item.get("title", f"{base_title} - Partie {page_num}")
                    item_content = item.get("content", "")
                    
                    if len(item_content.strip()) < 10:
                        continue 
                        
                    cursor.execute('''
                        INSERT INTO documents (id, course_name, page_number, content_type, title, content, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        str(uuid.uuid4()),
                        base_title,
                        page_num,
                        item_type,
                        item_title,
                        item_content,
                        int(time.time() * 1000)
                    ))
                conn.commit()
            except json.JSONDecodeError as json_err:
                err_msg = f"Erreur de parsing JSON sur la page {page_num} (Modèle {used_model}): {json_err}"
                log_message(file_path, err_msg)
            except Exception as ex:
                log_message(file_path, f"Exception lors de l'insertion page {page_num}: {ex}")
                
        # Nettoyage fichier temporaire
        try:
            os.remove(temp_pdf_path)
        except:
            pass
            
        # Rate limiting : On attend pour ne pas saturer le quota, 
        # surtout si on a switché sur un modèle plus petit ou qu'on tourne vite.
        time.sleep(4)
                
    conn.close()
    try:
        os.rmdir(temp_folder)
    except:
        pass
        
    progress_callback(100, "Base de données SQL générée avec succès (Mode Avancé) !")
