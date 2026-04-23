// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useModal } from '../../context/ModalContext'
import { Bookmark, User, LogOut, ChevronDown, Search, Menu, X } from 'lucide-react'
import NavSearch from './NavSearch'
import styles from './Navbar.module.css'

const Navbar = () => {
  const { user, userData, signOut } = useAuth()
  const { openAuthModal } = useModal()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [navigate])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const initial = (userData?.displayName || user?.email || '?')[0].toUpperCase()

  const navLinks = [
    { to: '/discover',  label: 'Discover' },
    { to: '/browse',    label: 'Browse' },
    { to: '/for-you',   label: '🎯 For You' },
    ...(user ? [{ to: '/watchlist', label: 'Watchlist' }] : []),
  ]

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>
          {/* Logo */}
          <NavLink to="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
            Sce<span>niq</span>
          </NavLink>

          {/* Desktop nav links */}
          <div className={styles.links}>
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => [styles.link, isActive ? styles.linkActive : ''].join(' ')}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className={styles.right}>
            <NavSearch />

            {!user ? (
              <>
                <button className={styles.signInBtn} onClick={openAuthModal}>Sign In</button>
                <button className={styles.signUpBtn} onClick={openAuthModal}>Get Started</button>
              </>
            ) : (
              <div className={styles.userMenu} ref={dropdownRef}>
                <button className={styles.avatarBtn} onClick={() => setDropdownOpen(v => !v)}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className={styles.avatarImg} />
                    : <span className={styles.avatarInitial}>{initial}</span>
                  }
                  <ChevronDown size={13} className={[styles.chevron, dropdownOpen ? styles.chevronOpen : ''].join(' ')} />
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownName}>{userData?.displayName || 'Movie Fan'}</div>
                      <div className={styles.dropdownEmail}>{user.email}</div>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/watchlist') }}>
                      <Bookmark size={15} /> My Watchlist
                    </button>
                    <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/profile') }}>
                      <User size={15} /> Profile
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button className={[styles.dropdownItem, styles.dropdownDanger].join(' ')} onClick={handleSignOut}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className={styles.hamburger}
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileLinks}>
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => [styles.mobileLink, isActive ? styles.mobileLinkActive : ''].join(' ')}
                onClick={() => setMobileMenuOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            <div className={styles.mobileDivider} />
            {!user ? (
              <button className={styles.mobileSignIn} onClick={() => { openAuthModal(); setMobileMenuOpen(false) }}>
                Sign In / Create Account
              </button>
            ) : (
              <>
                <NavLink to="/profile" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                  👤 Profile
                </NavLink>
                <button className={[styles.mobileLink, styles.mobileDanger].join(' ')} onClick={handleSignOut}>
                  ↩ Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
