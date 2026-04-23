# backend/recommender.py
import os
import pickle
import requests
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()

TMDB_KEY   = os.environ.get("TMDB_API_KEY", "")
CACHE_FILE = "movies_cache.pkl"
TMDB_BASE  = "https://api.themoviedb.org/3"

GENRE_MAP = {
    28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",
    99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",36:"History",
    27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",
    53:"Thriller",10752:"War",37:"Western",
}

# Curated seeds — Hollywood, Bollywood, South Indian, Korean, Anime, Spanish
_RAW_SEEDS = [
    # Hollywood
    299536,299534,284053,284054,245891,315635,102899,363088,271110,99861,
    1726,10138,68721,168259,603,157336,27205,49026,11,181808,181812,348350,
    438631,475557,118340,376867,329865,522681,603692,278,238,240,389,637,
    424,497,769,334,745,807,274,598,372058,244786,13,694919,346364,
    419430,503919,480530,458156,385687,354912,550,76341,335984,218,539,
    14160,12155,10193,585671,297762,862,863,8844,10681,38,920,9806,680,
    207,105,311,37165,453,634649,566525,508943,585511,436270,453395,640146,
    507086,675353,618344,568124,512195,614934,438148,361743,194662,
    424694,155,120,429617,324857,260513,
    # Recent Hollywood
    505642,762504,848326,934433,940551,823464,1011985,976573,748783,
    787699,569094,447365,713704,951491,
    # Bollywood
    19404,14744,20766,28517,42867,44120,96874,166424,160322,180299,
    204553,263115,312221,339403,385128,386117,531309,613648,639721,
    776503,813258,891699,931944,974262,1029575,
    # South Indian
    314278,309809,367412,975902,933260,859205,988193,763215,
    # Korean
    496243,28208,77338,21566,454983,128216,399055,
    # Japanese / Anime
    129,372058,149870,37797,44217,12477,228150,65759,378064,502402,635302,592350,
    # Spanish / European
    504608,10590,11323,
]
_seen_s = set()
SEED_IDS = []
for x in _RAW_SEEDS:
    if x not in _seen_s:
        _seen_s.add(x)
        SEED_IDS.append(x)


class MovieRecommender:
    def __init__(self):
        self.movies       = []
        self.tfidf_matrix = None
        self.vectorizer   = None
        self._title_index = {}
        self._load_or_build()

    @property
    def movie_count(self):
        return len(self.movies)

    # ── Public API ────────────────────────────────────────────

    def get_similar_by_title(self, title: str, limit: int = 12) -> dict:
        idx = self._find_index(title)
        if idx is None:
            return {"error": f"'{title}' not found.", "suggestions": self._fuzzy_suggest(title)}
        scores      = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
        scores[idx] = -1
        top         = np.argsort(scores)[::-1][:limit]
        recs        = []
        for i in top:
            m = dict(self.movies[i])
            m["similarity_score"] = round(float(scores[i]), 3)
            recs.append(m)
        return {"source_movie": self.movies[idx], "recommendations": recs}

    def get_by_description(self, description: str, limit: int = 12) -> list:
        vec    = self.vectorizer.transform([description.lower()])
        scores = cosine_similarity(vec, self.tfidf_matrix).flatten()
        top    = np.argsort(scores)[::-1][:limit]
        result = []
        for i in top:
            m = dict(self.movies[i])
            m["relevance_score"] = round(float(scores[i]), 3)
            result.append(m)
        return result

    def get_trending(self, limit: int = 20, sort: str = "popular", language: str = "") -> list:
        movies = self.movies
        if language:
            movies = [m for m in movies if m.get("language") == language]
        if sort == "alltime":
            def alltime_score(m):
                vc = min(m.get("vote_count", 0), 10000)
                return (vc / 1000) * (m.get("rating") or 0)
            return sorted(movies, key=alltime_score, reverse=True)[:limit]
        else:
            return sorted(movies, key=lambda m: m.get("popularity") or 0, reverse=True)[:limit]

    def get_genres(self) -> list:
        genres = set()
        for m in self.movies:
            genres.update(m.get("genres", []))
        return sorted(genres)

    def browse_by_genre(self, genre: str, limit: int = 40, language: str = "") -> list:
        movies = self.movies
        if language:
            movies = [m for m in movies if m.get("language") == language]
        if genre:
            movies = [m for m in movies if genre in m.get("genres", [])]
        return sorted(movies, key=lambda m: m.get("rating") or 0, reverse=True)[:limit]

    # ── Load / Build ──────────────────────────────────────────

    def _load_or_build(self):
        if os.path.exists(CACHE_FILE):
            print("[sceniq] Loading from cache...")
            with open(CACHE_FILE, "rb") as f:
                data = pickle.load(f)
            self.movies       = data["movies"]
            self.tfidf_matrix = data["tfidf_matrix"]
            self.vectorizer   = data["vectorizer"]
            self._build_index()
            print(f"[sceniq] {self.movie_count} movies loaded.")
            return
        print("[sceniq] Building dataset...")
        self._fetch_all_movies()
        if not self.movies:
            print("[sceniq] Using fallback dataset.")
            self.movies = self._fallback_movies()
        self._build_tfidf()
        self._build_index()
        self._save_cache()
        print(f"[sceniq] Ready — {self.movie_count} movies indexed.")

    def _fetch_all_movies(self):
        if not TMDB_KEY:
            return
        seen = set()

        def fetch_page_results(results):
            for item in results:
                tid = item.get("id")
                if tid and tid not in seen:
                    m = self._fetch_one(tid)
                    if m:
                        self.movies.append(m)
                        seen.add(tid)

        def discover_lang(lang, pages=4):
            for page in range(1, pages + 1):
                try:
                    r = requests.get(f"{TMDB_BASE}/discover/movie",
                        params={"api_key": TMDB_KEY,
                                "with_original_language": lang,
                                "sort_by": "popularity.desc",
                                "vote_count.gte": 50,
                                "page": page}, timeout=12)
                    fetch_page_results(r.json().get("results", []))
                    print(f"[sceniq] {lang.upper()} p{page} — {len(self.movies)} total")
                except Exception as e:
                    print(f"[sceniq] {lang} p{page} error: {e}")

        # Seeds
        for tmdb_id in SEED_IDS:
            if tmdb_id not in seen:
                m = self._fetch_one(tmdb_id)
                if m:
                    self.movies.append(m)
                    seen.add(tmdb_id)
        print(f"[sceniq] Seeds: {len(self.movies)}")

        # English popular + top rated
        for page in range(1, 11):
            try:
                r = requests.get(f"{TMDB_BASE}/movie/popular",
                    params={"api_key": TMDB_KEY, "page": page}, timeout=10)
                fetch_page_results(r.json().get("results", []))
            except Exception as e:
                print(f"[sceniq] EN popular {page}: {e}")
        for page in range(1, 7):
            try:
                r = requests.get(f"{TMDB_BASE}/movie/top_rated",
                    params={"api_key": TMDB_KEY, "page": page}, timeout=10)
                fetch_page_results(r.json().get("results", []))
            except Exception as e:
                print(f"[sceniq] EN top_rated {page}: {e}")
        print(f"[sceniq] English done: {len(self.movies)}")

        # All languages
        discover_lang("hi", 8)   # Hindi / Bollywood
        discover_lang("ta", 5)   # Tamil
        discover_lang("te", 5)   # Telugu
        discover_lang("ml", 3)   # Malayalam
        discover_lang("kn", 3)   # Kannada
        discover_lang("ko", 5)   # Korean
        discover_lang("ja", 5)   # Japanese / Anime
        discover_lang("es", 4)   # Spanish
        discover_lang("fr", 3)   # French
        discover_lang("it", 2)   # Italian
        discover_lang("pt", 2)   # Portuguese

        print(f"[sceniq] Total fetched: {len(self.movies)}")

    def _fetch_one(self, tmdb_id):
        try:
            r = requests.get(f"{TMDB_BASE}/movie/{tmdb_id}",
                params={"api_key": TMDB_KEY, "append_to_response": "credits,keywords"},
                timeout=8)
            if r.status_code != 200:
                return None
            d        = r.json()
            genres   = [GENRE_MAP.get(g["id"], g["name"]) for g in d.get("genres", [])]
            cast     = [c["name"] for c in d.get("credits", {}).get("cast", [])[:6]]
            crew     = d.get("credits", {}).get("crew", [])
            director = next((c["name"] for c in crew if c["job"] == "Director"), "")
            keywords = [k["name"] for k in d.get("keywords", {}).get("keywords", [])[:12]]
            poster   = d.get("poster_path")
            backdrop = d.get("backdrop_path")
            title    = d.get("title") or d.get("original_title", "")
            if not title:
                return None
            return {
                "tmdb_id":    d["id"],
                "title":      title,
                "year":       (d.get("release_date") or "")[:4],
                "overview":   d.get("overview", ""),
                "genres":     genres,
                "cast":       cast,
                "director":   director,
                "keywords":   keywords,
                "rating":     round(d.get("vote_average") or 0, 1),
                "vote_count": d.get("vote_count", 0),
                "runtime":    d.get("runtime", 0),
                "language":   d.get("original_language", ""),
                "tagline":    d.get("tagline", ""),
                "popularity": round(d.get("popularity") or 0, 1),
                "imdb_id":    d.get("imdb_id", ""),
                "poster":     f"https://image.tmdb.org/t/p/w500{poster}" if poster else None,
                "backdrop":   f"https://image.tmdb.org/t/p/w1280{backdrop}" if backdrop else None,
            }
        except Exception as e:
            return None

    # ── TF-IDF ───────────────────────────────────────────────

    def _make_soup(self, m):
        parts = []
        parts.append((m.get("overview") or "") * 2)
        parts.extend((m.get("genres") or []) * 3)
        parts.extend((m.get("keywords") or []) * 2)
        parts.extend(m.get("cast") or [])
        if m.get("director"):
            parts.extend([m["director"]] * 2)
        parts.append(m.get("tagline") or "")
        lang = m.get("language", "")
        if lang and lang != "en":
            parts.extend([lang] * 2)
        return " ".join(parts).lower()

    def _build_tfidf(self):
        soups = [self._make_soup(m) for m in self.movies]
        self.vectorizer = TfidfVectorizer(
            stop_words="english", ngram_range=(1, 2),
            max_features=25000, min_df=1,
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(soups)
        print(f"[sceniq] TF-IDF: {self.tfidf_matrix.shape}")

    def _build_index(self):
        self._title_index = {}
        for i, m in enumerate(self.movies):
            self._title_index[m["title"].lower()] = i

    def _save_cache(self):
        with open(CACHE_FILE, "wb") as f:
            pickle.dump({"movies": self.movies,
                         "tfidf_matrix": self.tfidf_matrix,
                         "vectorizer": self.vectorizer}, f)
        print("[sceniq] Cache saved.")

    def _find_index(self, title):
        key = title.strip().lower()
        if key in self._title_index:
            return self._title_index[key]
        for k, v in self._title_index.items():
            if key in k:
                return v
        return None

    def _fuzzy_suggest(self, title):
        words = [w for w in title.lower().split() if len(w) > 2]
        out = []
        for m in self.movies:
            if any(w in m["title"].lower() for w in words):
                out.append({"title": m["title"], "year": m["year"]})
        return out[:6]

    def _fallback_movies(self):
        return [
            {"tmdb_id":27205,"title":"Inception","year":"2010","overview":"A thief who steals corporate secrets through dream-sharing is tasked with planting an idea.","genres":["Action","Sci-Fi","Thriller"],"cast":["Leonardo DiCaprio","Joseph Gordon-Levitt"],"director":"Christopher Nolan","keywords":["dream","heist","mind"],"rating":8.8,"vote_count":35000,"runtime":148,"language":"en","tagline":"Your mind is the scene of the crime.","popularity":100.0,"imdb_id":"tt1375666","poster":None,"backdrop":None},
            {"tmdb_id":96874,"title":"3 Idiots","year":"2009","overview":"Two friends search for their long-lost companion and recall college days when they challenged the conventional education system.","genres":["Comedy","Drama","Romance"],"cast":["Aamir Khan","R. Madhavan","Sharman Joshi"],"director":"Rajkumar Hirani","keywords":["college","friendship","education","India","comedy"],"rating":8.4,"vote_count":12000,"runtime":170,"language":"hi","tagline":"","popularity":85.0,"imdb_id":"tt1187043","poster":None,"backdrop":None},
            {"tmdb_id":496243,"title":"Parasite","year":"2019","overview":"Greed and class discrimination threaten a symbiotic relationship between two families.","genres":["Thriller","Drama"],"cast":["Song Kang-ho","Lee Sun-kyun"],"director":"Bong Joon-ho","keywords":["class","inequality","Korean"],"rating":8.5,"vote_count":17000,"runtime":132,"language":"ko","tagline":"Act like you own the place.","popularity":82.0,"imdb_id":"tt6751668","poster":None,"backdrop":None},
            {"tmdb_id":129,"title":"Spirited Away","year":"2001","overview":"A girl wanders into a spirit world and must work to free herself and her parents.","genres":["Animation","Fantasy"],"cast":["Daveigh Chase"],"director":"Hayao Miyazaki","keywords":["spirit","anime","Japan","magic"],"rating":8.6,"vote_count":14000,"runtime":125,"language":"ja","tagline":"","popularity":78.0,"imdb_id":"tt0245429","poster":None,"backdrop":None},
        ]
