import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppComposition } from './app/AppComposition'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppComposition />
  </StrictMode>
)
