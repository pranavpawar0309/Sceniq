// src/components/ui/StarRating.jsx
import React, { useState } from 'react'
import styles from './StarRating.module.css'

const StarRating = ({ movieId, initialRating = 0, onRate, size = 'md' }) => {
  const [hovered, setHovered] = useState(0)
  const [rated,   setRated]   = useState(initialRating)

  const handleRate = async (val) => {
    setRated(val)
    if (onRate) await onRate(val)
  }

  const display = hovered || rated

  return (
    <div className={[styles.stars, styles[size]].join(' ')}>
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          className={[styles.star, display >= i ? styles.active : ''].join(' ')}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => handleRate(i)}
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
        >★</button>
      ))}
      {rated > 0 && (
        <span className={styles.label}>{rated}/5</span>
      )}
    </div>
  )
}

export default StarRating
