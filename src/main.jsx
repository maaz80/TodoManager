import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import swDev from './swDev.js'
import { initializePWAInstall } from './pwaInstall.js'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>
)
swDev()

document.addEventListener('DOMContentLoaded', () => {
  initializePWAInstall();
});

// Log PWA status for debugging
if ('serviceWorker' in navigator) {
  console.log('Service Worker is supported in this browser');
} else {
  console.log('Service Worker is NOT supported in this browser');
}

if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Application is running in standalone mode (installed)');
} else {
  console.log('Application is running in browser mode (not installed)');
}