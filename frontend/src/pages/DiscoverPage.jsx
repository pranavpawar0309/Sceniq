// src/pages/DiscoverPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Sparkles, X } from 'lucide-react'
import { useMovieSearch } from '../hooks/useMovieSearch'
import { useDebounce } from '../hooks/useDebounce'
import { searchTitles } from '../services/api'
import MovieGrid from '../components/movie/MovieGrid'
import styles from './DiscoverPage.module.css'

const MOOD_PRESETS = [
  { label: '🧠 Psychological thriller', value: 'Dark psychological thriller with a mind-bending twist ending' },
  { label: '❤️ Romantic comedy',        value: 'Feel-good romantic comedy with heart and humour' },
  { label: '🚀 Epic sci-fi',            value: 'Epic science fiction adventure with big ideas and stunning visuals' },
  { label: '👻 Horror',                 value: 'Terrifying horror film with supernatural dread' },
  { label: '⚡ Action',                 value: 'High-octane action film with incredible set pieces' },
  { label: '🎭 Classic drama',          value: 'Award-winning prestige drama with powerful performances' },
  { label: '😂 Comedy',                 value: 'Hilarious comedy that will make me laugh out loud' },
  { label: '🌍 World cinema',           value: 'International arthouse film with cultural depth' },
]

const DiscoverPage = () => {
  const location = useLocation()
  const { results, sourceMovie, loading, error, mode, searchSimilar, searchByDescription, hasResults } = useMovieSearch()

  // Similar search state
  const [similarQuery, setSimilarQuery]   = useState('')
  const [acResults, setAcResults]         = useState([])
  const [acOpen, setAcOpen]               = useState(false)
  const acDebounced = useDebounce(similarQuery, 280)
  const acRef = useRef(null)

  // Description search state
  const [description, setDescription] = useState('')

  // Pre-fill from home page mood chips
  useEffect(() => {
    if (location.state?.prefillDescription) {
      setDescription(location.state.prefillDescription)
      searchByDescription(location.state.prefillDescription)
    }
  }, [])

  // Autocomplete
  useEffect(() => {
    if (acDebounced.length < 2) { setAcResults([]); setAcOpen(false); return }
    searchTitles(acDebounced)
      .then((data) => { setAcResults(data); setAcOpen(data.length > 0) })
      .catch(() => setAcOpen(false))
  }, [acDebounced])

  // Close AC on outside click
  useEffect(() => {
    const handler = (e) => { if (acRef.current && !acRef.current.contains(e.target)) setAcOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSimilarSubmit = (e) => {
    e?.preventDefault()
    if (!similarQuery.trim()) return
    setAcOpen(false)
    searchSimilar(similarQuery)
  }

  const handleAcSelect = (title) => {
    setSimilarQuery(title)
    setAcOpen(false)
    searchSimilar(title)
  }

  const handleDescSubmit = (e) => {
    e?.preventDefault()
    searchByDescription(description)
  }

  const handleKeyDown = (e, fn) => { if (e.key === 'Enter') fn() }

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        <div className="container">
          {/* Page header */}
          <div className={styles.header}>
            <div className={styles.eyebrow}>✦ Two ways to search</div>
            <h1 className={styles.title}>Discover Movies</h1>
            <p className={styles.subtitle}>
              Search by a title you love, or describe the vibe you want.
            </p>
          </div>

          {/* Twin search cards */}
          <div className={styles.twinGrid}>
            {/* ── Search 1: Similar by title ── */}
            <div className={styles.searchCard}>
              <div className={styles.cardLabel}>
                <Search size={13} /> Mode 1 · ML Similarity
              </div>
              <h2 className={styles.cardTitle}>Find Similar Movies</h2>
              <p className={styles.cardDesc}>
                Enter a movie title and our ML engine finds the closest matches
                using cosine similarity on genres, cast, director, and plot.
              </p>
              <form onSubmit={handleSimilarSubmit} ref={acRef} style={{ position: 'relative' }}>
                <div className={styles.inputWrap}>
                  <Search size={15} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Spider-Man, Inception, Parasite…"
                    value={similarQuery}
                    onChange={(e) => setSimilarQuery(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSimilarSubmit)}
                    autoComplete="off"
                  />
                  {similarQuery && (
                    <button type="button" className={styles.clearBtn} onClick={() => { setSimilarQuery(''); setAcOpen(false) }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button className={styles.searchBtn} type="submit" disabled={loading}>
                  {loading && mode === 'similar' ? <span className={styles.spinner} /> : 'Find →'}
                </button>

                {/* Autocomplete dropdown */}
                {acOpen && (
                  <div className={styles.acDropdown}>
                    {acResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.acItem}
                        onClick={() => handleAcSelect(item.title)}
                      >
                        <span className={styles.acTitle}>{item.title}</span>
                        <span className={styles.acYear}>{item.year}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* ── Search 2: Describe mood ── */}
            <div className={styles.searchCard}>
              <div className={styles.cardLabel}>
                <Sparkles size={13} /> Mode 2 · Natural Language
              </div>
              <h2 className={styles.cardTitle}>Describe What You Want</h2>
              <p className={styles.cardDesc}>
                Write freely about the mood, setting, tone, or themes you're after.
                Our model maps your words into the same space as movie metadata.
              </p>
              <form onSubmit={handleDescSubmit}>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="e.g. A dark, rainy neo-noir with a morally ambiguous detective and a shocking twist…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <button className={styles.searchBtn} type="submit" disabled={loading} style={{ marginTop: '0.75rem' }}>
                  {loading && mode === 'describe' ? <span className={styles.spinner} /> : 'Find Movies →'}
                </button>
              </form>

              {/* Preset mood chips */}
              <div className={styles.presets}>
                {MOOD_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={styles.presetChip}
                    onClick={() => { setDescription(p.value); searchByDescription(p.value) }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          {(hasResults || loading || error) && (
            <div className={styles.results}>
              {/* Source movie banner */}
              {sourceMovie && mode === 'similar' && (
                <div className={styles.sourceBanner}>
                  <div className={styles.sourceLabel}>Because you searched for</div>
                  <div className={styles.sourceCard}>
                    {sourceMovie.poster ? (
                      <img src={sourceMovie.poster} alt="" className={styles.sourcePoster} />
                    ) : (
                      <div className={styles.sourcePosterFallback}>
                        {sourceMovie.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className={styles.sourceTitle}>{sourceMovie.title}</div>
                      <div className={styles.sourceMeta}>
                        {sourceMovie.year} · ★ {sourceMovie.rating} · {(sourceMovie.genres || []).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results header */}
              {!error && (
                <div className={styles.resultsHeader}>
                  <h2 className={styles.resultsTitle}>
                    {mode === 'similar'
                      ? `Movies Similar to "${sourceMovie?.title || similarQuery}"`
                      : 'Movies Matching Your Description'}
                  </h2>
                  {!loading && (
                    <span className={styles.resultsCount}>
                      {results.length} results · ranked by{' '}
                      {mode === 'similar' ? 'ML cosine similarity' : 'relevance'}
                    </span>
                  )}
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className={styles.errorBox}>
                  <div className={styles.errorTitle}>🎬 {error.message}</div>
                  {error.suggestions?.length > 0 && (
                    <div className={styles.suggestions}>
                      Did you mean:{' '}
                      {error.suggestions.map((s) => (
                        <button
                          key={s.title}
                          className={styles.suggestionBtn}
                          onClick={() => { setSimilarQuery(s.title); searchSimilar(s.title) }}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <MovieGrid
                movies={results}
                loading={loading}
                showSimilarity={mode === 'similar'}
                skeletonCount={18}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DiscoverPage
