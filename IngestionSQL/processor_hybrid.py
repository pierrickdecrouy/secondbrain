import os
import sys

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
sys.modules['google._upb._message'] = None

import sqlite3
import sqlite_vec
import json
import uuid
import time
import hashlib
import requests
import fitz
from google import genai
from google.genai import types
import unicodedata
import re

# Liste des modèles par ordre de priorité (Fallback)
FALLBACK_MODELS = [
    'gemini-3.5-flash',      # Le tout nouveau standard hyper performant
    'gemini-3.5-flash-lite', # La version très légère et ultra rapide
    'gemini-3.1-flash-lite', # Très bonne ressource (500 requêtes/jour)
    'gemini-3-flash',        # Le modèle rapide de génération précédente
    'gemini-2.5-flash',      # Modèle très éprouvé
    'gemini-1.5-flash'       # Le standard très stable en dernier recours
]

def generate_hash(course_name, page_number, item_type, title, content):
    """Génère une empreinte unique pour la déduplication"""
    data = f"{course_name}_{page_number}_{item_type}_{title}_{content}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def normalize_content_type(raw_type):
    if not raw_type: return "notion"
    normalized = ''.join(c for c in unicodedata.normalize('NFD', raw_type.lower()) if unicodedata.category(c) != 'Mn')
    return normalized.strip()

def fix_pdf_text(text):
    if not text: return ""
    mapping = {
        "´e": "é", "`e": "è", "ˆe": "ê", "¨e": "ë",
        "´a": "à", "`a": "à", "ˆa": "â",
        "´o": "ó", "`o": "ò", "ˆo": "ô",
        "´i": "í", "`i": "ì", "ˆi": "î", "¨i": "ï",
        "´u": "ú", "`u": "ù", "ˆu": "û", "¨u": "ü",
        "¸c": "ç", "’": "'"
    }
    for k, v in mapping.items():
        text = text.replace(k, v)
    return text

