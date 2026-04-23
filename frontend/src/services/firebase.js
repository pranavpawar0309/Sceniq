// src/services/firebase.js
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

// ── Auth ──────────────────────────────────────────────────────

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider)
  await ensureUserDoc(result.user)
  return result.user
}

export const signUpWithEmail = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  await ensureUserDoc(cred.user, name)
  return cred.user
}

export const signInWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  // Always ensure doc exists on login too
  await ensureUserDoc(cred.user)
  return cred.user
}

export const logOut = () => signOut(auth)
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

// ── Firestore ─────────────────────────────────────────────────

// Always use setDoc+merge — works whether doc exists or not
const userRef = (uid) => doc(db, 'users', uid)

const ensureUserDoc = async (user, displayName = null) => {
  const ref  = userRef(user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         user.uid,
      displayName: displayName || user.displayName || 'Movie Fan',
      email:       user.email || '',
      photoURL:    user.photoURL || null,
      watchlist:   [],
      ratings:     {},
      createdAt:   serverTimestamp(),
    })
  }
}

export const getUserData = async (uid) => {
  const snap = await getDoc(userRef(uid))
  return snap.exists() ? snap.data() : null
}

export const addToWatchlist = async (uid, movie) => {
  const entry = {
    tmdb_id:  movie.tmdb_id,
    title:    movie.title,
    year:     movie.year   || '',
    poster:   movie.poster || null,
    rating:   movie.rating || null,
    genres:   movie.genres || [],
    overview: movie.overview || '',
    director: movie.director || '',
    cast:     movie.cast || [],
    keywords: movie.keywords || [],
    language: movie.language || '',
    backdrop: movie.backdrop || null,
    tagline:  movie.tagline || '',
    imdb_id:  movie.imdb_id || '',
    runtime:  movie.runtime || 0,
    addedAt:  new Date().toISOString(),
  }
  // Read current watchlist, add entry, write back with merge
  const snap    = await getDoc(userRef(uid))
  const current = snap.exists() ? (snap.data().watchlist || []) : []
  // Deduplicate just in case
  const filtered = current.filter(m => m.tmdb_id !== entry.tmdb_id)
  await setDoc(userRef(uid), { watchlist: [...filtered, entry] }, { merge: true })
  return entry
}

export const removeFromWatchlist = async (uid, movie) => {
  const snap    = await getDoc(userRef(uid))
  const current = snap.exists() ? (snap.data().watchlist || []) : []
  const filtered = current.filter(m => m.tmdb_id !== movie.tmdb_id)
  await setDoc(userRef(uid), { watchlist: filtered }, { merge: true })
}

export const saveRating = async (uid, movieId, rating) => {
  await setDoc(userRef(uid), { ratings: { [movieId]: rating } }, { merge: true })
}

// ── Friendly auth errors ──────────────────────────────────────
export const friendlyAuthError = (code) => {
  const map = {
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}

// ── Watched list ──────────────────────────────────────────────
export const addToWatched = async (uid, movie) => {
  const entry = {
    tmdb_id:   movie.tmdb_id,
    title:     movie.title,
    year:      movie.year    || '',
    poster:    movie.poster  || null,
    rating:    movie.rating  || null,
    genres:    movie.genres  || [],
    watchedAt: new Date().toISOString(),
  }
  const snap    = await getDoc(userRef(uid))
  const current = snap.exists() ? (snap.data().watched || []) : []
  const filtered = current.filter(m => m.tmdb_id !== entry.tmdb_id)
  await setDoc(userRef(uid), { watched: [...filtered, entry] }, { merge: true })
  return entry
}

export const removeFromWatched = async (uid, movie) => {
  const snap    = await getDoc(userRef(uid))
  const current = snap.exists() ? (snap.data().watched || []) : []
  const filtered = current.filter(m => m.tmdb_id !== movie.tmdb_id)
  await setDoc(userRef(uid), { watched: filtered }, { merge: true })
}
