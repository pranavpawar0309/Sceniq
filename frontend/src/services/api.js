// src/services/api.js
// All calls to the Flask backend live here.
// Components never call fetch() directly — always use this module.

import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const client = axios.create({
  baseURL: BASE,
  timeout: 30000,
})

// ── Health check ──────────────────────────────────────────────
export const checkHealth = () => client.get('/health').then((r) => r.data)

// ── Autocomplete search ───────────────────────────────────────
// Returns [{id, title, year}] for the dropdown
export const searchTitles = (query) =>
  client.get('/search', { params: { q: query } }).then((r) => r.data)

// ── Find similar movies by title (ML cosine similarity) ───────
// Returns { source_movie, recommendations: Movie[] }
export const getSimilarMovies = (title, limit = 12) =>
  client
    .get('/similar', { params: { title, limit } })
    .then((r) => r.data)

// ── Find movies by natural-language description (TF-IDF) ──────
// Returns Movie[]
export const getMoviesByDescription = (description, limit = 12) =>
  client
    .post('/describe', { description, limit })
    .then((r) => r.data)

// ── Get full movie details ────────────────────────────────────
export const getMovieDetail = (tmdbId) =>
  client.get(`/movie/${tmdbId}`).then((r) => r.data)

// ── Browse / trending ─────────────────────────────────────────
export const getTrending = (limit = 20, sort = 'popular', language = '') =>
  client.get('/trending', { params: { limit, sort, ...(language && { language }) } }).then((r) => r.data)

// ── Genre list ────────────────────────────────────────────────
export const getGenres = () =>
  client.get('/genres').then((r) => r.data)

// ── Browse by genre ───────────────────────────────────────────
export const browseByGenre = (genre, limit = 40, language = '') =>
  client.get('/browse', { params: { genre, limit, ...(language && { language }) } }).then((r) => r.data)

export const getTrailer = (tmdbId) =>
  client.get(`/trailer/${tmdbId}`).then((r) => r.data)

// ── Axios error helper ────────────────────────────────────────
export const getApiError = (err) => {
  if (err?.response?.data?.error) return err.response.data.error
  if (err?.message === 'Network Error')
    return 'Cannot reach the server. Make sure the backend is running.'
  return 'Something went wrong. Please try again.'
}
