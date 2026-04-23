// src/pages/NotFoundPage.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

const NotFoundPage = () => {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Scene Not Found</h1>
        <p className={styles.sub}>
          The page you're looking for doesn't exist.<br />
          Let's get you back to the movies.
        </p>
        <button className={styles.btn} onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default NotFoundPage
