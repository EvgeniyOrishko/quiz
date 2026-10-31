import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans/cyrillic-400.css'
import '@fontsource/noto-sans/cyrillic-500.css'
import '@fontsource/noto-sans/cyrillic-700.css'
import '@fontsource/noto-sans/latin-400.css'
import '@fontsource/noto-sans/latin-500.css'
import '@fontsource/noto-sans/latin-700.css'
import '@fontsource/rubik/cyrillic-400.css'
import '@fontsource/rubik/latin-400.css'
import '@fontsource/roboto-mono/latin-700.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
