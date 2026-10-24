import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// A page chunk can fail to load if a new version was deployed while the app was open
// (old chunk files are gone). Reload once to pick up the new version; data lives in Firestore.
window.addEventListener('vite:preloadError', () => {
  const last = Number(sessionStorage.getItem('cl_chunk_reload') || 0)
  if (Date.now() - last < 10000) return // avoid a reload loop, e.g. when offline
  sessionStorage.setItem('cl_chunk_reload', String(Date.now()))
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
