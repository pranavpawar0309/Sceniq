// src/hooks/useMovieSearch.js
// Encapsulates both search modes (similar + describe).
// Pages import this hook; they never call the API directly.

import { useState, useCallback } from 'react'
import { getSimilarMovies, getMoviesByDescription, getApiError } from '../services/api'

export const useMovieSearch = () => {
  const [results,     setResults]     = useState([])
  const [sourceMovie, setSourceMovie] = useState(null) // for "similar" mode
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [mode,        setMode]        = useState(null) // 'similar' | 'describe'
  const [query,       setQuery]       = useState('')

  const searchSimilar = useCallback(async (title) => {
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    setMode('similar')
    setQuery(title)
    setSourceMovie(null)
    setResults([])
    try {
      const data = await getSimilarMovies(title, 18)
      if (data.error) {
        setError({ message: data.error, suggestions: data.suggestions })
      } else {
        setSourceMovie(data.source_movie)
        setResults(data.recommendations)
      }
    } catch (err) {
      setError({ message: getApiError(err) })
    } finally {
      setLoading(false)
    }
  }, [])

  const searchByDescription = useCallback(async (description) => {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    setMode('describe')
    setQuery(description)
    setSourceMovie(null)
    setResults([])
    try {
      const data = await getMoviesByDescription(description, 18)
      setResults(data)
    } catch (err) {
      setError({ message: getApiError(err) })
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setSourceMovie(null)
    setLoading(false)
    setError(null)
    setMode(null)
    setQuery('')
  }, [])

  return {
    results,
    sourceMovie,
    loading,
    error,
    mode,
    query,
    searchSimilar,
    searchByDescription,
    reset,
    hasResults: results.length > 0,
  }
}
