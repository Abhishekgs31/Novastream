# ai-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

# Define the data structure we expect from the backend
class UserContext(BaseModel):
    user_id: str
    device_type: str
    time_of_day: str
    hover_time_ms: int

@app.post("/api/recommend")
def get_recommendations(context: UserContext):
    """
    Simulated Contextual Multi-Armed Bandit Algorithm.
    In production, this would use multi-modal embeddings (NLP on scripts + CV on trailers)
    to calculate a similarity index. Here, we use a heuristic proxy.
    """
    print(f"🧠 AI Engine received context for {context.user_id}: {context.device_type}, {context.hover_time_ms}ms hover")

    # The Bandit Strategy: Exploit vs Explore based on real-time context
    if context.device_type == "Mobile":
        # Exploit: Mobile users typically want fast-paced content immediately
        recommendations = [
            {"id": 101, "title": "Cyber Heist", "genre": "Action", "match": "99%"},
            {"id": 102, "title": "The Quantum Enigma", "genre": "Sci-Fi", "match": "92%"}
        ]
        strategy = "Exploit (Fast-Paced)"
        
    elif context.hover_time_ms > 2000:
        # Exploit: Desktop users who hover a long time are analyzing options
        recommendations = [
            {"id": 104, "title": "Neural Net", "genre": "Documentary", "match": "96%"},
            {"id": 103, "title": "Midnight Protocol", "genre": "Thriller", "match": "88%"}
        ]
        strategy = "Exploit (Deep-Dive)"
        
    else:
        # Explore: Not enough context, show a diverse mix to gather more data
        recommendations = [
            {"id": 101, "title": "Cyber Heist", "genre": "Action", "match": "85%"},
            {"id": 104, "title": "Neural Net", "genre": "Documentary", "match": "82%"}
        ]
        strategy = "Explore (Mixed Pipeline)"

    return {
        "user_id": context.user_id,
        "bandit_strategy": strategy,
        "recommendations": recommendations
    }