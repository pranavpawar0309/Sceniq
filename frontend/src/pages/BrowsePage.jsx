// src/pages/BrowsePage.jsx
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getTrending, browseByGenre, getGenres } from '../services/api'
import MovieGrid from '../components/movie/MovieGrid'
import styles from './BrowsePage.module.css'

const SORT_OPTIONS = [
  { value: 'popular', label: '🔥 Trending Now' },
  { value: 'alltime', label: '🏆 All Time Best' },
]

const LANGUAGE_FILTERS = [
  { value: '',   label: 'All Languages' },
  { value: 'en', label: '🇺🇸 English' },
  { value: 'hi', label: '🇮🇳 Hindi' },
  { value: 'ta', label: '🇮🇳 Tamil' },
  { value: 'te', label: '🇮🇳 Telugu' },
  { value: 'ml', label: '🇮🇳 Malayalam' },
  { value: 'ko', label: '🇰🇷 Korean' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'fr', label: '🇫🇷 French' },
]

const BrowsePage = () => {
  const location = useLocation()
  const [movies,       setMovies]       = useState([])
  const [genres,       setGenres]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [sort,         setSort]         = useState(location.state?.sort || 'popular')
  const [activeGenre,  setActiveGenre]  = useState('')
  const [activeLang,   setActiveLang]   = useState('')
  const [limit,        setLimit]        = useState(36)

  // Load genres once
  useEffect(() => {
    getGenres().then(setGenres).catch(() => {})
  }, [])

  // Fetch whenever filters or limit change
  useEffect(() => {
    fetchMovies()
  }, [sort, activeGenre, activeLang, limit])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      let data = []
      if (activeGenre) {
        // Genre browse — pass language to backend
        data = await browseByGenre(activeGenre, limit, activeLang)
      } else {
        // Trending/alltime — pass language to backend
        data = await getTrending(limit, sort, activeLang)
      }
      setMovies(data)
    } catch (e) {
      console.error(e)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const handleGenre = (g) => setActiveGenre(g === activeGenre ? '' : g)
  const handleSort  = (s) => { setSort(s); setActiveGenre('') }
  const handleLang  = (l) => setActiveLang(l === activeLang ? '' : l)
  const loadMore    = () => setLimit(prev => prev + 36)

  const resetAll = () => {
    setActiveGenre('')
    setActiveLang('')
    setSort('popular')
    setLimit(36)
  }

  const pageTitle = activeGenre
    ? activeGenre + ' Movies'
    : sort === 'popular' ? 'Trending Now' : 'All Time Greatest'

  const activeLangLabel = LANGUAGE_FILTERS.find(l => l.value === activeLang)?.label || ''

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className="container">

          {/* Header */}
          <div className={styles.header}>
            <div>
              <div className={styles.eyebrow}>🎬 Full Catalog</div>
              <h1 className={styles.title}>{pageTitle}</h1>
              <p className={styles.subtitle}>
                {loading ? 'Loading…' : `${movies.length} movies`}
                {activeLangLabel && activeLangLabel !== 'All Languages' ? ` · ${activeLangLabel}` : ''}
              </p>
            </div>
          </div>

          {/* Sort tabs */}
          <div className={styles.sortRow}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={[styles.sortBtn, sort === opt.value && !activeGenre ? styles.sortActive : ''].join(' ')}
                onClick={() => handleSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Genre chips */}
          <div className={styles.genreRow}>
            {genres.map(g => (
              <button
                key={g}
                className={[styles.genreChip, activeGenre === g ? styles.genreActive : ''].join(' ')}
                onClick={() => handleGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Language filter */}
          <div className={styles.langRow}>
            {LANGUAGE_FILTERS.map(l => (
              <button
                key={l.value}
                className={[styles.langChip, activeLang === l.value ? styles.langActive : ''].join(' ')}
                onClick={() => handleLang(l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          {/* Grid */}
          <MovieGrid movies={movies} loading={loading} skeletonCount={36} />

          {/* Load more */}
          {!loading && movies.length >= limit && movies.length > 0 && (
            <div className={styles.loadMoreWrap}>
              <button className={styles.loadMoreBtn} onClick={loadMore}>
                Load More Movies
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && movies.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🎬</div>
              <p className={styles.emptyTitle}>No movies found</p>
              <p className={styles.emptySub}>
                {activeLang
                  ? `We don't have many ${activeLangLabel} movies yet. Try another language.`
                  : 'Try a different genre or language filter.'}
              </p>
              <button className={styles.resetBtn} onClick={resetAll}>
                Reset Filters
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default BrowsePage
