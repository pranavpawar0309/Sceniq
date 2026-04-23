# backend/app.py
# sceniq Flask API
# All endpoints the React frontend talks to.

from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import MovieRecommender
import os

app = Flask(__name__)

# Allow requests from any origin in dev; lock down to your Vercel URL in prod
CORS(app, origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","))

# Boot the recommender once — builds TF-IDF matrix on first run (~2 min),
# then loads instantly from cache on every subsequent restart.
recommender = MovieRecommender()


# ── Health check ─────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "movies_loaded": recommender.movie_count,
    })


# ── Autocomplete search ───────────────────────────────────────────────────────
@app.route("/search", methods=["GET"])
def search():
    """Returns [{id, title, year, poster, rating}] for the autocomplete dropdown."""
    q     = request.args.get("q", "").strip().lower()
    limit = int(request.args.get("limit", 8))
    if len(q) < 2:
        return jsonify([])
    matches = [
        {
            "id":     m["tmdb_id"],
            "title":  m["title"],
            "year":   m["year"],
            "poster": m.get("poster"),
            "rating": m.get("rating"),
            "genre":  m.get("genres", [None])[0],
        }
        for m in recommender.movies
        if q in m["title"].lower()
    ][:limit]
    return jsonify(matches)


# ── Similar movies (ML cosine similarity) ────────────────────────────────────
@app.route("/similar", methods=["GET"])
def similar():
    """
    Find movies similar to a given title using TF-IDF cosine similarity.
    Returns { source_movie, recommendations: Movie[] }
    """
    title = request.args.get("title", "").strip()
    limit = min(int(request.args.get("limit", 12)), 30)
    if not title:
        return jsonify({"error": "title parameter is required"}), 400
    result = recommender.get_similar_by_title(title, limit)
    return jsonify(result)


# ── Description-based search (natural language → TF-IDF) ─────────────────────
@app.route("/describe", methods=["POST"])
def describe():
    """
    Find movies matching a free-text description.
    Body: { description: str, limit?: int }
    Returns Movie[]
    """
    data        = request.get_json(silent=True) or {}
    description = data.get("description", "").strip()
    limit       = min(int(data.get("limit", 12)), 30)
    if not description:
        return jsonify({"error": "description is required"}), 400
    results = recommender.get_by_description(description, limit)
    return jsonify(results)


# ── Trending ──────────────────────────────────────────────────────────────────
@app.route("/trending", methods=["GET"])
def trending():
    limit    = min(int(request.args.get("limit", 20)), 100)
    sort     = request.args.get("sort", "popular")
    language = request.args.get("language", "").strip()
    results  = recommender.get_trending(limit, sort=sort, language=language)
    return jsonify(results)


# ── Genre list ────────────────────────────────────────────────────────────────
@app.route("/genres", methods=["GET"])
def genres():
    """Returns all unique genres in the dataset."""
    return jsonify(recommender.get_genres())


# ── Browse by genre ───────────────────────────────────────────────────────────
@app.route("/browse", methods=["GET"])
def browse():
    """Returns top-rated movies filtered by genre and/or language."""
    genre    = request.args.get("genre", "").strip()
    language = request.args.get("language", "").strip()
    limit    = min(int(request.args.get("limit", 40)), 100)
    results  = recommender.browse_by_genre(genre, limit, language=language)
    return jsonify(results)


# ── Single movie detail ───────────────────────────────────────────────────────
@app.route("/movie/<int:tmdb_id>", methods=["GET"])
def movie_detail(tmdb_id):
    movie = next((m for m in recommender.movies if m["tmdb_id"] == tmdb_id), None)
    if not movie:
        return jsonify({"error": "not found"}), 404
    return jsonify(movie)


# ── Movie trailer ─────────────────────────────────────────────────────────────
@app.route("/trailer/<int:tmdb_id>", methods=["GET"])
def trailer(tmdb_id):
    """Fetches the official YouTube trailer key from TMDB."""
    api_key = os.environ.get("TMDB_API_KEY", "")
    if not api_key:
        return jsonify({"error": "no api key"}), 400
    try:
        import requests as req
        r = req.get(
            f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos",
            params={"api_key": api_key},
            timeout=8,
        )
        videos = r.json().get("results", [])
        # Pick official trailer first, then any trailer, then any video
        trailer = next(
            (v for v in videos if v.get("type") == "Trailer" and v.get("site") == "YouTube" and v.get("official")),
            next(
                (v for v in videos if v.get("type") == "Trailer" and v.get("site") == "YouTube"),
                next((v for v in videos if v.get("site") == "YouTube"), None)
            )
        )
        if trailer:
            return jsonify({"key": trailer["key"], "name": trailer.get("name", "")})
        return jsonify({"error": "no trailer found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/chat", methods=["POST"])
def chat():
    """
    Smart chat endpoint:
      1. Try Claude (if ANTHROPIC_API_KEY is set)
      2. Fall back to TF-IDF description search
    Body: { messages: [{role, content}], system?: str }
    Returns: { reply?: str, movies?: list, source: 'claude'|'tfidf' }
    """
    data     = request.get_json(silent=True) or {}
    messages = data.get("messages", [])
    system   = data.get("system", "You are sceniq AI, a helpful movie recommendation assistant.")
    if not messages:
        return jsonify({"error": "messages required"}), 400

    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m.get("role") == "user"), ""
    )

    # ── Try Claude first ──────────────────────────────────────
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        try:
            import anthropic
            client   = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
                system=system,
                messages=messages,
            )
            return jsonify({"reply": response.content[0].text, "source": "claude"})
        except Exception as e:
            print(f"[sceniq] Claude failed: {e} — falling back to TF-IDF")

    # ── TF-IDF fallback ───────────────────────────────────────
    # Try "similar to X" pattern first
    import re
    similar_match = re.search(
        r'similar to (.+)|like (.+)|loved? (.+)|recommend.+like (.+)', 
        last_user_msg, re.IGNORECASE
    )
    if similar_match:
        title  = next(g for g in similar_match.groups() if g).strip(' ?!')
        result = recommender.get_similar_by_title(title, 6)
        if "recommendations" in result:
            return jsonify({"movies": result["recommendations"], "source": "tfidf"})

    # General description search
    movies = recommender.get_by_description(last_user_msg, 6)
    return jsonify({"movies": movies, "source": "tfidf"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
