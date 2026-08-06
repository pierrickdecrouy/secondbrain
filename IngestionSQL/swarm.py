import sqlite3
import json
import time
import requests
import os
import uuid
import threading
import concurrent.futures
from dotenv import load_dotenv

# Tentative d'import du SDK Google
try:
    from google import genai
    from google.genai import types
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    print("Attention: google-genai n'est pas installé. L'API Gemini ne fonctionnera pas.")

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

OLLAMA_URL = "http://localhost:11434/api/generate"
# DB_PATH par défaut (modifié via UI)
DEFAULT_DB_PATH = "./outputs/PH2-1.sqlite"

# Variables pour le Throttle API et les threads DB
last_api_call_time = 0
API_LOCK = threading.Lock()
DB_WRITE_LOCK = threading.Lock()

def throttle_api(rpm=30):
    """Régulateur de vitesse (Throttle) pour respecter la limite de RPM (Global)."""
    global last_api_call_time
    with API_LOCK:
        wait_time = 60.0 / rpm
        now = time.time()
        elapsed = now - last_api_call_time
        if elapsed < wait_time:
            time.sleep(wait_time - elapsed)
        last_api_call_time = time.time()

def call_ollama_local(prompt, model_name="llama3.1"):
    try:
        data = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        # Augmentation du timeout à 600s (10 min) car les LLMs locaux peuvent 
        # être lents s'il y a du parallélisme ou de très longs textes.
        response = requests.post(OLLAMA_URL, json=data, timeout=600)
        response.raise_for_status()
        return response.json().get('response', '')
    except Exception as e:
        print(f"Erreur Ollama ({model_name}): {e}")
        return None

def call_gemini_api(prompt, model_name="gemini-2.5-flash"):
    if not HAS_GEMINI or not GEMINI_API_KEY:
        print("Erreur: GEMINI_API_KEY non définie.")
        return None
    
    throttle_api(rpm=30)
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    max_retries = 1
    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return response.text
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str:
                if "quota" in err_str or "exhausted" in err_str:
                    print(f"[{model_name}] Quota journalier (RPD) atteint !")
                    return "QUOTA_EXHAUSTED"
                else:
                    if attempt < max_retries:
                        print(f"[{model_name}] Limite RPM atteinte. Pause de 60s...")
                        time.sleep(60)
                        continue
            print(f"Erreur Gemini API ({model_name}): {e}")
            return None
    return None

def extract_json_from_response(raw_response):
    if not raw_response or raw_response == "QUOTA_EXHAUSTED": return None
    cleaned = raw_response.strip()
    if cleaned.startswith("```json"): cleaned = cleaned[7:]
    elif cleaned.startswith("```"): cleaned = cleaned[3:]
    if cleaned.endswith("```"): cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"Erreur parsing JSON: {e}")
        return None


class Agent:
    def __init__(self, name, db_conn, fallback_chain):
        self.name = name
        self.db = db_conn
        self.fallback_chain = fallback_chain
        self.cursor = self.db.cursor()

    def call_llm(self, prompt):
        for config in self.fallback_chain:
            engine = config.get("engine")
            model_name = config.get("model")
            
            if engine == "api":
                raw_response = call_gemini_api(prompt, model_name)
            else:
                raw_response = call_ollama_local(prompt, model_name)
                
            if raw_response == "QUOTA_EXHAUSTED":
                print(f"[{self.name}] Basculement (Fallback) forcé suite au Quota API sur {model_name}...")
                continue
                
            data = extract_json_from_response(raw_response)
            if data is not None:
                return data
                
            print(f"[{self.name}] Échec avec {model_name} ({engine}). Essai du modèle suivant...")
            
        print(f"[{self.name}] Échec total: aucun modèle de la chaîne n'a pu répondre.")
        return None

    def execute_db_write(self, query, params=()):
        """Sécurise les écritures concurrentes dans SQLite"""
        with DB_WRITE_LOCK:
            self.cursor.execute(query, params)
            self.db.commit()

    def update_pipeline_status(self, doc_id, new_status):
        self.execute_db_write("UPDATE documents SET pipeline_status = ? WHERE id = ?", (new_status, doc_id))

    def process(self, doc_id, content_type, title, content):
        raise NotImplementedError()


