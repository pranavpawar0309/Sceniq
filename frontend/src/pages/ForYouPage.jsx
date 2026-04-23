// src/pages/ForYouPage.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRecent } from '../context/RecentContext'
import { useModal } from '../context/ModalContext'
import { getSimilarMovies, getMoviesByDescription } from '../services/api'
import MovieGrid from '../components/movie/MovieGrid'
import styles from './ForYouPage.module.css'

const ForYouPage = () => {
  const { user, watchlist, ratings }     = useAuth()
  const { recentlyViewed, clearRecent }  = useRecent()
  const { openAuthModal }                = useModal()
  const navigate                         = useNavigate()

  const [forYou,        setForYou]        = useState([])
  const [becauseOf,     setBecauseOf]     = useState([]) // ratings-based
  const [becauseTitle,  setBecauseTitle]  = useState('')
  const [moreLike,      setMoreLike]      = useState([])
  const [moreLikeTitle, setMoreLikeTitle] = useState('')
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { buildRecommendations() }, [watchlist, recentlyViewed, ratings])

  const buildRecommendations = async () => {
    setLoading(true)
    try {
      const allMovies = [...watchlist, ...recentlyViewed]

      // ── 1. Ratings-based: find movies similar to your highest rated ──────
      const ratedMovies = Object.entries(ratings || {})
        .sort((a, b) => b[1] - a[1]) // highest rating first
        .slice(0, 3)

      if (ratedMovies.length > 0) {
        // Get the title of the highest rated movie from watchlist or recently viewed
        const [topId, topRating] = ratedMovies[0]
        const topMovie = [...watchlist, ...recentlyViewed].find(m => String(m.tmdb_id) === String(topId))
        if (topMovie && topRating >= 3) {
          const data = await getSimilarMovies(topMovie.title, 12)
          if (data.recommendations) {
            const seenIds = new Set(allMovies.map(m => m.tmdb_id))
            setBecauseOf(data.recommendations.filter(m => !seenIds.has(m.tmdb_id)))
            setBecauseTitle(topMovie.title)
          }
        }
      }

      // ── 2. Genre-based: build from genres you love (4-5 star rated) ──────
      if (allMovies.length > 0) {
        const genreCount = {}

        // Weight genres from high ratings more
        allMovies.forEach(m => {
          const rating = ratings?.[m.tmdb_id] || 0
          const weight = rating >= 4 ? 3 : rating >= 3 ? 2 : 1
          ;(m.genres || []).forEach(g => {
            genreCount[g] = (genreCount[g] || 0) + weight
          })
        })

        // Exclude genres from movies rated 1-2 stars (user dislikes)
        allMovies.forEach(m => {
          const rating = ratings?.[m.tmdb_id] || 0
          if (rating > 0 && rating <= 2) {
            ;(m.genres || []).forEach(g => {
              genreCount[g] = (genreCount[g] || 0) - 3
            })
          }
        })

        const topGenres = Object.entries(genreCount)
          .filter(([, score]) => score > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([g]) => g)

        if (topGenres.length > 0) {
          const keywords = allMovies
            .filter(m => (ratings?.[m.tmdb_id] || 0) >= 4)
            .flatMap(m => m.keywords || [])
            .slice(0, 6)

          const desc = `${topGenres.join(', ')} movies${keywords.length ? ` with ${keywords.slice(0,4).join(', ')}` : ''}`
          const results = await getMoviesByDescription(desc, 18)
          const seenIds = new Set(allMovies.map(m => m.tmdb_id))
          setForYou(results.filter(m => !seenIds.has(m.tmdb_id)))
        }
      }

      // ── 3. More like this: from most recent watchlist item ────────────────
      const sourceMovie = watchlist[0] || recentlyViewed[0]
      if (sourceMovie) {
        const data = await getSimilarMovies(sourceMovie.title, 12)
        if (data.recommendations) {
          setMoreLike(data.recommendations)
          setMoreLikeTitle(sourceMovie.title)
        }
      }
    } catch (e) {
      console.error('ForYou error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!user && recentlyViewed.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎯</div>
          <h2 className={styles.emptyTitle}>Your Personal Feed</h2>
          <p className={styles.emptySub}>Sign in to Sceniq and rate some movies — we'll build a personalised feed based on your taste.</p>
          <div className={styles.emptyActions}>
            <button className={styles.btn} onClick={openAuthModal}>Sign In</button>
            <button className={styles.btnOutline} onClick={() => navigate('/discover')}>Browse Movies</button>
          </div>
        </div>
      </div>
    )
  }

  const ratedCount   = Object.keys(ratings || {}).length
  const hasHighRated = Object.values(ratings || {}).some(r => r >= 4)

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className="container">

          <div className={styles.header}>
            <div>
              <div className={styles.eyebrow}>🎯 Personalised for you</div>
              <h1 className={styles.title}>For You</h1>
              <p className={styles.subtitle}>
                {ratedCount > 0
                  ? `Based on your ${ratedCount} rated movie${ratedCount !== 1 ? 's' : ''} and watchlist`
                  : 'Rate movies to get better recommendations'}
              </p>
            </div>
          </div>

          {/* Ratings-based row */}
          {(becauseOf.length > 0 || (loading && hasHighRated)) && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Because You Loved "{becauseTitle}"</h2>
                  <p className={styles.sectionSub}>Based on your ★★★★★ rating</p>
                </div>
              </div>
              <MovieGrid movies={becauseOf} loading={loading} showSimilarity skeletonCount={12} />
            </section>
          )}

          {/* Genre-based For You */}
          {(forYou.length > 0 || loading) && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Picked For You</h2>
                  <p className={styles.sectionSub}>
                    {hasHighRated
                      ? 'Based on genres you rated highly'
                      : 'Based on genres from your watchlist'}
                  </p>
                </div>
              </div>
              <MovieGrid movies={forYou} loading={loading} skeletonCount={18} />
            </section>
          )}

          {/* More like last saved */}
          {(moreLike.length > 0 || loading) && moreLikeTitle && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Because You Saved "{moreLikeTitle}"</h2>
                  <p className={styles.sectionSub}>ML similarity matches</p>
                </div>
              </div>
              <MovieGrid movies={moreLike} loading={loading} showSimilarity skeletonCount={12} />
            </section>
          )}

          {/* Nudge to rate if no ratings yet */}
          {!loading && ratedCount === 0 && (
            <div className={styles.rateNudge}>
              <div className={styles.nudgeIcon}>⭐</div>
              <p className={styles.nudgeText}>
                Rate movies you've watched to unlock smarter recommendations
              </p>
              <button className={styles.btn} onClick={() => navigate('/browse')}>
                Find Movies to Rate
              </button>
            </div>
          )}

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Recently Viewed</h2>
                  <p className={styles.sectionSub}>{recentlyViewed.length} movies</p>
                </div>
                <button className={styles.clearBtn} onClick={clearRecent}>Clear history</button>
              </div>
              <MovieGrid movies={recentlyViewed} skeletonCount={8} />
            </section>
          )}

        </div>
      </div>
    </div>
  )
}

export default ForYouPage
