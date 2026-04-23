// src/components/ui/AIChatPanel.jsx
// Smart chat — tries Claude first, falls back to TF-IDF if unavailable.
// The app NEVER breaks without an Anthropic key.

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, RotateCcw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useRecent } from '../../context/RecentContext'
import { useModal } from '../../context/ModalContext'
import { getMoviesByDescription, getSimilarMovies } from '../../services/api'
import styles from './AIChatPanel.module.css'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const STARTER_SUGGESTIONS = [
  "I loved Inception — what's similar?",
  "Best Bollywood movies of the last 5 years",
  "A short thriller under 90 minutes",
  "Something fun for the whole family",
  "Classic Korean cinema recommendations",
  "Dark psychological horror films",
]

const AIChatPanel = () => {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [unread, setUnread]     = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)
  const { watchlist }           = useAuth()
  const { recentlyViewed }      = useRecent()
  const { openModal }           = useModal()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 150); setUnread(false) }
  }, [open])

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')
    const userMsg = { role: 'user', content: userText }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    try {
      // ── Step 1: Try Claude via backend ──────────────────────
      const wlTitles     = watchlist.slice(0, 8).map(m => m.title).join(', ')
      const recentTitles = recentlyViewed.slice(0, 5).map(m => m.title).join(', ')
      const system = `You are Sceniq AI — a passionate movie expert giving concise recommendations.
${wlTitles ? `User's watchlist: ${wlTitles}.` : ''}
${recentTitles ? `Recently viewed: ${recentTitles}.` : ''}
Rules: Recommend 3-5 movies. Bold titles like **Movie (Year)**. One sentence each. Under 120 words. End with a follow-up question.`

      let reply = null
      try {
        const res = await fetch(`${BACKEND_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history.map(m => ({ role: m.role, content: m.content })), system }),
        })
        const data = await res.json()
        // If backend returned an error/warning, it means no API key — fall through
        if (data.reply && !data.reply.startsWith('⚠️')) {
          reply = { type: 'ai', content: data.reply }
        }
      } catch { /* Claude unavailable — fall through to TF-IDF */ }

      // ── Step 2: TF-IDF fallback ──────────────────────────────
      if (!reply) {
        const movies = await getTFIDFResults(userText)
        if (movies.length > 0) {
          reply = { type: 'tfidf', movies }
        } else {
          reply = { type: 'ai', content: "I couldn't find exact matches. Try describing the genre, mood, or a similar movie you enjoy!" }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', ...reply }])
      if (!open) setUnread(true)
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant', type: 'ai',
        content: "Something went wrong. Make sure the backend is running.",
      }])
    } finally {
      setLoading(false) }
  }

  // Extract intent from user message and call TF-IDF
  const getTFIDFResults = async (text) => {
    try {
      // Check if it looks like "similar to X" query
      const similarMatch = text.match(/similar to (.+)|like (.+)|loved? (.+)/i)
      if (similarMatch) {
        const title = (similarMatch[1] || similarMatch[2] || similarMatch[3]).trim()
        const data  = await getSimilarMovies(title, 5)
        if (data.recommendations) return data.recommendations
      }
      // Otherwise use description search
      const results = await getMoviesByDescription(text, 6)
      return results || []
    } catch { return [] }
  }

  const reset = () => setMessages([])

  const formatText = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} style={{ color: 'var(--gold)', fontWeight: 600 }}>{part.slice(2,-2)}</strong>
        : part.split('\n').map((line, k) => (
            <React.Fragment key={`${i}-${k}`}>{k > 0 && <br/>}{line}</React.Fragment>
          ))
    )
  }

  return (
    <>
      <button
        className={[styles.fab, open ? styles.fabOpen : ''].join(' ')}
        onClick={() => setOpen(v => !v)}
        aria-label="AI Chat"
      >
        {open ? <X size={20}/> : <MessageCircle size={20}/>}
        {unread && !open && <span className={styles.unreadDot}/>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className={styles.panel}
            initial={{ opacity:0, scale:0.92, y:20 }}
            animate={{ opacity:1, scale:1,    y:0  }}
            exit={{    opacity:0, scale:0.92, y:20 }}
            transition={{ type:'spring', damping:26, stiffness:300 }}
          >
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <Sparkles size={15} style={{ color:'var(--gold)' }}/>
                <div>
                  <div className={styles.headerTitle}>Sceniq AI</div>
                  <div className={styles.headerSub}>Smart movie recommendations</div>
                </div>
              </div>
              {messages.length > 0 && (
                <button className={styles.resetBtn} onClick={reset} title="Clear chat">
                  <RotateCcw size={13}/>
                </button>
              )}
            </div>

            <div className={styles.messages}>
              {messages.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🎬</div>
                  <p className={styles.emptyText}>
                    Ask me anything — I'll use ML to find your perfect movie.
                  </p>
                  <div className={styles.starters}>
                    {STARTER_SUGGESTIONS.map(s => (
                      <button key={s} className={styles.starter} onClick={() => sendMessage(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={[styles.message, msg.role==='user' ? styles.userMsg : styles.aiMsg].join(' ')}>
                    {msg.role === 'assistant' && <div className={styles.aiAvatar}>✦</div>}
                    <div className={styles.bubble}>
                      {/* AI text response */}
                      {msg.type === 'ai' && formatText(msg.content)}
                      {/* TF-IDF movie cards */}
                      {msg.type === 'tfidf' && (
                        <div className={styles.movieResults}>
                          <div className={styles.resultsLabel}>Here's what I found:</div>
                          {msg.movies.map(m => (
                            <div key={m.tmdb_id} className={styles.movieResult} onClick={() => { openModal(m); setOpen(false) }}>
                              {m.poster
                                ? <img src={m.poster} alt={m.title} className={styles.resultPoster}/>
                                : <div className={styles.resultPosterFallback}>{m.title.slice(0,2).toUpperCase()}</div>
                              }
                              <div className={styles.resultInfo}>
                                <div className={styles.resultTitle}>{m.title}</div>
                                <div className={styles.resultMeta}>{m.year} · ★ {m.rating} · {(m.genres||[]).slice(0,2).join(', ')}</div>
                                <div className={styles.resultDesc}>{(m.overview||'').slice(0,80)}…</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* User message */}
                      {msg.role === 'user' && msg.content}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className={[styles.message, styles.aiMsg].join(' ')}>
                  <div className={styles.aiAvatar}>✦</div>
                  <div className={[styles.bubble, styles.thinking].join(' ')}>
                    <span/><span/><span/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            <div className={styles.inputRow}>
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder="Ask for a recommendation..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                rows={1}
                disabled={loading}
              />
              <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                <Send size={15}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIChatPanel
