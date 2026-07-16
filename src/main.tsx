import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'snes.css/dist/snes.min.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
