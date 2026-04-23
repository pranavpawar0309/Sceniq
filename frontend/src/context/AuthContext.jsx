// src/context/AuthContext.jsx
// Provides user, userData, watchlist, and auth actions to the whole app.
// Wrap the app in <AuthProvider> and use the useAuth() hook anywhere.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthChange,
  getUserData,
  addToWatchlist,
  removeFromWatchlist,
  saveRating,
  addToWatched,
  removeFromWatched,
  logOut,
} from '../services/firebase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null)   // Firebase user object
  const [userData, setUserData] = useState(null)   // Firestore document
  const [loading, setLoading]   = useState(true)   // true until first auth check

  // Listen to Firebase auth state changes
  useEffect(() => {
    let unsub = () => {}
    try {
      unsub = onAuthChange(async (firebaseUser) => {
        setUser(firebaseUser)
        if (firebaseUser) {
          try {
            const data = await getUserData(firebaseUser.uid)
            setUserData(data)
          } catch (e) {
            console.warn('Could not load user data:', e.message)
          }
        } else {
          setUserData(null)
        }
        setLoading(false)
      })
    } catch (e) {
      console.warn('Firebase not configured yet:', e.message)
      setLoading(false)
    }
    return unsub
  }, [])

  // Refresh Firestore data (call after mutations)
  const refreshUserData = useCallback(async () => {
    if (!user) return
    const data = await getUserData(user.uid)
    setUserData(data)
  }, [user])

  // Watchlist helpers
  const watchlist = userData?.watchlist || []

  const isInWatchlist = useCallback(
    (tmdbId) => watchlist.some((m) => m.tmdb_id === tmdbId),
    [watchlist]
  )

  const toggleWatchlist = useCallback(
    async (movie) => {
      if (!user) return false // caller should open auth modal
      const inList = isInWatchlist(movie.tmdb_id)
      if (inList) {
        await removeFromWatchlist(user.uid, movie)
        setUserData((prev) => ({
          ...prev,
          watchlist: (prev?.watchlist || []).filter((m) => m.tmdb_id !== movie.tmdb_id),
        }))
      } else {
        const entry = await addToWatchlist(user.uid, movie)
        setUserData((prev) => ({
          ...prev,
          watchlist: [...(prev?.watchlist || []), entry],
        }))
      }
      return !inList // returns new state
    },
    [user, isInWatchlist]
  )

  // Ratings helpers
  const ratings = userData?.ratings || {}
  const watched  = userData?.watched  || []

  const isWatched = useCallback(
    (tmdbId) => watched.some((m) => m.tmdb_id === tmdbId),
    [watched]
  )

  const toggleWatched = useCallback(
    async (movie) => {
      if (!user) return false
      const inList = isWatched(movie.tmdb_id)
      if (inList) {
        await removeFromWatched(user.uid, movie)
        setUserData((prev) => ({
          ...prev,
          watched: (prev?.watched || []).filter((m) => m.tmdb_id !== movie.tmdb_id),
        }))
      } else {
        const entry = await addToWatched(user.uid, movie)
        setUserData((prev) => ({
          ...prev,
          watched: [...(prev?.watched || []), entry],
        }))
      }
      return !inList
    },
    [user, isWatched]
  )

  const rateMovie = useCallback(
    async (movieId, rating) => {
      if (!user) return false
      await saveRating(user.uid, movieId, rating)
      setUserData((prev) => ({
        ...prev,
        ratings: { ...(prev?.ratings || {}), [movieId]: rating },
      }))
      return true
    },
    [user]
  )

  const signOut = useCallback(async () => {
    await logOut()
    setUser(null)
    setUserData(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        watchlist,
        ratings,
        watched,
        isWatched,
        toggleWatched,
        isInWatchlist,
        toggleWatchlist,
        rateMovie,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
