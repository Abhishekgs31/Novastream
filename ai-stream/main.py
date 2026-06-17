# ai-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# 1. THE MOCK DATABASE (Now with overlapping NLP keywords)
movies_db = [
    {"id": 101, "title": "Cyber Heist", "genre": "Action", "plot": "A team of elite hackers breaches a quantum bank to steal digital currency before a rogue artificial intelligence takes over."},
    {"id": 102, "title": "The Quantum Enigma", "genre": "Sci-Fi", "plot": "A physicist discovers a hidden dimension inside a quantum computer, leading to a paradox involving artificial intelligence."},
    {"id": 103, "title": "Midnight Protocol", "genre": "Thriller", "plot": "A detective races to stop a cyber-terrorist from launching an attack on the city grid using rogue neural networks."},
    {"id": 104, "title": "Neural Net", "genre": "Documentary", "plot": "An in-depth look at artificial intelligence, neural networks, and how quantum machine learning is shaping the future."}
]

# 2. THE MACHINE LEARNING PIPELINE
def get_similar_movies(target_index, top_n=2):
    # Extract all plot summaries
    plots = [movie["plot"] for movie in movies_db]
    
    # Step A: Convert English text into a mathematical matrix (TF-IDF)
    # This weighs unique, important words (like "quantum" or "cyber") higher than common words (like "the" or "and")
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(plots)
    
    # Step B: Calculate Cosine Similarity
    # This measures the mathematical distance between the target movie and all other movies
    similarity_scores = cosine_similarity(tfidf_matrix[target_index], tfidf_matrix).flatten()
    
    # Step C: Get the indices of the highest scoring movies (excluding the target itself)
    similar_indices = similarity_scores.argsort()[-(top_n+1):-1][::-1]
    
    # Step D: Format the recommendations for the frontend
    recommendations = []
    for idx in similar_indices:
        # Generate a dynamic match score based on the actual math!
        match_percentage = f"{int(similarity_scores[idx] * 100)}%" 
        
        movie = movies_db[idx].copy()
        movie["match"] = match_percentage
        del movie["plot"] # The frontend doesn't need the heavy text payload
        recommendations.append(movie)
        
    return recommendations

# 3. THE API GATEWAY
class UserContext(BaseModel):
    user_id: str
    device_type: str
    time_of_day: str
    hover_time_ms: int

@app.post("/api/recommend")
def get_recommendations(context: UserContext):
    print(f"🧠 ML Engine processing NLP vectors for {context.user_id}")

    # The Contextual Bandit now uses ML Content-Based Filtering!
    if context.device_type == "Mobile":
        # Mobile users want fast action. We seed the ML with 'Cyber Heist' (Index 0)
        recs = get_similar_movies(target_index=0)
        strategy = "NLP Content-Based Filtering (Seed: Action)"
        
    elif context.hover_time_ms > 2000:
        # Desktop users hovering want deep-dives. We seed the ML with 'Neural Net' (Index 3)
        recs = get_similar_movies(target_index=3)
        strategy = "NLP Content-Based Filtering (Seed: Documentary)"
        
    else:
        # Default exploration. Seed with 'Quantum Enigma' (Index 1)
        recs = get_similar_movies(target_index=1)
        strategy = "NLP Content-Based Filtering (Seed: Sci-Fi)"

    return {
        "user_id": context.user_id,
        "bandit_strategy": strategy,
        "recommendations": recs
    }