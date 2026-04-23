// src/components/ui/PageSkeleton.jsx
// Full-page skeleton loader shown while data fetches
import React from 'react'
import styles from './PageSkeleton.module.css'

const CardSkeleton = () => (
  <div className={styles.card}>
    <div className={styles.poster} />
    <div className={styles.body}>
      <div className={styles.line} />
      <div className={styles.lineShort} />
    </div>
  </div>
)

const RowSkeleton = ({ count = 7 }) => (
  <div className={styles.rowSection}>
    <div className={styles.rowHeader}>
      <div className={styles.rowTitle} />
      <div className={styles.rowSub} />
    </div>
    <div className={styles.row}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  </div>
)

const GridSkeleton = ({ count = 18, label }) => (
  <div className={styles.gridSection}>
    {label && <div className={styles.gridLabel} />}
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  </div>
)

export const HomePageSkeleton = () => (
  <div className={styles.wrap}>
    <GridSkeleton count={18} label />
    <RowSkeleton />
    <RowSkeleton />
    <GridSkeleton count={18} label />
  </div>
)

export const BrowsePageSkeleton = () => (
  <div className={styles.wrap}>
    <div className={styles.filterRow}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.chip} />)}
    </div>
    <GridSkeleton count={36} />
  </div>
)

export const ForYouPageSkeleton = () => (
  <div className={styles.wrap}>
    <RowSkeleton />
    <GridSkeleton count={18} label />
    <RowSkeleton />
  </div>
)

export default GridSkeleton
