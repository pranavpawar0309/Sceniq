// src/pages/WatchlistPage.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useModal } from '../context/ModalContext'
import MovieGrid from '../components/movie/MovieGrid'
import styles from './WatchlistPage.module.css'

const WatchlistPage = () => {
  const { user, watchlist } = useAuth()
  const { openAuthModal } = useModal()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔒</div>
          <h2 className={styles.emptyTitle}>Sign In to See Your Watchlist</h2>
          <p className={styles.emptySub}>Join Sceniq free to start saving movies.</p>
          <button className={styles.btn} onClick={openAuthModal}>Sign In</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <div className={styles.eyebrow}>⭐ Your Collection</div>
              <h1 className={styles.title}>My Watchlist</h1>
              <p className={styles.subtitle}>
                {watchlist.length > 0
                  ? `${watchlist.length} movie${watchlist.length !== 1 ? 's' : ''} saved`
                  : 'No movies saved yet'}
              </p>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎬</div>
              <h2 className={styles.emptyTitle}>Nothing Here Yet</h2>
              <p className={styles.emptySub}>
                Find movies you want to watch and tap the bookmark icon to save them.
              </p>
              <button className={styles.btn} onClick={() => navigate('/discover')}>
                Discover Movies
              </button>
            </div>
          ) : (
            <MovieGrid movies={watchlist} />
          )}
        </div>
      </div>
    </div>
  )
}

export default WatchlistPage
