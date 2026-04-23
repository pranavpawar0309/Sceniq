# Sceniq — Complete Setup Guide
## From zero to a live, public website — step by step

---

## What you're building

```
sceniq-v2/
├── frontend/                  ← React + Vite app (deploy to Vercel)
│   ├── src/
│   │   ├── App.jsx            ← Router + providers
│   │   ├── main.jsx           ← React entry point
│   │   ├── index.css          ← Design tokens + global styles
│   │   ├── pages/             ← 5 pages: Home, Discover, Watchlist, Profile, 404
│   │   ├── components/
│   │   │   ├── layout/        ← Navbar, Footer
│   │   │   ├── movie/         ← MovieCard, MovieGrid, MovieModal
│   │   │   └── ui/            ← Button, Badge, AuthModal
│   │   ├── context/           ← AuthContext, ModalContext
│   │   ├── hooks/             ← useDebounce, useMovieSearch
│   │   └── services/          ← firebase.js, api.js
│   └── package.json
└── backend/                   ← Python Flask API (deploy to Render)
    ├── app.py                 ← All API endpoints
    ├── recommender.py         ← TF-IDF ML engine
    └── requirements.txt
```

---

## STEP 1 — Get Your API Keys (all free, takes ~10 minutes)

### A) TMDB API Key
1. Go to https://www.themoviedb.org/signup → create account
2. Go to https://www.themoviedb.org/settings/api
3. Click **Create** → Developer → fill the short form
4. Copy your **API Key (v3 auth)** — 90ae3b6d8336064a4c83f11891b06cc0

### B) Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `sceniq` → Continue → Create project

**Enable Authentication:**
- Left sidebar → **Authentication** → Get started
- **Sign-in method** tab → Enable **Email/Password** → Save
- **Sign-in method** tab → Enable **Google** → set project support email → Save

**Enable Firestore:**
- Left sidebar → **Firestore Database** → Create database
- Choose **Start in production mode** → pick your nearest region → Enable

**Get your web config:**
- Click the gear ⚙ → **Project Settings** → **Your apps** → click `</>` (Web)
- Register app with nickname `sceniq-web`
- Copy the entire `firebaseConfig` object — you'll need it in Step 3
npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBhJNF3HscU108hK5gVeG0iRWb0GPxE14",
  authDomain: "sceniq-41f37.firebaseapp.com",
  projectId: "sceniq-41f37",
  storageBucket: "sceniq-41f37.firebasestorage.app",
  messagingSenderId: "834533988819",
  appId: "1:834533988819:web:9a4f41eec966bf7110b726"
};'

// Initialize Firebase
const app = initializeApp(firebaseConfig);"
---

## STEP 2 — Run the Backend Locally

```bash
cd sceniq-v2/backend

# Create a virtual environment
python -m venv venv

# Activate it
source venv/bin/activate       # Mac / Linux
venv\Scripts\activate          # Windows

# Install Python packages
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Open .env in your editor and paste your TMDB API key:
# TMDB_API_KEY=a1b2c3d4e5f6...

# Start the server
python app.py
```

**What happens on first boot:**
- The server fetches ~500 movies from TMDB (takes about 2–3 minutes)
- It builds a TF-IDF matrix and saves a `movies_cache.pkl` file
- Every restart after that is instant (loads from cache)

**Test that it works:**
```bash
# In a new terminal
curl http://localhost:5000/health
# Should return: {"status": "ok", "movies_loaded": 450}

curl "http://localhost:5000/similar?title=Inception"
# Should return a JSON list of similar movies

curl "http://localhost:5000/trending?limit=5"
# Should return top 5 trending movies
```

---

## STEP 3 — Configure the Frontend

### 3a. Install dependencies
```bash
cd sceniq-v2/frontend
npm install
```

### 3b. Create your .env file
```bash
cp .env.example .env
```

Open `frontend/.env` and fill in your Firebase values:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=sceniq-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sceniq-12345
VITE_FIREBASE_STORAGE_BUCKET=sceniq-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Point to local backend for now
VITE_API_URL=http://localhost:5000
```

### 3c. Start the frontend dev server
```bash
npm run dev
# Opens at http://localhost:3000
```

You now have the full site running locally. Try:
- Browsing the home page
- Clicking **Discover** and searching for a movie
- Signing up with email
- Adding movies to your watchlist

---

## STEP 4 — Set Up Firestore Security Rules

In Firebase Console → **Firestore Database** → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read and write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

---

## STEP 5 — Deploy the Backend to Render (free)

1. Push your project to GitHub:
```bash
cd sceniq-v2
git init
git add .
git commit -m "Initial commit — Sceniq"
# Create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/sceniq.git
git branch -M main
git push -u origin main
```

2. Go to https://render.com → sign up (free) → **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name:** `sceniq-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free

