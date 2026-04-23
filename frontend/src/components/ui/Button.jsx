// src/components/ui/Button.jsx
import React from 'react'
import styles from './Button.module.css'

const Button = ({
  children,
  variant = 'primary',   // primary | outline | ghost | danger
  size    = 'md',        // sm | md | lg
  loading = false,
  disabled= false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth  ? styles.full : '',
        loading    ? styles.loading : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
