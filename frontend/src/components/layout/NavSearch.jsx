// src/components/layout/NavSearch.jsx
import React, { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { searchTitles, getSimilarMovies } from '../../services/api'
import { useModal } from '../../context/ModalContext'
import styles from './NavSearch.module.css'

const NavSearch = () => {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState(false)
  const debounced  = useDebounce(query, 250)
  const wrapRef    = useRef(null)
  const inputRef   = useRef(null)
  const { openModal } = useModal()

  // Fetch results — now returns full movie objects so we have posters
  useEffect(() => {
    if (debounced.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    // Use the /similar endpoint source_movie to get full data including poster
    // But first just show autocomplete titles quickly
    searchTitles(debounced)
      .then(data => {
        setResults(data)
        setOpen(data.length > 0)
      })
      .catch(() => setOpen(false))
      .finally(() => setLoading(false))
  }, [debounced])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setExpanded(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = async (item) => {
    setOpen(false); setExpanded(false); setQuery('')
    try {
      const data = await getSimilarMovies(item.title, 1)
      if (data.source_movie) openModal(data.source_movie)
    } catch { /* silent fail */ }
  }

  const handleExpand = () => {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleClear = () => {
    setQuery(''); setResults([]); setOpen(false); setExpanded(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Escape') handleClear()
    if (e.key === 'Enter' && results.length > 0) handleSelect(results[0])
  }

  return (
    <div className={[styles.wrap, expanded ? styles.expanded : ''].join(' ')} ref={wrapRef}>
      {!expanded ? (
        <button className={styles.iconBtn} onClick={handleExpand} aria-label="Search">
          <Search size={17} />
        </button>
      ) : (
        <div className={styles.inputWrap}>
          <Search size={15} className={styles.inputIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search movies..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
          />
          {loading && <span className={styles.spinner} />}
          {query && !loading && (
            <button className={styles.clearBtn} onClick={handleClear}>
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Dropdown with posters */}
      {open && expanded && (
        <div className={styles.dropdown}>
          {results.map(item => (
            <button key={item.id} className={styles.result} onClick={() => handleSelect(item)}>
              {/* Poster thumbnail */}
              <div className={styles.resultPoster}>
                {item.poster
                  ? <img src={item.poster} alt={item.title} className={styles.resultPosterImg} />
                  : <div className={styles.resultPosterFallback}>{(item.title||'').slice(0,2).toUpperCase()}</div>
                }
              </div>
              <div className={styles.resultInfo}>
                <span className={styles.resultTitle}>{item.title}</span>
                <span className={styles.resultMeta}>{item.year}{item.genre ? ` · ${item.genre}` : ''}</span>
              </div>
              <span className={styles.resultYear}>{item.rating ? `★ ${item.rating}` : ''}</span>
            </button>
          ))}
          <div className={styles.hint}>Enter to open first result · Esc to close</div>
        </div>
      )}
    </div>
  )
}

export default NavSearch
