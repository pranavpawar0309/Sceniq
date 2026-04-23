// src/components/movie/MovieModal.jsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bookmark, BookmarkCheck, ExternalLink, Star, Clock, Globe, Tv } from 'lucide-react'
import { useModal } from '../../context/ModalContext'
import { useAuth } from '../../context/AuthContext'
import { useRecent } from '../../context/RecentContext'
import { getSimilarMovies, getTrailer } from '../../services/api'
import StarRating from '../ui/StarRating'
import Badge from '../ui/Badge'
import toast from 'react-hot-toast'
import styles from './MovieModal.module.css'

const MovieModal = () => {
  const { modalMovie, closeModal, openModal, openAuthModal } = useModal()
  const { user, isInWatchlist, toggleWatchlist, rateMovie, ratings, isWatched, toggleWatched } = useAuth()
  const { addToRecent } = useRecent()
  const [similar,        setSimilar]        = useState([])
  const [simLoading,     setSimLoading]     = useState(false)
  const [imgError,       setImgError]       = useState(false)
  const [wlLoading,      setWlLoading]      = useState(false)
  const [trailerLoading,  setTrailerLoading]  = useState(false)
  const [watchedLoading, setWatchedLoading] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeModal])

  useEffect(() => {
    if (modalMovie) {
      document.body.style.overflow = 'hidden'
      setImgError(false)
      setSimilar([])
      addToRecent(modalMovie)
      fetchSimilar(modalMovie.title)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalMovie])

  const fetchSimilar = async (title) => {
    setSimLoading(true)
    try {
      const data = await getSimilarMovies(title, 6)
      setSimilar(data.recommendations || [])
    } catch { setSimilar([]) }
    finally { setSimLoading(false) }
  }

  const handleWatchlist = async () => {
    if (!user) { openAuthModal(); return }
    setWlLoading(true)
    const added = await toggleWatchlist(modalMovie)
    toast.success(added ? 'Added to watchlist ⭐' : 'Removed from watchlist')
    setWlLoading(false)
  }

  const handleRate = async (val) => {
    if (!user) { openAuthModal(); return false }
    const ok = await rateMovie(modalMovie.tmdb_id, val)
    if (ok) toast.success(`Rated ${val}/5 ★`)
    return ok
  }

  const handleWatched = async () => {
    if (!user) { openAuthModal(); return }
    setWatchedLoading(true)
    const marked = await toggleWatched(modalMovie)
    toast.success(marked ? 'Marked as watched ✓' : 'Removed from watched')
    setWatchedLoading(false)
  }

  // Fetch real trailer ID from TMDB then open YouTube in new tab
  const handleTrailer = async () => {
    setTrailerLoading(true)
    try {
      const data = await getTrailer(modalMovie.tmdb_id)
      if (data.key) {
        window.open(`https://www.youtube.com/watch?v=${data.key}`, '_blank')
      } else {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(modalMovie.title + ' official trailer')}`, '_blank')
      }
    } catch {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(modalMovie.title + ' official trailer')}`, '_blank')
    } finally {
      setTrailerLoading(false)
    }
  }

  const handleSimilarClick = (movie) => {
    closeModal()
    setTimeout(() => openModal(movie), 120)
  }

  if (!modalMovie) return null
  const m = modalMovie
  const inWatchlist   = isInWatchlist(m.tmdb_id)
  const movieWatched  = isWatched(m.tmdb_id)
  const currentRating = ratings?.[m.tmdb_id] || 0

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <button className={styles.closeBtn} onClick={closeModal}><X size={16} /></button>

          {/* Backdrop */}
          <div className={styles.backdropWrap}>
            {m.backdrop && !imgError
              ? <img src={m.backdrop} alt="" className={styles.backdrop} onError={() => setImgError(true)} />
              : <div className={styles.backdropFallback}>{m.title.slice(0, 4).toUpperCase()}</div>
            }
            <div className={styles.backdropGradient} />
            <button className={styles.trailerBtn} onClick={handleTrailer} disabled={trailerLoading}>
              {trailerLoading
                ? <span className={styles.trailerSpinner} />
                : <span className={styles.playCircle}>▶</span>
              }
              {trailerLoading ? 'Loading...' : 'Watch Trailer'}
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <div className={styles.titleRow}>
              <div>
                <h2 className={styles.title}>{m.title}</h2>
                {m.tagline && <p className={styles.tagline}>"{m.tagline}"</p>}
              </div>
              <div className={styles.actions}>
                <button
                  className={[styles.wlBtn, inWatchlist ? styles.wlActive : ''].join(' ')}
                  onClick={handleWatchlist}
                  disabled={wlLoading}
                >
                  {inWatchlist ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  {inWatchlist ? 'Saved' : 'Watchlist'}
                </button>
                <button
                  className={[styles.watchedModalBtn, movieWatched ? styles.watchedModalActive : ''].join(' ')}
                  onClick={handleWatched}
                  disabled={watchedLoading}
                >
                  {movieWatched ? '✓ Watched' : '◯ Watched'}
                </button>
                <a href={`https://www.justwatch.com/in/search?q=${encodeURIComponent(m.title)}`}
                  target="_blank" rel="noreferrer" className={styles.watchBtn}>
                  <Tv size={13} /> Where to Watch
                </a>
                {m.imdb_id && (
                  <a href={`https://www.imdb.com/title/${m.imdb_id}`}
                    target="_blank" rel="noreferrer" className={styles.imdbBtn}>
                    <ExternalLink size={13} /> IMDb
                  </a>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className={styles.badges}>
              {m.rating > 0 && <Badge variant="imdb">★ {m.rating}</Badge>}
              {m.year     && <Badge variant="default">{m.year}</Badge>}
              {m.runtime  && <Badge variant="default"><Clock size={10} style={{marginRight:3}}/>{m.runtime} min</Badge>}
              {m.language && m.language !== 'en' && <Badge variant="default"><Globe size={10} style={{marginRight:3}}/>{m.language.toUpperCase()}</Badge>}
              {(m.genres||[]).map(g => <Badge key={g} variant="genre">{g}</Badge>)}
            </div>

            {/* Your Rating */}
            <div className={styles.ratingRow}>
              <span className={styles.ratingLabel}>Your Rating</span>
              <StarRating movieId={m.tmdb_id} initialRating={currentRating} onRate={handleRate} size="md" />
              {!user && (
                <span className={styles.ratingHint}>
                  <button className={styles.signInLink} onClick={openAuthModal}>Sign in</button> to rate
                </span>
              )}
            </div>

            <p className={styles.overview}>{m.overview || 'No description available.'}</p>

            <div className={styles.credits}>
              {m.director && <div className={styles.credit}><span className={styles.creditLabel}>Director</span><span className={styles.creditValue}>{m.director}</span></div>}
              {m.cast?.length > 0 && <div className={styles.credit}><span className={styles.creditLabel}>Cast</span><span className={styles.creditValue}>{m.cast.slice(0,5).join(', ')}</span></div>}
              {m.keywords?.length > 0 && <div className={styles.credit}><span className={styles.creditLabel}>Keywords</span><span className={styles.creditValue}>{m.keywords.slice(0,6).join(', ')}</span></div>}
            </div>

            <div className={styles.similarSection}>
              <div className={styles.similarLabel}>More Like This</div>
              {simLoading ? (
                <div className={styles.simGrid}>{Array.from({length:6}).map((_,i)=><div key={i} className={styles.simSkeleton}/>)}</div>
              ) : (
                <div className={styles.simGrid}>
                  {similar.map(s => (
                    <div key={s.tmdb_id} className={styles.simCard} onClick={() => handleSimilarClick(s)}>
                      {s.poster ? <img src={s.poster} alt={s.title} className={styles.simPoster}/> : <div className={styles.simPosterFallback}>{s.title.slice(0,2).toUpperCase()}</div>}
                      <div className={styles.simName}>{s.title}</div>
                      <div className={styles.simRating}><Star size={9} fill="currentColor"/> {s.rating}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MovieModal
