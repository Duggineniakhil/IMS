import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Initialize theme
const storedTheme = localStorage.getItem('ims-theme') || 'dark';
document.documentElement.setAttribute('data-theme', storedTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
