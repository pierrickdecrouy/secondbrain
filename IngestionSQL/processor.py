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

def process_pdf(file_path, output_path, api_key, progress_callback):
    """
    1. Ouvre le PDF et le découpe page par page (sans librairie C)
    2. Upload la page temporairement sur Gemini
    3. Envoie un prompt pour extraire le texte ET isoler les schémas via JSON structuré
    4. Compile le tout dans une base de données SQLite optimisée RAG
    """
    progress_callback(5, "Initialisation de Gemini (Mode Natif)...")
    # Initialisation du client officiel Google GenAI
    client = genai.Client(api_key=api_key)
    progress_callback(10, "Lecture du document PDF...")
    reader = PdfReader(file_path)
    total_pages = len(reader.pages)
    
    base_title = os.path.basename(file_path).replace('.pdf', '').replace('_', ' ').title()
    
    conn = create_database(output_path)
    cursor = conn.cursor()
    
    base_prompt = """
Tu es un assistant expert en médecine et pharmacie.
Voici une page d'un cours médical (tu as accès au visuel du PDF et au texte brut extrait).
Ton but est d'extraire toutes les connaissances et de les structurer pour une base de données.

RÈGLES IMPORTANTES :
1. Tu DOIS renvoyer ta réponse sous forme d'un tableau JSON contenant un ou plusieurs objets.
2. Chaque objet doit avoir la structure suivante :
   {
      "title": "Titre explicite du concept ou de la section",
      "content": "Contenu formaté en Markdown clair, avec des puces et du gras",
      "type": "text" ou "schema" ou "table"
   }
3. Pour le texte général de la page, sers-toi du texte brut fourni ci-dessous pour ne rien oublier, et crée un ou plusieurs objets avec "type": "text".
4. Regarde le visuel du PDF : si tu y vois des SCHÉMAS, des ARBRES DÉCISIONNELS, ou des TABLEAUX COMPLEXES, crée un objet distinct pour CHACUN d'eux avec "type": "schema" ou "table".
   - Le "title" doit commencer par "Schéma : " ou "Tableau : ".
   - Le "content" doit être une DESCRIPTION TEXTUELLE HYPER-DÉTAILLÉE et EXHAUSTIVE du schéma ou tableau (étapes, liens logiques, pathologies, traitements, etc.) car c'est une notion à part entière.

Renvoie UNIQUEMENT le tableau JSON, sans aucun autre texte autour.
"""

    temp_folder = os.path.join(os.path.dirname(file_path), "temp_pages")
    os.makedirs(temp_folder, exist_ok=True)

    for i in range(total_pages):
        page_num = i + 1
        progress = 10 + int((i / total_pages) * 80)
        progress_callback(progress, f"Analyse structurelle de la page {page_num} sur {total_pages}...")
        
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
            
        try:
            # Envoi direct du PDF en mémoire
            response = client.models.generate_content(
                model='gemini-1.5-flash',
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
                # Nettoyage du texte renvoyé par Gemini (qui met souvent des balises ```json ... ```)
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
                    err_msg = f"Erreur de parsing JSON sur la page {page_num}: {json_err}\nTexte nettoyé:\n{cleaned_text}\nTexte original:\n{content_text}\n"
                    print(err_msg)
                    with open(os.path.join(os.path.dirname(file_path), "ingestion.log"), "a") as logf:
                        logf.write(err_msg + "\n")
                except Exception as ex:
                    with open(os.path.join(os.path.dirname(file_path), "ingestion.log"), "a") as logf:
                        logf.write(f"Exception lors de l'insertion page {page_num}: {ex}\n")
                
        except Exception as e:
            err_msg = f"Erreur API Gemini sur la page {page_num}: {e}"
            print(err_msg)
            with open(os.path.join(os.path.dirname(file_path), "ingestion.log"), "a") as logf:
                logf.write(err_msg + "\n")
            time.sleep(2)
        finally:
            # Nettoyage
            try:
                os.remove(temp_pdf_path)
            except:
                pass
                
            # Rate limiting : 15 requêtes par minute (niveau gratuit de Flash)
            # On attend 4 secondes entre chaque page pour ne pas saturer le quota.
            time.sleep(4)
                
    conn.close()
    try:
        os.rmdir(temp_folder)
    except:
        pass
        
    progress_callback(100, "Base de données SQL générée avec succès !")
