// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ModalProvider } from './context/ModalContext'
import { RecentProvider } from './context/RecentContext'
import Navbar from './components/layout/Navbar'
import ScrollToTop from './components/layout/ScrollToTop'
import Footer from './components/layout/Footer'
import MovieModal from './components/movie/MovieModal'
import AuthModal from './components/ui/AuthModal'
import AIChatPanel from './components/ui/AIChatPanel'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import BrowsePage from './pages/BrowsePage'
import WatchlistPage from './pages/WatchlistPage'
import ProfilePage from './pages/ProfilePage'
import ForYouPage from './pages/ForYouPage'
import NotFoundPage from './pages/NotFoundPage'

const App = () => {
  return (
    <AuthProvider>
      <RecentProvider>
        <ModalProvider>
          <ScrollToTop />
          <Navbar />
          <main>
            <Routes>
              <Route path="/"          element={<HomePage />} />
              <Route path="/discover"  element={<DiscoverPage />} />
              <Route path="/browse"    element={<BrowsePage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
              <Route path="/for-you"   element={<ForYouPage />} />
              <Route path="/404"       element={<NotFoundPage />} />
              <Route path="*"          element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
          <MovieModal />
          <AuthModal />
          <AIChatPanel />
        </ModalProvider>
      </RecentProvider>
    </AuthProvider>
  )
}

export default App