# ==========================================
# 1. EXAMINATEUR (PENDING -> ANALYZED)
# ==========================================
class ExaminerAgent(Agent):
    def __init__(self, db_conn):
        chain = [
            {"engine": "api", "model": "gemma-4-31b-it"},
            {"engine": "api", "model": "gemma-4-26b-a4b-it"},
            {"engine": "local", "model": "gemma2"}
        ]
        super().__init__("Examiner", db_conn, fallback_chain=chain)

    def process(self, doc_id, content_type, title, content):
        if content_type not in ["notion", "definition"]: return "ANALYZED"
        if len(content) < 100: return "ANALYZED"
        
        # Vérifier si on a un rejet précédent (Boucle de Rétroaction)
        self.cursor.execute("SELECT id, question, answer, rejection_reason FROM flashcards WHERE document_id = ? AND status = 'REJECTED'", (doc_id,))
        rejected = self.cursor.fetchone()
        
        if rejected:
            fc_id, old_q, old_a, reason = rejected
            print(f"[{self.name}] 🔄 Retentative après rejet pour: {title[:30]}...")
            prompt = f"""
Tu es professeur de médecine. Tu as généré une Flashcard pour ce texte, mais un relecteur strict l'a REJETÉE (Hallucination ou imprécision) pour la raison suivante :
"{reason}"

Ancienne question rejetée : {old_q}
Ancienne réponse rejetée : {old_a}

Corrige tes erreurs et génère une NOUVELLE Flashcard SANS HALLUCINATION, basée EXACTEMENT sur le texte.
Renvoie un JSON : {{"question": "...", "answer": "..."}}

Texte source : {content}
"""
            data = self.call_llm(prompt)
            if data and "question" in data and "answer" in data:
                self.execute_db_write("UPDATE flashcards SET question = ?, answer = ?, status = 'PENDING_VERIFICATION', rejection_reason = NULL WHERE id = ?", (data["question"], data["answer"], fc_id))
                return "ANALYZED"
            return None
        
        # Cas normal : Nouvelle génération
        prompt = f"""
Tu es professeur de médecine préparant des étudiants aux ECNi/EDN.
Ton objectif est de créer des Flashcards (QCM, textes à trous, questions avec pièges) basées EXACTEMENT sur ce texte.
Exigence 1 : Les flashcards sont un outil pédagogique. Crée-les UNIQUEMENT sur les points clés qui méritent d'être mémorisés ou testés.
Exigence 2 : Niveau de difficulté universitaire. N'hésite pas à intégrer des pièges classiques.
Exigence 3 : Génère entre 0 et 5 flashcards. Si le texte ne s'y prête pas du tout (ex: intro vague), renvoie une liste vide [].
Renvoie un JSON au format : {{"flashcards": [{{"question": "...", "answer": "..."}}]}}

Titre : {title}
Contenu : {content}
"""
        data = self.call_llm(prompt)
        if data and "flashcards" in data and isinstance(data["flashcards"], list):
            for fc in data["flashcards"]:
                if "question" in fc and "answer" in fc:
                    self.execute_db_write("INSERT INTO flashcards (id, document_id, question, answer, type, status) VALUES (?, ?, ?, ?, ?, ?)",
                                        (str(uuid.uuid4()), doc_id, fc["question"], fc["answer"], "qcm", "PENDING_VERIFICATION"))
            print(f"[{self.name}] {len(data['flashcards'])} Flashcard(s) générée(s) pour : {title[:30]}...")
            return "ANALYZED"
        return None

