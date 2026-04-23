// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useModal } from '../context/ModalContext'
import { useRecent } from '../context/RecentContext'
import { getMovieDetail } from '../services/api'
import styles from './ProfilePage.module.css'

const StarDisplay = ({ rating }) => (
  <span className={styles.stars}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= rating ? 'var(--gold)' : 'var(--border-md)', fontSize: '0.85rem' }}>★</span>
    ))}
  </span>
)

const ProfilePage = () => {
  const { user, userData, watchlist, ratings, signOut } = useAuth()
  const { openAuthModal } = useModal()
  const { recentlyViewed, clearRecent } = useRecent()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview') // overview | ratings | watchlist | history
  const [ratedMovies, setRatedMovies] = useState([])
  const [ratedLoading, setRatedLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'ratings' && Object.keys(ratings || {}).length > 0) {
      loadRatedMovies()
    }
  }, [activeTab, ratings])

  const loadRatedMovies = async () => {
    setRatedLoading(true)
    const entries = Object.entries(ratings || {})
      .sort((a, b) => b[1] - a[1]) // highest rated first
    const movies = []
    for (const [id, rating] of entries) {
      // Try to find movie in recently viewed or watchlist first (no API call needed)
      const cached = [...recentlyViewed, ...watchlist].find(m => String(m.tmdb_id) === String(id))
      if (cached) {
        movies.push({ ...cached, userRating: rating })
      } else {
        try {
          const m = await getMovieDetail(Number(id))
          movies.push({ ...m, userRating: rating })
        } catch { /* skip */ }
      }
    }
    setRatedMovies(movies)
    setRatedLoading(false)
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>👤</div>
          <h2 className={styles.emptyTitle}>Sign In to View Profile</h2>
          <p className={styles.emptySub}>Join Sceniq free to track your movies and ratings.</p>
          <button className={styles.btn} onClick={openAuthModal}>Sign In</button>
        </div>
      </div>
    )
  }

  const initial      = (userData?.displayName || user.email || '?')[0].toUpperCase()
  const ratingValues = Object.values(ratings || {})
  const avgRating    = ratingValues.length
    ? (ratingValues.reduce((a,b) => a+b, 0) / ratingValues.length).toFixed(1)
    : '—'
  const ratingDist   = [5,4,3,2,1].map(star => ({
    star,
    count: ratingValues.filter(r => r === star).length,
    pct: ratingValues.length ? Math.round(ratingValues.filter(r => r === star).length / ratingValues.length * 100) : 0
  }))

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className="container-sm">

          {/* Profile card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrap}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                : <div className={styles.avatarFallback}>{initial}</div>
              }
            </div>
            <div className={styles.profileInfo}>
              <h1 className={styles.name}>{userData?.displayName || 'Movie Fan'}</h1>
              <p className={styles.email}>{user.email}</p>
              <p className={styles.joined}>
                Member since {userData?.createdAt
                  ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'recently'}
              </p>
            </div>
            <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
          </div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{watchlist.length}</div>
              <div className={styles.statLabel}>Watchlist</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{ratingValues.length}</div>
              <div className={styles.statLabel}>Rated</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{avgRating}</div>
              <div className={styles.statLabel}>Avg Rating</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{recentlyViewed.length}</div>
              <div className={styles.statLabel}>Viewed</div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {['overview','ratings','watchlist','history'].map(tab => (
              <button
                key={tab}
                className={[styles.tab, activeTab === tab ? styles.tabActive : ''].join(' ')}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className={styles.tabContent}>
              {/* Rating distribution */}
              {ratingValues.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Your Rating Distribution</h3>
                  <div className={styles.ratingDist}>
                    {ratingDist.map(({ star, count, pct }) => (
                      <div key={star} className={styles.distRow}>
                        <span className={styles.distStar}>{'★'.repeat(star)}</span>
                        <div className={styles.distBar}>
                          <div className={styles.distFill} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={styles.distCount}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.quickActions}>
                <button className={styles.actionBtn} onClick={() => navigate('/watchlist')}>⭐ View Watchlist</button>
                <button className={styles.actionBtn} onClick={() => navigate('/for-you')}>🎯 For You</button>
                <button className={styles.actionBtn} onClick={() => navigate('/browse')}>🎬 Browse Movies</button>
                <button className={styles.actionBtn} onClick={() => navigate('/discover')}>🔍 Discover</button>
              </div>
            </div>
          )}

          {/* Ratings tab */}
          {activeTab === 'ratings' && (
            <div className={styles.tabContent}>
              {ratingValues.length === 0 ? (
                <div className={styles.tabEmpty}>
                  <p>You haven't rated any movies yet.</p>
                  <button className={styles.btn} onClick={() => navigate('/browse')}>Find Movies to Rate</button>
                </div>
              ) : ratedLoading ? (
                <div className={styles.ratedList}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.ratedSkeleton} />)}
                </div>
              ) : (
                <div className={styles.ratedList}>
                  {ratedMovies.map(m => (
                    <div key={m.tmdb_id} className={styles.ratedItem}>
                      {m.poster
                        ? <img src={m.poster} alt={m.title} className={styles.ratedPoster} />
                        : <div className={styles.ratedPosterFallback}>{(m.title||'').slice(0,2).toUpperCase()}</div>
                      }
                      <div className={styles.ratedInfo}>
                        <div className={styles.ratedTitle}>{m.title}</div>
                        <div className={styles.ratedYear}>{m.year} · {(m.genres||[]).slice(0,2).join(', ')}</div>
                        <StarDisplay rating={m.userRating} />
                      </div>
                      <div className={styles.ratedScore}>
                        <span className={styles.ratedScoreNum}>{m.userRating}</span>
                        <span className={styles.ratedScoreMax}>/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watchlist tab */}
          {activeTab === 'watchlist' && (
            <div className={styles.tabContent}>
              {watchlist.length === 0 ? (
                <div className={styles.tabEmpty}>
                  <p>Your watchlist is empty.</p>
                  <button className={styles.btn} onClick={() => navigate('/browse')}>Browse Movies</button>
                </div>
              ) : (
                <div className={styles.ratedList}>
                  {watchlist.map(m => (
                    <div key={m.tmdb_id} className={styles.ratedItem}>
                      {m.poster
                        ? <img src={m.poster} alt={m.title} className={styles.ratedPoster} />
                        : <div className={styles.ratedPosterFallback}>{(m.title||'').slice(0,2).toUpperCase()}</div>
                      }
                      <div className={styles.ratedInfo}>
                        <div className={styles.ratedTitle}>{m.title}</div>
                        <div className={styles.ratedYear}>{m.year} · {(m.genres||[]).slice(0,2).join(', ')}</div>
                        {m.rating && <div className={styles.imdbRating}>★ {m.rating} IMDb</div>}
                      </div>
                      <div className={styles.ratedScore}>
                        <span className={styles.addedDate}>
                          {m.addedAt ? new Date(m.addedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div className={styles.tabContent}>
              {recentlyViewed.length === 0 ? (
                <div className={styles.tabEmpty}><p>No viewing history yet.</p></div>
              ) : (
                <>
                  <div className={styles.historyHeader}>
                    <span className={styles.historyCount}>{recentlyViewed.length} movies viewed</span>
                    <button className={styles.clearBtn} onClick={clearRecent}>Clear History</button>
                  </div>
                  <div className={styles.ratedList}>
                    {recentlyViewed.map(m => (
                      <div key={m.tmdb_id} className={styles.ratedItem}>
                        {m.poster
                          ? <img src={m.poster} alt={m.title} className={styles.ratedPoster} />
                          : <div className={styles.ratedPosterFallback}>{(m.title||'').slice(0,2).toUpperCase()}</div>
                        }
                        <div className={styles.ratedInfo}>
                          <div className={styles.ratedTitle}>{m.title}</div>
                          <div className={styles.ratedYear}>{m.year} · {(m.genres||[]).slice(0,2).join(', ')}</div>
                        </div>
                        <div className={styles.ratedScore}>
                          <span className={styles.addedDate}>
                            {m.viewedAt ? new Date(m.viewedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ProfilePage
