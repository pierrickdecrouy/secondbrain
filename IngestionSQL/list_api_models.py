from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Liste des modèles contenant 'gemma' ou 'gemini' :")
try:
    for model in client.models.list():
        name = model.name.lower()
        if 'gemma' in name or 'gemini' in name:
            print(f"- {model.name}")
except Exception as e:
    print(f"Erreur lors de la récupération des modèles : {e}")