# ==========================================
# 2. VÉRIFICATEUR (ANALYZED -> VERIFIED ou retour PENDING)
# ==========================================
class VerifierAgent(Agent):
    def __init__(self, db_conn):
        chain = [
            {"engine": "api", "model": "gemma-4-26b-a4b-it"},
            {"engine": "local", "model": "gemma2"}
        ]
        super().__init__("Verifier", db_conn, fallback_chain=chain)

    def process(self, doc_id, content_type, title, content):
        self.cursor.execute("SELECT id, question, answer FROM flashcards WHERE document_id = ? AND status = 'PENDING_VERIFICATION'", (doc_id,))
        flashcards = self.cursor.fetchall()
        
        if not flashcards:
            return "VERIFIED"
            
        all_passed = True
        for fc_id, q, a in flashcards:
            prompt = f"""
Tu es un vérificateur médical strict. Un autre agent a généré cette question à partir du texte source.
Vérifie qu'il n'y a AUCUNE HALLUCINATION (la réponse doit être supportée par le texte source).
Renvoie un JSON: {{"is_valid": true/false, "reason": "explication brève du problème si false, sinon vide"}}

Texte source : {content}
Question : {q}
Réponse proposée : {a}
"""
            data = self.call_llm(prompt)
            if data and "is_valid" in data:
                if data["is_valid"]:
                    self.execute_db_write("UPDATE flashcards SET status = 'VERIFIED' WHERE id = ?", (fc_id,))
                    print(f"[{self.name}] Flashcard Validée.")
                else:
                    reason = data.get('reason', 'Hallucination détectée')
                    # Au lieu de DELETE, on trace l'erreur (Auditabilité)
                    self.execute_db_write("UPDATE flashcards SET status = 'REJECTED', rejection_reason = ? WHERE id = ?", (reason, fc_id))
                    print(f"[{self.name}] ❌ Flashcard REJETÉE: {reason}")
                    all_passed = False
            else:
                all_passed = False
                
        # Si échec, on renvoie à l'état PENDING pour que l'Examinateur corrige
        return "VERIFIED" if all_passed else "PENDING"

# ==========================================
# 3. BALAYEUR (VERIFIED -> CLEANED)
# ==========================================
class CleanerAgent(Agent):
    def __init__(self, db_conn):
        chain = [
            {"engine": "api", "model": "gemma-4-31b-it"},
            {"engine": "local", "model": "gemma2"}
        ]
        super().__init__("Cleaner", db_conn, fallback_chain=chain)

    def process(self, doc_id, content_type, title, content):
        if content_type not in ["notion", "definition"]: return "CLEANED"
        
        prompt = f"""
Agis en tant que correcteur éditorial d'une encyclopédie médicale.
Corrige les fautes d'orthographe (vocabulaire médical) et standardise la typographie Markdown de ce texte. 
INTERDICTION ABSOLUE de changer le sens.
Renvoie UNIQUEMENT un JSON au format : {{"cleaned_content": "Le texte corrigé..."}}

Texte original :
{content}
"""
        data = self.call_llm(prompt)
        if data and "cleaned_content" in data:
            cleaned = data["cleaned_content"].strip()
            if cleaned and cleaned != content:
                self.execute_db_write("UPDATE documents SET content = ? WHERE id = ?", (cleaned, doc_id))
                print(f"[{self.name}] Texte nettoyé pour : {title[:30]}...")
            return "CLEANED"
        return None

# ==========================================
# 4. INDEXEUR (CLEANED -> INDEXED)
# ==========================================
class IndexerAgent(Agent):
    def __init__(self, db_conn):
        chain = [
            {"engine": "api", "model": "gemma-4-26b-a4b-it"},
            {"engine": "local", "model": "llama3.1"}
        ]
        super().__init__("Indexer", db_conn, fallback_chain=chain)

    def process(self, doc_id, content_type, title, content):
        if content_type not in ["notion", "definition", "schema", "table"]: return "INDEXED"
        
        prompt = f"""
Tu es un expert médical. Analyse ce texte et renvoie un tableau JSON contenant exactement 3 à 5 tags ultra-précis (ex: #Anatomie, #Physiopathologie).
Format attendu : {{"tags": ["#tag1", "#tag2", "#tag3"]}}

Titre : {title}
Contenu : {content}
"""
        data = self.call_llm(prompt)
        if data and "tags" in data:
            for tag in data["tags"]:
                if isinstance(tag, str):
                    self.execute_db_write("INSERT OR IGNORE INTO document_tags (id, document_id, tag_name) VALUES (?, ?, ?)",
                                        (str(uuid.uuid4()), doc_id, tag.strip().lower()))
            print(f"[{self.name}] Tags générés : {data['tags']}")
            return "INDEXED"
        return None

