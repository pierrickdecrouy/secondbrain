import os
import sys
import uuid
import threading
import queue

# Contournement agressif pour le crash Protobuf sur Python 3.14
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'
sys.modules['google._upb._message'] = None

from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['OUTPUT_FOLDER'] = os.path.join(os.path.dirname(__file__), 'outputs')
app.config['MAX_CONTENT_LENGTH'] = 1000 * 1024 * 1024  # 1 Go max au lieu de 50 Mo

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Purge uploads folder on startup
for f in os.listdir(app.config['UPLOAD_FOLDER']):
    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], f))

# Simple in-memory task tracking
tasks = {}

# Global Queue for Background Processing
task_queue = queue.Queue()

def worker_loop():
    """Dépile et traite les tâches une par une en arrière-plan."""
    while True:
        job = task_queue.get()
        task_id = job['task_id']
        file_paths = job['file_paths']
        output_path = job['output_path']
        api_key = job['api_key']
        hybrid_mode = job['hybrid_mode']
        ollama_model = job['ollama_model']
        
        tasks[task_id]['status'] = 'processing'
        tasks[task_id]['message'] = f'Démarrage du traitement de {len(file_paths)} fichier(s)...'
        
        try:
            if hybrid_mode:
                from processor_hybrid import process_pdf as proc_pdf
            else:
                from processor import process_pdf as proc_pdf
                
            total_files = len(file_paths)
            for idx, file_path in enumerate(file_paths):
                def progress_callback(p, m):
                    overall_progress = int((idx * 100 + p) / total_files)
                    update_task(task_id, overall_progress, f"[{idx+1}/{total_files}] {m}")
                
                # Hybrid mode has an extra argument for ollama_model
                if hybrid_mode:
                    proc_pdf(
                        file_path=file_path,
                        output_path=output_path,
                        api_key=api_key,
                        ollama_model=ollama_model,
                        progress_callback=progress_callback
                    )
                else:
                    proc_pdf(
                        file_path=file_path,
                        output_path=output_path,
                        api_key=api_key,
                        progress_callback=progress_callback
                    )
                
            tasks[task_id]['status'] = 'completed'
            tasks[task_id]['progress'] = 100
            tasks[task_id]['message'] = 'Traitement terminé avec succès !'
            tasks[task_id]['output_file'] = os.path.basename(output_path)
            
        except Exception as e:
            tasks[task_id]['status'] = 'error'
            tasks[task_id]['error'] = str(e)
            tasks[task_id]['message'] = 'Erreur lors du traitement'
            
        finally:
            # Purge the uploaded files for this task to save space and protect privacy
            for file_path in file_paths:
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    print(f"Failed to delete {file_path}: {e}")

        task_queue.task_done()

# Start background worker thread
threading.Thread(target=worker_loop, daemon=True).start()

def update_task(task_id, progress, message):
    if task_id in tasks:
        tasks[task_id]['progress'] = progress
        tasks[task_id]['message'] = message

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'files' not in request.files and 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier envoyé'}), 400
    
    files = request.files.getlist('files')
    if not files and 'file' in request.files:
        files = [request.files['file']]
        
    api_key = request.form.get('api_key', '').strip()
    hybrid_mode = request.form.get('hybrid_mode') == 'true'
    ollama_model = request.form.get('ollama_model', 'llama3.1').strip()
    db_name = request.form.get('db_name', 'extnd_knowledge_base.sqlite').strip()
    
    if not db_name:
        db_name = 'extnd_knowledge_base.sqlite'
    if not db_name.endswith('.sqlite'):
        db_name += '.sqlite'
        
    db_name = secure_filename(db_name)
    
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'Aucun fichier sélectionné'}), 400
        
    if not api_key:
        return jsonify({'error': 'Clé API Gemini requise'}), 400

    valid_files = [f for f in files if f.filename.endswith('.pdf')]
    
    if not valid_files:
        return jsonify({'error': 'Format de fichier non supporté. PDF uniquement.'}), 400

    task_id = str(uuid.uuid4())
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], db_name)
    
    saved_file_paths = []
    for i, file in enumerate(valid_files):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{task_id}_{i}_{filename}")
        file.save(file_path)
        saved_file_paths.append(file_path)
    
    queue_position = task_queue.qsize() + 1
    
    # Initialize task
    tasks[task_id] = {
        'status': 'queued',
        'progress': 0,
        'message': f'En file d\'attente (Position : {queue_position})...',
        'output_file': db_name,
        'error': None
    }
    
    # Add to background queue
    task_queue.put({
        'task_id': task_id,
        'file_paths': saved_file_paths,
        'output_path': output_path,
        'api_key': api_key,
        'hybrid_mode': hybrid_mode,
        'ollama_model': ollama_model
    })
    
    return jsonify({'task_id': task_id, 'message': 'Ajouté à la file d\'attente'})

@app.route('/status/<task_id>', methods=['GET'])
def check_status(task_id):
    if task_id not in tasks:
        return jsonify({'error': 'Tâche introuvable'}), 404
    return jsonify(tasks[task_id])

@app.route('/databases', methods=['GET'])
def get_databases():
    databases = []
    output_dir = app.config['OUTPUT_FOLDER']
    if os.path.exists(output_dir):
        for filename in os.listdir(output_dir):
            if filename.endswith('.sqlite'):
                file_path = os.path.join(output_dir, filename)
                size_mb = os.path.getsize(file_path) / (1024 * 1024)
                databases.append({
                    'name': filename,
                    'size_mb': round(size_mb, 2)
                })
    return jsonify({'databases': databases})

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], secure_filename(filename))
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({'error': 'Fichier introuvable'}), 404

if __name__ == '__main__':
    app.run(debug=False, port=5001)
