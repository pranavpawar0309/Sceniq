// src/hooks/useRecentlyViewed.js
// Tracks the last 20 movies the user clicked on.
// Persists in localStorage so it survives page refreshes.
// No backend needed — pure client-side.

import { useState, useCallback, useEffect } from 'react'

const KEY      = 'cm_recently_viewed'
const MAX_ITEMS = 20

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

const save = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
}

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState(load)

  // Add a movie to the front of the list, deduplicated
  const addToRecent = useCallback((movie) => {
    if (!movie?.tmdb_id) return
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((m) => m.tmdb_id !== movie.tmdb_id)
      const entry = {
        tmdb_id:  movie.tmdb_id,
        title:    movie.title,
        year:     movie.year,
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
        viewedAt: new Date().toISOString(),
      }
      const next = [entry, ...filtered].slice(0, MAX_ITEMS)
      save(next)
      return next
    })
  }, [])

  const clearRecent = useCallback(() => {
    localStorage.removeItem(KEY)
    setRecentlyViewed([])
  }, [])

  return { recentlyViewed, addToRecent, clearRecent }
}
