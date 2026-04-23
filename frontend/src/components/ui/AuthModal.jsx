// src/components/ui/AuthModal.jsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useModal } from '../../context/ModalContext'
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  friendlyAuthError,
} from '../../services/firebase'
import toast from 'react-hot-toast'
import styles from './AuthModal.module.css'

const AuthModal = () => {
  const { authModal, closeAuthModal } = useModal()
  const [tab, setTab]         = useState('login')   // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Form fields
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')

  const reset = () => { setError(''); setName(''); setEmail(''); setPassword('') }

  const handleClose = () => { closeAuthModal(); reset(); setTab('login') }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try {
      const user = await signInWithGoogle()
      toast.success(`Welcome, ${user.displayName || 'friend'}! 🎬`)
      handleClose()
    } catch (e) {
      setError(friendlyAuthError(e.code))
    } finally { setLoading(false) }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (tab === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return }
        const user = await signUpWithEmail(name.trim(), email, password)
        toast.success(`Welcome to Sceniq, ${user.displayName}! 🎬`)
      } else {
        const user = await signInWithEmail(email, password)
        toast.success(`Welcome back! 🎬`)
      }
      handleClose()
    } catch (e) {
      setError(friendlyAuthError(e.code))
    } finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      {authModal && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
              <X size={16} />
            </button>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.logo}>Sce<span>niq</span></div>
              <p className={styles.subtitle}>Your personal movie universe</p>
            </div>

            {/* Tab switcher */}
            <div className={styles.tabs}>
              <button
                className={[styles.tab, tab === 'login' ? styles.tabActive : ''].join(' ')}
                onClick={() => { setTab('login'); setError('') }}
              >Sign In</button>
              <button
                className={[styles.tab, tab === 'signup' ? styles.tabActive : ''].join(' ')}
                onClick={() => { setTab('signup'); setError('') }}
              >Create Account</button>
            </div>

            {/* Error */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Google button */}
            <button className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className={styles.form}>
              {tab === 'signup' && (
                <div className={styles.field}>
                  <label className={styles.label}>Your Name</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading
                  ? <span className={styles.spinner} />
                  : tab === 'login' ? 'Sign In' : 'Create Account'
                }
              </button>
            </form>

            <p className={styles.switchText}>
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                className={styles.switchLink}
                onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError('') }}
              >
                {tab === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"/>
  </svg>
)

export default AuthModal
