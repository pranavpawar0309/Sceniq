// src/context/RecentContext.jsx
// Provides recentlyViewed and addToRecent to the whole app.
// ModalContext calls addToRecent every time a movie modal opens.

import React, { createContext, useContext } from 'react'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'

const RecentContext = createContext(null)

export const RecentProvider = ({ children }) => {
  const { recentlyViewed, addToRecent, clearRecent } = useRecentlyViewed()
  return (
    <RecentContext.Provider value={{ recentlyViewed, addToRecent, clearRecent }}>
      {children}
    </RecentContext.Provider>
  )
}

export const useRecent = () => {
  const ctx = useContext(RecentContext)
  if (!ctx) throw new Error('useRecent must be used inside <RecentProvider>')
  return ctx
}
