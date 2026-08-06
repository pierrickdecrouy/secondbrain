import os
import sys

# Contournement agressif pour le crash Protobuf sur Python 3.14
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
sys.modules['google._upb._message'] = None

import streamlit as st
import glob
from swarm import run_swarm, get_pipeline_stats, init_db
import pandas as pd
import time

# --- Configuration de la page ---
st.set_page_config(page_title="Swarm Control Center", page_icon="🏭", layout="wide")

st.title("🏭 Swarm Control Center")
st.markdown("Interface de supervision et de lancement du pipeline d'agents IA.")

# --- Découverte des bases de données ---
OUTPUTS_DIR = "./outputs"
os.makedirs(OUTPUTS_DIR, exist_ok=True)
db_files = glob.glob(f"{OUTPUTS_DIR}/*.sqlite")
db_names = [os.path.basename(f) for f in db_files]

if not db_names:
    st.warning(f"Aucune base de données trouvée dans '{OUTPUTS_DIR}'.")
    st.stop()

# --- Barre latérale : Sélection & Configuration ---
with st.sidebar:
    st.header("⚙️ Paramètres")
    selected_db_name = st.selectbox("Sélectionnez la Base de Données", db_names)
    selected_db_path = os.path.join(OUTPUTS_DIR, selected_db_name)
    
    st.markdown("---")
    limit = st.slider("Nombre de documents à traiter (Batch)", min_value=1, max_value=5000, value=100, step=10)
    max_workers = st.slider("Nombre de Workers (Parallélisme)", min_value=1, max_value=8, value=4)
    
    st.markdown("---")
    st.info("💡 **Astuce** : Le pipeline est bloqué à 30 requêtes/minute vers l'API Google, mais le parallélisme accélère les vérifications Ollama locales.")

# Préparation de la base de données (ajout des colonnes si manquantes)
try:
    conn = init_db(selected_db_path)
    conn.close()
except Exception as e:
    st.error(f"Erreur d'initialisation de la base : {e}")

# --- Affichage des Métriques ---
st.subheader("📊 État de la ligne d'assemblage")
metrics_placeholder = st.empty()

def render_metrics_content(db_path, container):
    stats = get_pipeline_stats(db_path)
    if "error" in stats:
        container.error(f"Erreur de lecture de la base de données : {stats['error']}")
        return
        
    doc_stats = stats.get("doc_stats", {})
    fc_stats = stats.get("fc_stats", {})
    total_docs = stats.get("total_docs", 0)
    
    with container.container():
        cols = st.columns(6)
        
        def metric_card(col, title, value, emoji, color="blue"):
            col.markdown(
                f"""
                <div style="padding: 10px; border-radius: 5px; text-align: center; background-color: rgba(100, 100, 100, 0.1);">
                    <p style="margin:0; font-size: 14px; font-weight: bold; color: gray;">{title}</p>
                    <h2 style="margin:0; padding-top: 5px; color: {color};">{emoji} {value}</h2>
                </div>
                """,
                unsafe_allow_html=True
            )

        metric_card(cols[0], "En Attente", doc_stats.get("PENDING", 0) + (total_docs - sum(doc_stats.values())), "🟡", color="#f1c40f")
        metric_card(cols[1], "Analysés", doc_stats.get("ANALYZED", 0), "📝")
        metric_card(cols[2], "Vérifiés", doc_stats.get("VERIFIED", 0), "🛡️")
        metric_card(cols[3], "Nettoyés", doc_stats.get("CLEANED", 0), "🧹")
        metric_card(cols[4], "Indexés", doc_stats.get("INDEXED", 0), "🏷️")
        metric_card(cols[5], "Terminés", doc_stats.get("DONE", 0), "✅", color="#2ecc71")

        st.markdown("<br>", unsafe_allow_html=True)

        col_fc1, col_fc2 = st.columns(2)
        with col_fc1:
            st.markdown("**Flashcards Validées :**")
            st.progress(fc_stats.get("VERIFIED", 0) / max(1, sum(fc_stats.values())))
            st.caption(f"{fc_stats.get('VERIFIED', 0)} flashcards saines")
        with col_fc2:
            st.markdown("**Flashcards Rejetées (Hallucinations) :**")
            st.progress(fc_stats.get("REJECTED", 0) / max(1, sum(fc_stats.values())))
            st.caption(f"{fc_stats.get('REJECTED', 0)} flashcards écartées")

if hasattr(st, "fragment"):
    @st.fragment(run_every="2s")
    def display_metrics_fragment():
        render_metrics_content(selected_db_path, metrics_placeholder)
    display_metrics_fragment()
else:
    try:
        from streamlit_autorefresh import st_autorefresh
        st_autorefresh(interval=2000, limit=None, key="data_refresh")
    except ImportError:
        pass
    render_metrics_content(selected_db_path, metrics_placeholder)


st.markdown("---")

# --- Lancement du Swarm ---
st.subheader("🚀 Console de Lancement")

if st.button("Lancer l'Usine (Batch)", type="primary"):
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    # Zone de log
    log_container = st.container()
    
    def on_progress(current, total, title, success, new_status):
        progress = current / total
        progress_bar.progress(progress)
        status = f"✅ {new_status}" if success else "❌ Échec"
        status_text.text(f"Traitement : {current}/{total} - {title[:40]}... ({status})")
        # Rafraichir les stats visuelles en temps réel pendant le traitement
        render_metrics_content(selected_db_path, metrics_placeholder)

    with st.spinner("Le Swarm est en cours de traitement. Veuillez patienter..."):
        start_time = time.time()
        docs_processed = run_swarm(
            db_path=selected_db_path, 
            limit=limit, 
            max_workers=max_workers, 
            progress_callback=on_progress
        )
        elapsed = time.time() - start_time
        
    st.success(f"Opération terminée ! {docs_processed} actions réalisées en {elapsed:.2f} secondes.")
    st.balloons()
    
    # Rafraichir les stats après le run
    time.sleep(2)
    st.rerun()
