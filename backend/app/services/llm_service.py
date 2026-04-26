import requests
from app.core.config import OLLAMA_BASE_URL, OLLAMA_MODEL

def ollama_generate(prompt: str) -> str:
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    r = requests.post(url, json=payload, timeout=180)
    r.raise_for_status()
    return r.json().get("response", "")

# For production, we call this function ( openrouter )