# ==========================================
# 5. ENRICHISSEUR (INDEXED -> ENRICHED)
# ==========================================
class EnricherAgent(Agent):
    def __init__(self, db_conn):
        # SUPPRESSION DU FALLBACK LOCAL (Modèle local trop faible pour enrichissement de qualité)
        chain = [
            {"engine": "api", "model": "gemma-4-31b-it"},
            {"engine": "api", "model": "gemma-4-26b-a4b-it"}
        ]
        super().__init__("Enricher", db_conn, fallback_chain=chain)

    def process(self, doc_id, content_type, title, content):
        if content_type not in ["notion"]: return "ENRICHED"
        
        prompt = f"""
Tu es un professeur de médecine de très haut niveau. 
Lis ce texte et ajoute-y un "Encart d'Excellence ECNi/EDN".
Cet encart doit obligatoirement inclure :
1. Moyens mnémotechniques (si pertinent).
2. Pièges classiques & Exceptions (Hyper important pour les concours).
3. Explications physiopathologiques (pour comprendre les petits détails).
Renvoie un JSON : {{"enrichment": "### 🌟 Encart d'Excellence ECNi/EDN\\n**Moyens Mnémotechniques** : ...\\n**Pièges & Exceptions** : ...\\n**Explication physio** : ..."}}

Texte :
{content}
"""
        data = self.call_llm(prompt)
        if data and "enrichment" in data:
            enriched_content = content + "\n\n" + data["enrichment"]
            self.execute_db_write("UPDATE documents SET content = ? WHERE id = ?", (enriched_content, doc_id))
            print(f"[{self.name}] Enrichissement ajouté pour : {title[:30]}...")
            return "ENRICHED"
        return None


# ==========================================
# INITIALISATION ET THREAD POOL
# ==========================================

