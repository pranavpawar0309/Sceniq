import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#13131f',
            color: '#f0eff5',
            border: '1px solid rgba(255,255,255,0.11)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontFamily: "'DM Sans', sans-serif",
          },
          success: {
            iconTheme: { primary: '#e8c56d', secondary: '#08080f' },
          },
          error: {
            iconTheme: { primary: '#e84040', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
