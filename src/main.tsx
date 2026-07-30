import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppComposition } from './app/AppComposition'
import { appLogger, registerGlobalErrorHandlers } from './lib/logger'
import './styles/index.css'

registerGlobalErrorHandlers(window, appLogger)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppComposition />
  </StrictMode>
)
