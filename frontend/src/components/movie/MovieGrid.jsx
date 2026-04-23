// src/components/movie/MovieGrid.jsx
import React from 'react'
import MovieCard from './MovieCard'
import styles from './MovieGrid.module.css'

const MovieGrid = ({ movies = [], loading = false, showSimilarity = false, skeletonCount = 18 }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    )
  }

  if (!movies.length) return null

  return (
    <div className={styles.grid}>
      {movies.map((movie) => (
        <MovieCard key={movie.tmdb_id} movie={movie} showSimilarity={showSimilarity} />
      ))}
    </div>
  )
}

export default MovieGrid
