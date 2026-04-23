# 🎬 Sceniq — AI-Powered Movie Discovery

> Find your next great film. Search by title or just describe the vibe.

![Sceniq](https://img.shields.io/badge/Sceniq-v1.0-e8c56d?style=for-the-badge)
![React](https://img.shields.io/badge/React-Vite-61dafb?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-Flask-3776ab?style=for-the-badge&logo=python)
![Firebase](https://img.shields.io/badge/Firebase-Auth+Firestore-ffca28?style=for-the-badge&logo=firebase)

---

## ✨ What is Sceniq?

Sceniq is a full-stack AI-powered movie recommendation platform with two discovery modes:

- 🎥 **Search by Similar** — Enter any movie title and our ML engine finds the closest matches using TF-IDF cosine similarity across genre, cast, director, and plot.
- ✍️ **Describe Your Mood** — Type anything like *"dark psychological thriller in the rain"* and Sceniq maps your words into movie space to surface the perfect match.

---

## 🚀 Features

- 🔍 Dual-mode AI search (title similarity + natural language)
- 🌍 Multilingual support across 13 languages
- 🔖 Watchlist & star ratings with Firestore persistence
- 🎯 Personalised "For You" feed based on your taste
- 🤖 Built-in Sceniq AI chat assistant (powered by Claude)
- 📱 PWA support — installable on mobile
- 🔐 Google + Email authentication via Firebase

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, React Router, Framer Motion |
| Backend | Python, Flask, Flask-CORS, Gunicorn |
| ML | scikit-learn (TF-IDF + Cosine Similarity) |
| Auth & DB | Firebase Auth, Firestore |
| APIs | TMDB API, Anthropic Claude API |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
sceniq/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── pages/     # Browse, Discover, ForYou, Home, Watchlist, Profile
│   │   ├── components/# Navbar, Footer, MovieCard, AIChatPanel, AuthModal...
│   │   ├── context/   # AuthContext, ModalContext, RecentContext
│   │   ├── hooks/     # useMovieSearch, useDebounce, useRecentlyViewed
│   │   └── services/  # api.js, firebase.js
│   └── public/        # manifest.json, icons, sw.js
└── backend/           # Flask API
    ├── app.py         # API routes
    ├── recommender.py # ML recommendation engine
    └── requirements.txt
```

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Node.js 18+
- Python 3.10+
- TMDB API key
- Firebase project
- Anthropic API key

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

### Environment Variables

**`frontend/.env`**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:5000
```

**`backend/.env`**
```
TMDB_API_KEY=
ANTHROPIC_API_KEY=
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 🎓 Built By

**Pranav** — Final Year B.Tech, AI & Data Science  
Vasantdada Patil Pratishthan's College of Engineering, Mumbai

---

## 📄 License

MIT License — free to use and modify.
