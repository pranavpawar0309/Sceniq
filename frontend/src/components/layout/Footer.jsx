// src/components/layout/Footer.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Footer.module.css'

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.brand}>
        <div className={styles.logo}>Scen<span>IQ</span></div>
        <p className={styles.tagline}>
          AI-powered movie discovery.<br />Find your next favourite film.
        </p>
      </div>
      <div className={styles.links}>
        <div className={styles.col}>
          <div className={styles.colTitle}>Explore</div>
          <NavLink to="/discover" className={styles.colLink}>Discover</NavLink>
          <NavLink to="/watchlist" className={styles.colLink}>Watchlist</NavLink>
        </div>
        <div className={styles.col}>
          <div className={styles.colTitle}>Data</div>
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className={styles.colLink}>
            TMDB
          </a>
          <a href="https://www.imdb.com" target="_blank" rel="noreferrer" className={styles.colLink}>
            IMDb
          </a>
        </div>
      </div>
    </div>
    <div className={styles.bottom}>
      <span>© {new Date().getFullYear()} Sceniq. Movie data by TMDB.</span>
    </div>
  </footer>
)

export default Footer
