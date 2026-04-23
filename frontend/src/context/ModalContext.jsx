// src/context/ModalContext.jsx
// Controls the global movie detail modal.
// Any component can call openModal(movie) without prop drilling.

import React, { createContext, useContext, useState } from 'react'

const ModalContext = createContext(null)

export const ModalProvider = ({ children }) => {
  const [modalMovie, setModalMovie] = useState(null)
  const [authModal, setAuthModal]   = useState(false) // login/signup modal

  const openModal  = (movie) => setModalMovie(movie)
  const closeModal = ()      => setModalMovie(null)

  const openAuthModal  = () => setAuthModal(true)
  const closeAuthModal = () => setAuthModal(false)

  return (
    <ModalContext.Provider value={{ modalMovie, openModal, closeModal, authModal, openAuthModal, closeAuthModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>')
  return ctx
}