def init_db(db_path):
    conn = sqlite3.connect(db_path, timeout=20.0)
    cursor = conn.cursor()
    
    # Activer le mode WAL pour permettre la lecture/écriture concurrente sans lock
    cursor.execute("PRAGMA journal_mode=WAL;")
    
    # Colonne pipeline_status
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN pipeline_status TEXT DEFAULT 'PENDING'")
    except sqlite3.OperationalError:
        pass
        
    try:
        cursor.execute("ALTER TABLE flashcards ADD COLUMN status TEXT DEFAULT 'VERIFIED'")
    except sqlite3.OperationalError:
        pass

    # NOUVEAUTÉ : Colonne rejection_reason pour l'audit et la rétroaction
    try:
        cursor.execute("ALTER TABLE flashcards ADD COLUMN rejection_reason TEXT")
    except sqlite3.OperationalError:
        pass
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS flashcards (
            id TEXT PRIMARY KEY,
            document_id TEXT,
            question TEXT,
            answer TEXT,
            type TEXT,
            status TEXT DEFAULT 'VERIFIED',
            rejection_reason TEXT,
            created_at INTEGER DEFAULT (cast(strftime('%s','now') as int))
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS document_tags (
            id TEXT PRIMARY KEY,
            document_id TEXT,
            tag_name TEXT,
            UNIQUE(document_id, tag_name)
        )
    ''')
    
    # Création des index d'optimisation pour accélérer l'interface graphique
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_documents_pipeline_status ON documents(pipeline_status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_flashcards_document_id ON flashcards(document_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_flashcards_status ON flashcards(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_document_tags_tag_name ON document_tags(tag_name)')
    
    conn.commit()
    return conn

def get_pipeline_stats(db_path):
    """Récupère les KPIs pour le tableau de bord Streamlit."""
    try:
        conn = sqlite3.connect(db_path, timeout=20.0)
        cursor = conn.cursor()
        
        # Stats sur les documents
        cursor.execute("SELECT pipeline_status, COUNT(*) FROM documents GROUP BY pipeline_status")
        doc_stats = {row[0]: row[1] for row in cursor.fetchall()}
        
        cursor.execute("SELECT COUNT(*) FROM documents")
        total_docs = cursor.fetchone()[0]
        
        # Stats sur les flashcards
        cursor.execute("SELECT status, COUNT(*) FROM flashcards GROUP BY status")
        fc_stats = {row[0]: row[1] for row in cursor.fetchall()}
        
        conn.close()
        return {
            "total_docs": total_docs,
            "doc_stats": doc_stats,
            "fc_stats": fc_stats
        }
    except Exception as e:
        return {"error": str(e)}

def process_single_document(doc_tuple, db_path):
    """Fonction exécutée par chaque thread (Worker)"""
    doc_id, content_type, title, content, status = doc_tuple
    
    # Une connexion par thread avec un grand timeout pour éviter le "database is locked"
    conn = sqlite3.connect(db_path, timeout=20.0)
    
    pipeline_map = {
        "PENDING": ExaminerAgent(conn),
        "ANALYZED": VerifierAgent(conn),
        "VERIFIED": CleanerAgent(conn),
        "CLEANED": IndexerAgent(conn),
        "INDEXED": EnricherAgent(conn)
    }
    
    agent = pipeline_map.get(status)
    if not agent:
        conn.close()
        return False
        
    print(f"\n▶️ [Thread-{threading.get_ident()}] Document: '{title[:30]}...' (État: {status})")
    
    new_status = agent.process(doc_id, content_type, title, content)
    
    success = False
    if new_status:
        if new_status == "ENRICHED":
            new_status = "DONE"
        agent.update_pipeline_status(doc_id, new_status)
        print(f"✅ [Thread-{threading.get_ident()}] Nouveau statut: {new_status}")
        success = True
    else:
        print(f"❌ [Thread-{threading.get_ident()}] L'agent {agent.name} n'a pas pu traiter le document (Maintien de {status}).")
        
    conn.close()
    return success, new_status, title

def run_swarm(db_path=DEFAULT_DB_PATH, limit=10, max_workers=4, progress_callback=None):
    print(f"🚀 Initialisation du Swarm sur la base : {db_path} ...")
    if GEMINI_API_KEY:
        print("✅ Clé API Google trouvée.")
    else:
        print("⚠️ Aucune clé GEMINI_API_KEY. L'API est désactivée.")
        
    conn = init_db(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, content_type, title, content, pipeline_status FROM documents WHERE pipeline_status != 'ENRICHED' AND pipeline_status != 'DONE' ORDER BY RANDOM() LIMIT ?", (limit,))
    documents = cursor.fetchall()
    conn.close() # On ferme la connexion principale, les workers ouvriront la leur
    
    docs_processed = 0
    
    # Lancement du Thread Pool
    print(f"⚙️ Lancement de {max_workers} travailleurs (threads) en parallèle...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_single_document, doc, db_path) for doc in documents]
        
        for idx, future in enumerate(concurrent.futures.as_completed(futures)):
            success, new_status, title = future.result()
            if success:
                docs_processed += 1
            if progress_callback:
                progress_callback(idx + 1, len(documents), title, success, new_status)
                
    print(f"\n🎉 Run terminé. {docs_processed} actions de pipeline effectuées avec succès.")
    return docs_processed

if __name__ == "__main__":
    # Par défaut, 4 documents en parallèle
    run_swarm(db_path=DEFAULT_DB_PATH, limit=20, max_workers=4)