def create_database(db_path):
    conn = sqlite3.connect(db_path)
    
    # Charger l'extension sqlite-vec pour la recherche sémantique
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    
    cursor = conn.cursor()
    # Ajout de content_hash en UNIQUE pour empêcher les doublons
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            content_hash TEXT UNIQUE,
            course_name TEXT,
            page_number INTEGER,
            content_type TEXT,
            title TEXT,
            content TEXT,
            created_at INTEGER
        )
    ''')
    
    # Index pour accélérer le filtrage par cours dans l'interface
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_course_name ON documents(course_name)')
    
    # Table vectorielle pour les embeddings
    cursor.execute('''
        CREATE VIRTUAL TABLE IF NOT EXISTS document_embeddings USING vec0(
            document_id TEXT PRIMARY KEY,
            embedding float[768]
        )
    ''')
    
    conn.commit()
    return conn

def log_message(file_path, msg):
    print(msg)
    log_file = os.path.join(os.path.dirname(file_path), "ingestion_hybrid.log")
    with open(log_file, "a") as logf:
        logf.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")

def call_ollama_local(prompt, model_name="llama3.1"):
    """Appelle l'API Ollama locale pour structurer le texte en JSON"""
    url = "http://localhost:11434/api/generate"
    data = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    try:
        response = requests.post(url, json=data, timeout=600)
        response.raise_for_status()
        return response.json().get('response', '')
    except Exception as e:
        print(f"Erreur Ollama: {e}")
        return None

def get_embedding(text):
    """Demande à Ollama de générer un vecteur (embedding) pour le texte"""
    url = "http://localhost:11434/api/embeddings"
    data = {
        "model": "nomic-embed-text",
        "prompt": text
    }
    try:
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        return response.json().get('embedding', [])
    except Exception as e:
        print(f"Erreur d'embedding: {e}")
        return []

def process_pdf(file_path, output_path, api_key, ollama_model, progress_callback):
    """
    Pipeline Hybride :
    1. Détection d'images (Schémas) localement via pypdf
    2. Si image -> API Gemini (Fallback)
    3. Si texte pur -> Nettoyage et insertion directe (Ultra-rapide)
    4. Déduplication par Hash
    """
    progress_callback(5, "Initialisation (Mode Hybride & Déduplication)...")
    client = genai.Client(api_key=api_key)
    
    progress_callback(10, "Lecture du document PDF (PyMuPDF)...")
    doc = fitz.open(file_path)
    total_pages = len(doc)
    
    base_name = os.path.basename(file_path).replace('.pdf', '')
    # Retirer l'UUID Notion (ex: 42Cb2981-59Bc-41Bc-8B14-C06Ea054E514) pour éviter la casse cassée
    base_name = re.sub(r'[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}', '', base_name)
    base_title = base_name.replace('_', ' ').strip().title()
    
    conn = create_database(output_path)
    cursor = conn.cursor()
    
    base_prompt = """
Tu es un professeur de médecine et pharmacie extrêmement rigoureux.
Voici une page numérisée d'un cours médical (tu as accès au visuel du PDF et au texte brut extrait).

Ton but est de réaliser une extraction **ULTRA-EXHAUSTIVE** de la page.
Tu dois extraire l'information pertinente, la structurer, sans JAMAIS omettre un détail médical, une exception, une petite ligne ou une note de bas de page.

RÈGLES IMPORTANTES :
1. Tu DOIS renvoyer ta réponse sous forme d'un tableau JSON contenant un ou plusieurs objets.
2. Chaque objet doit avoir la structure suivante :
   {
      "title": "Titre explicite",
      "content": "Contenu formaté en Markdown. Utilise des puces, du gras pour les mots clés.",
      "type": "notion", "definition", "schema", "table", "exercice" ou "correction"
   }
3. **FILTRAGE DU BRUIT :** IGNORE les numéros de page, en-têtes, pieds de page.
4. **EXHAUSTIVITÉ ABSOLUE :** Tu DOIS être maniaque sur les détails. N'oublie aucune exception, aucune valeur numérique, aucune précision. Si tu omets un détail, l'étudiant pourrait rater son concours.
5. **TRAITEMENT DES SCHÉMAS/TABLEAUX :** S'il y a des SCHÉMAS ou TABLEAUX, crée un objet distinct avec "type": "schema" ou "table". Le "content" doit être une DESCRIPTION TEXTUELLE HYPER-DÉTAILLÉE de toutes les légendes et interactions du schéma.

Renvoie UNIQUEMENT le tableau JSON, sans aucun autre texte autour.
"""

    temp_folder = os.path.join(os.path.dirname(file_path), "temp_pages_hyb")
    os.makedirs(temp_folder, exist_ok=True)
    
    inserted_count = 0
    ignored_count = 0
    start_model_idx = 0

    for i in range(total_pages):
        page_num = i + 1
        progress = 10 + int((i / total_pages) * 80)
        page = doc[i]
        
        raw_text = page.get_text() or ""
        
        # Heuristique locale via PyMuPDF : Filtrage des images/schémas
        images_info = page.get_images(full=True)
        has_useful_images = False
        
        for img in images_info:
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                if base_image:
                    w = base_image.get("width", 0)
                    h = base_image.get("height", 0)
                    if w > 150 and h > 150:
                        has_useful_images = True
                        break
            except:
                pass
                
        if not has_useful_images:
            # ---------------------------------------------------------
            # FLUX 1 : TEXTE PUR (Modèles Textes Haute Capacité via API)
            # ---------------------------------------------------------
            if len(raw_text.strip()) > 50:
                text_model = "gemma-4-31b-it" # Utilisation du modèle de l'utilisateur avec gros quota
                progress_callback(progress, f"Page {page_num}/{total_pages} - Texte pur (Formatage {text_model})...")
                
                text_prompt = f"""
Tu es un expert médical. Ton but est de segmenter et formater ce texte brut extrait d'un PDF de manière ULTRA-EXHAUSTIVE.
Tu dois l'organiser par concepts logiques (notions et définitions). N'oublie AUCUN détail, exception, ou valeur numérique.

RÈGLES:
1. Renvoie un tableau JSON strict contenant un ou plusieurs objets.
2. Structure d'un objet : {{"title": "Titre", "content": "Contenu Markdown (avec puces et gras)", "type": "notion", "definition", "exercice" ou "correction"}}
3. STYLE D'ÉCRITURE : Ton pédagogue et académique. Sois EXHAUSTIF sur les détails médicaux, cliniques et scientifiques. Ne perds aucune information technique.
4. Filtre les bruits (numéros de page, en-têtes).

TEXTE BRUT :
{raw_text}
"""
                json_response = None
                max_text_retries = 3
                for attempt in range(max_text_retries):
                    try:
                        # Envoi au modèle Gemma via l'API client GenAI
                        response = client.models.generate_content(
                            model=text_model,
                            contents=text_prompt,
                            config=types.GenerateContentConfig(response_mime_type="application/json")
                        )
                        json_response = response.text
                        break # Succès
                    except Exception as e:
                        err_str = str(e)
                        log_message(file_path, f"Erreur API Modèle Texte page {page_num} (Essai {attempt+1}/{max_text_retries}): {e}")
                        if "503" in err_str or "429" in err_str:
                            time.sleep(15 * (attempt + 1)) # Backoff de 15s, 30s...
                        else:
                            break # Autre erreur fatale, on passe au fallback local
                            
                if not json_response:
                    log_message(file_path, f"Fallback sur Ollama pour la page {page_num}...")
                    json_response = call_ollama_local(text_prompt, model_name=ollama_model)
                
                extracted_items = []
                if json_response:
                    cleaned_response = json_response.strip()
                    if cleaned_response.startswith("```json"): cleaned_response = cleaned_response[7:]
                    elif cleaned_response.startswith("```"): cleaned_response = cleaned_response[3:]
                    if cleaned_response.endswith("```"): cleaned_response = cleaned_response[:-3]
                    cleaned_response = cleaned_response.strip()
                    try:
                        extracted_items = json.loads(cleaned_response, strict=False)
                        if isinstance(extracted_items, dict): extracted_items = [extracted_items]
                    except Exception as e:
                        log_message(file_path, f"JSON Error page {page_num}: {e}")
                
                # Fallback brutal
                if not extracted_items:
                    cleaned_text = raw_text.replace('\x00', '')
                    extracted_items = [{
                        "title": f"{base_title} - Texte Brut",
                        "content": cleaned_text,
                        "type": "notion"
                    }]

                for item in extracted_items:
                    item_type = normalize_content_type(item.get("type", "notion"))
                    item_title = fix_pdf_text(item.get("title", f"{base_title} - Partie {page_num}"))
                    item_content = fix_pdf_text(item.get("content", ""))
                    
                    if len(item_content.strip()) < 100: continue
                    
                    content_hash = generate_hash(base_title, page_num, item_type, item_title, item_content)
                    doc_id = str(uuid.uuid4())
                    
                    try:
                        cursor.execute('''
                            INSERT OR IGNORE INTO documents (id, content_hash, course_name, page_number, content_type, title, content, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (doc_id, content_hash, base_title, page_num, item_type, item_title, item_content, int(time.time())))
                        
                        if cursor.rowcount > 0: 
                            inserted_count += 1
                            emb = get_embedding(item_title + "\n" + item_content)
                            if emb:
                                cursor.execute('''
                                    INSERT INTO document_embeddings (document_id, embedding)
                                    VALUES (?, ?)
                                ''', (doc_id, json.dumps(emb)))
                        else: 
                            ignored_count += 1
                            
                        conn.commit()
                    except Exception as ex:
                        log_message(file_path, f"Exception insertion page {page_num}: {ex}")
            else:
                progress_callback(progress, f"Page {page_num}/{total_pages} - Page vide ignorée.")
                
        else:
            # ---------------------------------------------------------
            # FLUX 2 : SCHÉMAS/IMAGES (API GEMINI AVEC FALLBACK)
            # ---------------------------------------------------------
            current_prompt = base_prompt + "\n\n=== TEXTE BRUT EXTRAIT ===\n" + raw_text
            
            # Isoler la page courante via PyMuPDF
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=i, to_page=i)
            temp_pdf_path = os.path.join(temp_folder, f"temp_page_{page_num}.pdf")
            new_doc.save(temp_pdf_path)
            new_doc.close()
            
            with open(temp_pdf_path, "rb") as f:
                pdf_data = f.read()
                
            success = False
            content_text = ""
            used_model = ""
            
            for model_idx in range(start_model_idx, len(FALLBACK_MODELS)):
                model_name = FALLBACK_MODELS[model_idx]
                
                max_retries = 1
                model_success = False
                
                for attempt in range(max_retries + 1):
                    try:
                        progress_callback(progress, f"Page {page_num}/{total_pages} (Schéma) - {model_name} (Essai {attempt+1})...")
                        
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
                            model_success = True
                            success = True
                            used_model = model_name
                            break
                        
                    except Exception as e:
                        err_str = str(e).lower()
                        err_msg = f"Échec API {model_name} (Page {page_num}, Essai {attempt+1}): {e}"
                        log_message(file_path, err_msg)
                        
                        if "429" in err_str:
                            if "quota" in err_str or "exhausted" in err_str:
                                log_message(file_path, f"Quota journalier (RPD) atteint pour {model_name}.")
                                break # On ne retente pas, on passe au modèle suivant
                            else:
                                if attempt < max_retries:
                                    progress_callback(progress, f"Limite RPM sur {model_name}. Pause 60s...")
                                    time.sleep(60)
                                    continue
                        
                        if attempt < max_retries:
                            time.sleep(5)
                
                if model_success:
                    break
                    
                # Si le modèle a échoué (RPD ou échec des retrys), on le dégrade définitivement
                start_model_idx = model_idx + 1
                
                if model_idx < len(FALLBACK_MODELS) - 1:
                    progress_callback(progress, f"Échec {model_name}. Le programme mémorise et passe au modèle suivant...")
                    time.sleep(2)
            
            if success and content_text:
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
                        item_type = normalize_content_type(item.get("type", "text"))
                        item_title = fix_pdf_text(item.get("title", f"{base_title} - Partie {page_num}"))
                        item_content = fix_pdf_text(item.get("content", ""))
                        
                        if len(item_content.strip()) < 100:
                            continue 
                            
                        # Déduplication
                        content_hash = generate_hash(base_title, page_num, item_type, item_title, item_content)
                        doc_id = str(uuid.uuid4())
                            
                        cursor.execute('''
                            INSERT OR IGNORE INTO documents (id, content_hash, course_name, page_number, content_type, title, content, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            doc_id,
                            content_hash,
                            base_title,
                            page_num,
                            item_type,
                            item_title,
                            item_content,
                            int(time.time())
                        ))
                        if cursor.rowcount > 0:
                            inserted_count += 1
                            # Génération et insertion du vecteur sémantique
                            emb = get_embedding(item_title + "\n" + item_content)
                            if emb:
                                cursor.execute('''
                                    INSERT INTO document_embeddings (document_id, embedding)
                                    VALUES (?, ?)
                                ''', (doc_id, json.dumps(emb)))
                        else:
                            ignored_count += 1
                            
                    conn.commit()
                except json.JSONDecodeError as json_err:
                    log_message(file_path, f"Erreur JSON page {page_num} ({used_model}): {json_err}")
                except Exception as ex:
                    log_message(file_path, f"Erreur SQLite page {page_num}: {ex}")
            
            try:
                os.remove(temp_pdf_path)
            except:
                pass
                
            # Rate limiting API uniquement pour les appels API
            time.sleep(4)
                
    conn.close()
    try:
        os.rmdir(temp_folder)
    except:
        pass
        
    final_msg = f"Terminé ! {inserted_count} éléments ajoutés, {ignored_count} doublons ignorés."
    log_message(file_path, final_msg)
    progress_callback(100, final_msg)
