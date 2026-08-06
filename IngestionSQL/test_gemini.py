import os
import sys

from google import genai
from google.genai import errors

api_key = input("Entrez votre clé API Gemini (commence par AQ. ou AIza...) : ").strip()

try:
    client = genai.Client(api_key=api_key)
    
    print("\n--- Modèles disponibles sur votre compte ---")
    for m in client.models.list():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            
    print("\nLe modèle recommandé pour l'extraction est 'gemini-1.5-flash'.")
except errors.APIError as e:
    print(f"\nErreur de connexion : {e}")
except Exception as e:
    print(f"\nErreur inattendue : {e}")