5. Under **Environment Variables**, add:
   - `TMDB_API_KEY` = your TMDB key
   - `ALLOWED_ORIGINS` = `*` (you'll lock this down after deploying frontend)

6. Click **Create Web Service** — Render will deploy it.
7. Copy your backend URL: `https://sceniq-backend.onrender.com`

> ⚠️ **Free tier note:** Render's free tier spins down after 15 minutes of inactivity.
> The first request after sleep takes ~30 seconds to wake up.
> Upgrade to **Starter ($7/mo)** for always-on.

---

## STEP 6 — Deploy the Frontend to Vercel (free)

1. Go to https://vercel.com → sign up with GitHub
2. Click **New Project** → import your GitHub repo
3. Set:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Under **Environment Variables**, add all your `VITE_*` values from Step 3b,
   **plus** update the API URL:
   - `VITE_API_URL` = `https://sceniq-backend.onrender.com`

5. Click **Deploy** → Vercel gives you a URL like `https://sceniq.vercel.app`

---

## STEP 7 — Final Config

### Add your Vercel domain to Firebase authorized domains:
- Firebase Console → **Authentication** → **Settings** → **Authorized domains**
- Click **Add domain** → paste `sceniq.vercel.app`

### Lock down CORS on Render:
- Render dashboard → your service → **Environment** → update `ALLOWED_ORIGINS`:
  ```
  ALLOWED_ORIGINS=https://sceniq.vercel.app
  ```
- Click **Save Changes** → Render redeploys automatically

### (Optional) Custom domain:
- In Vercel: **Settings** → **Domains** → add your domain
- Point your domain's DNS to Vercel as instructed

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot reach the server" on Discover page | Check `VITE_API_URL` in Vercel env vars points to your Render URL |
| Google sign-in popup closes with no login | Add your Vercel domain to Firebase authorized domains |
| Movies not loading | Verify `TMDB_API_KEY` is set in Render environment variables |
| Render takes 30s to respond | Expected on free tier (cold start). Upgrade to Starter for always-on |
| CORS errors in browser console | Set `ALLOWED_ORIGINS` on Render to your exact Vercel URL |
| Watchlist not saving | Check Firestore security rules allow authenticated writes |
| Build fails on Vercel | Make sure `Root Directory` is set to `frontend`, not the repo root |

---

## How the ML Works

```
TMDB API → 400-600 movies fetched
         ↓
For each movie, build a "soup" string:
  overview × 2 + genres × 3 + keywords × 2 + cast + director × 2 + tagline
         ↓
TfidfVectorizer (20,000 features, unigrams + bigrams)
  → one row per movie in the TF-IDF matrix
         ↓
┌─────────────────────────────────────────────────────┐
│ Search by title:                                    │
│   find row for query movie → cosine_similarity()   │
│   → sort by score → return top N                   │
├─────────────────────────────────────────────────────┤
│ Search by description:                              │
│   vectorizer.transform(user_text)                  │
│   → cosine_similarity() against full matrix        │
│   → sort by score → return top N                   │
└─────────────────────────────────────────────────────┘
         ↓
Cache everything in movies_cache.pkl
(rebuilds only when you delete the cache file)
```

This is **content-based filtering** — the same core approach used by Netflix
and Spotify for item-to-item recommendations.

---

## File Structure Reference

```
sceniq-v2/
├── .gitignore
├── render.yaml
├── SETUP.md
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   ├── .env.example
│   ├── public/
│   │   └── icon.svg
│   └── src/
│       ├── App.jsx                  ← Routes + providers
│       ├── main.jsx                 ← React entry
│       ├── index.css                ← Design tokens
│       ├── services/
│       │   ├── firebase.js          ← Auth + Firestore
│       │   └── api.js               ← Backend calls
│       ├── context/
│       │   ├── AuthContext.jsx      ← Auth state (user, watchlist, ratings)
│       │   └── ModalContext.jsx     ← Movie + auth modal control
│       ├── hooks/
│       │   ├── useDebounce.js
│       │   └── useMovieSearch.js    ← Both search modes
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx + .module.css
│       │   │   └── Footer.jsx + .module.css
│       │   ├── movie/
│       │   │   ├── MovieCard.jsx + .module.css
│       │   │   ├── MovieGrid.jsx + .module.css
│       │   │   └── MovieModal.jsx + .module.css
│       │   └── ui/
│       │       ├── Button.jsx + .module.css
│       │       ├── Badge.jsx + .module.css
│       │       └── AuthModal.jsx + .module.css
│       └── pages/
│           ├── HomePage.jsx + .module.css
│           ├── DiscoverPage.jsx + .module.css
│           ├── WatchlistPage.jsx + .module.css
│           ├── ProfilePage.jsx + .module.css
│           └── NotFoundPage.jsx + .module.css
│
└── backend/
    ├── app.py                       ← Flask API (6 endpoints)
    ├── recommender.py               ← TF-IDF ML engine
    ├── requirements.txt
    ├── .env.example
    └── render.yaml
```
