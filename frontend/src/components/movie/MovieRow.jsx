// src/components/movie/MovieRow.jsx
// Horizontal scrollable movie row — used for "Because you watched X" sections
import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'
import styles from './MovieRow.module.css'

const MovieRowSkeleton = () => (
  <div className={styles.row}>
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className={styles.skeletonCard}>
        <div className={styles.skeletonPoster} />
        <div className={styles.skeletonBody}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLineShort} />
        </div>
      </div>
    ))}
  </div>
)

const MovieRow = ({ title, subtitle, movies = [], loading = false, showSimilarity = false }) => {
  const rowRef = useRef(null)

  const scroll = (dir) => {
    if (!rowRef.current) return
    rowRef.current.scrollBy({ left: dir * 600, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.header}>
          <div>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonSubtitle} />
          </div>
        </div>
        <MovieRowSkeleton />
      </div>
    )
  }

  if (!movies.length) return null

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
          <button className={styles.arrow} onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className={styles.row} ref={rowRef}>
        {movies.map(movie => (
          <div key={movie.tmdb_id} className={styles.cardWrap}>
            <MovieCard movie={movie} showSimilarity={showSimilarity} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovieRow
