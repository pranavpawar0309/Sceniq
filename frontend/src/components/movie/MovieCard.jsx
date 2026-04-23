// src/components/movie/MovieCard.jsx
import React, { useState } from 'react'
import { Bookmark, BookmarkCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import { useInView } from 'react-intersection-observer'
import toast from 'react-hot-toast'
import styles from './MovieCard.module.css'

const MovieCard = ({ movie, showSimilarity = false }) => {
  const { isInWatchlist, toggleWatchlist, isWatched, toggleWatched, user, ratings } = useAuth()
  const { openModal, openAuthModal } = useModal()
  const [imgError,      setImgError]      = useState(false)
  const [wlLoading,     setWlLoading]     = useState(false)
  const [watchedLoading,setWatchedLoading]= useState(false)
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' })

  const inWatchlist = isInWatchlist(movie.tmdb_id)
  const watched     = isWatched(movie.tmdb_id)
  const userRating  = ratings?.[movie.tmdb_id] || 0

  const handleWatchlist = async (e) => {
    e.stopPropagation(); e.preventDefault()
    if (!user) { openAuthModal(); return }
    if (!movie?.tmdb_id) return
    setWlLoading(true)
    try {
      const added = await toggleWatchlist(movie)
      toast.success(added ? `Added to watchlist ⭐` : 'Removed from watchlist')
    } catch { toast.error('Could not update watchlist.') }
    finally { setWlLoading(false) }
  }

  const handleWatched = async (e) => {
    e.stopPropagation(); e.preventDefault()
    if (!user) { openAuthModal(); toast('Sign in to mark movies as watched'); return }
    setWatchedLoading(true)
    try {
      const marked = await toggleWatched(movie)
      toast.success(marked ? `Marked as watched ✓` : 'Removed from watched')
    } catch { toast.error('Could not update.') }
    finally { setWatchedLoading(false) }
  }

  const posterBg = getPosterBg(movie.title)

  return (
    <div ref={ref} className={styles.card} onClick={() => openModal(movie)}>
      <div className={styles.posterWrap}>
        {inView && movie.poster && !imgError ? (
          <img src={movie.poster} alt={movie.title} className={styles.poster}
            loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className={styles.posterFallback} style={{ background: posterBg }}>
            {movie.title.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Watched overlay on poster */}
        {watched && (
          <div className={styles.watchedOverlay}>
            <div className={styles.watchedCheck}>✓</div>
            <span className={styles.watchedText}>Watched</span>
          </div>
        )}

        {/* IMDb badge */}
        {movie.rating > 0 && (
          <div className={styles.imdbBadge}>
            <span className={styles.imdbText}>IMDb</span>
            <span className={styles.imdbRating}>{movie.rating}</span>
          </div>
        )}

        {/* Watchlist button */}
        <button
          className={[styles.wlBtn, inWatchlist ? styles.wlActive : ''].join(' ')}
          onClick={handleWatchlist}
          disabled={wlLoading}
          title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {wlLoading
            ? <span className={styles.wlSpinner} />
            : inWatchlist ? <BookmarkCheck size={13} /> : <Bookmark size={13} />
          }
        </button>

        {/* Watched button */}
        <button
          className={[styles.watchedBtn, watched ? styles.watchedBtnActive : ''].join(' ')}
          onClick={handleWatched}
          disabled={watchedLoading}
          title={watched ? 'Mark as unwatched' : 'Mark as watched'}
        >
          {watchedLoading
            ? <span className={styles.wlSpinner} />
            : watched ? <Eye size={13} /> : <EyeOff size={13} />
          }
        </button>

        {/* Hover overlay */}
        <div className={styles.overlay}>
          <div className={styles.overlayGenres}>
            {(movie.genres || []).slice(0, 2).map(g => (
              <span key={g} className={styles.overlayGenre}>{g}</span>
            ))}
          </div>
          <p className={styles.overlayDesc}>
            {movie.overview
              ? movie.overview.slice(0, 110) + (movie.overview.length > 110 ? '…' : '')
              : 'No description available.'}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className={styles.body}>
        <div className={styles.title}>{movie.title}</div>
        <div className={styles.meta}>
          <span className={styles.year}>{movie.year || '—'}</span>
          <div className={styles.metaRight}>
            {userRating > 0 && (
              <span className={styles.userRatingBadge} title={`Your rating: ${userRating}/5`}>
                <span className={styles.userRatingIcon}>♥</span>
                {userRating}/5
              </span>
            )}
            <span className={styles.rating}>★ {movie.rating || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const getPosterBg = (title = '') => {
  const colors = [
    'linear-gradient(135deg,#1a2a4a,#0a1525)',
    'linear-gradient(135deg,#2a0a1a,#150510)',
    'linear-gradient(135deg,#1a2a0a,#0d1506)',
    'linear-gradient(135deg,#2a1a0a,#150d05)',
    'linear-gradient(135deg,#1a0a2a,#0d0515)',
    'linear-gradient(135deg,#0a1a2a,#050d15)',
    'linear-gradient(135deg,#2a1a1a,#150d0d)',
    'linear-gradient(135deg,#0a2a1a,#05150d)',
  ]
  return colors[title.charCodeAt(0) % colors.length]
}

export default MovieCard
