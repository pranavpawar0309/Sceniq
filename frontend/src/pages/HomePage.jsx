// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useModal } from '../context/ModalContext'
import { useAuth } from '../context/AuthContext'
import { getTrending } from '../services/api'
import MovieGrid from '../components/movie/MovieGrid'
import styles from './HomePage.module.css'

const MOODS = [
  { label: '🧠 Mind-bending',  value: 'Mind-bending psychological thriller with a twist ending' },
  { label: '❤️ Feel-good',     value: 'Heartwarming feel-good movie with a happy ending' },
  { label: '🚀 Sci-Fi',        value: 'Epic science fiction space adventure with big ideas' },
  { label: '👻 Horror',        value: 'Terrifying psychological horror with dread and suspense' },
  { label: '⚡ Action',        value: 'High-octane action film with incredible stunts' },
  { label: '🏆 Oscar bait',    value: 'Award-winning prestige drama with stunning performances' },
]

const HomePage = () => {
  const navigate = useNavigate()
  const { openAuthModal } = useModal()
  const { user } = useAuth()

  const [trending,       setTrending]       = useState([])
  const [allTime,        setAllTime]        = useState([])
  const [trendLoading,   setTrendLoading]   = useState(true)
  const [allTimeLoading, setAllTimeLoading] = useState(true)

  useEffect(() => {
    getTrending(18, 'popular')
      .then(setTrending).catch(() => setTrending([]))
      .finally(() => setTrendLoading(false))

    getTrending(18, 'alltime')
      .then(setAllTime).catch(() => setAllTime([]))
      .finally(() => setAllTimeLoading(false))
  }, [])

  const handleMood = (value) =>
    navigate('/discover', { state: { prefillDescription: value } })

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.eyebrow}>✦ Sceniq — AI-Powered Movie Discovery</div>
          <h1 className={styles.heroTitle}>
            Your Next<br /><em className={styles.titleEm}>Great Film</em><br />Starts Here
          </h1>
          <p className={styles.heroSub}>
            Sceniq finds movies you'll love — search by a title, or just describe
            the vibe you're after. Powered by AI, built for film lovers.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.btnPrimary} onClick={() => navigate('/discover')}>
              Start Discovering
            </button>
            {!user && (
              <button className={styles.btnOutline} onClick={openAuthModal}>
                Join Sceniq Free
              </button>
            )}
          </div>
          <div className={styles.moodRow}>
            <span className={styles.moodLabel}>Quick moods →</span>
            <div className={styles.moodChips}>
              {MOODS.map((m) => (
                <button key={m.label} className={styles.moodChip} onClick={() => handleMood(m.value)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.stats}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {[
            { num: '1500+', label: 'Movies' },
            { num: '13',    label: 'Languages' },
            { num: 'ML',    label: 'Powered' },
            { num: 'Free',  label: 'Forever' },
          ].map((s) => (
            <div key={s.label} className={styles.stat}>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.howSection}>
        <div className="container">
          <div className={styles.howGrid}>
            <div className={styles.howCard}>
              <div className={styles.howIcon}>🎬</div>
              <h3 className={styles.howTitle}>Search by Similar</h3>
              <p className={styles.howDesc}>Type any movie — Sceniq's ML engine finds the closest matches using cosine similarity on genre, cast, director and plot.</p>
            </div>
            <div className={styles.howCard}>
              <div className={styles.howIcon}>✍️</div>
              <h3 className={styles.howTitle}>Describe Your Mood</h3>
              <p className={styles.howDesc}>Write anything — "dark psychological thriller in rain" — and Sceniq maps your words into movie space to find the perfect match.</p>
            </div>
            <div className={styles.howCard}>
              <div className={styles.howIcon}>⭐</div>
              <h3 className={styles.howTitle}>Save & Track</h3>
              <p className={styles.howDesc}>Join Sceniq free — save movies, rate what you've watched, and get a personalised feed that improves with every click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Now ── */}
      <section className={styles.movieSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.eyebrow}>🔥 This Week</div>
              <h2 className={styles.sectionTitle}>Trending Now</h2>
              <p className={styles.sectionSub}>What everyone's watching right now</p>
            </div>
            <button className={styles.seeAll} onClick={() => navigate('/browse', { state: { sort: 'popular' } })}>
              See all →
            </button>
          </div>
          <MovieGrid movies={trending} loading={trendLoading} skeletonCount={18} />
        </div>
      </section>

      {/* ── All Time Greatest ── */}
      <section className={styles.movieSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.eyebrow}>🏆 Timeless</div>
              <h2 className={styles.sectionTitle}>All Time Greatest</h2>
              <p className={styles.sectionSub}>The highest rated movies ever made</p>
            </div>
            <button className={styles.seeAll} onClick={() => navigate('/browse', { state: { sort: 'alltime' } })}>
              See all →
            </button>
          </div>
          <MovieGrid movies={allTime} loading={allTimeLoading} skeletonCount={18} />
        </div>
      </section>
    </div>
  )
}

export default HomePage
