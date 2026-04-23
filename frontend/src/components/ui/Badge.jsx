// src/components/ui/Badge.jsx
import React from 'react'
import styles from './Badge.module.css'

const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={[styles.badge, styles[variant], className].join(' ')}>
    {children}
  </span>
)

export default Badge
