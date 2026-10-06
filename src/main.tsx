import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('앱을 표시할 요소를 찾지 못했습니다.')
}

createRoot(app).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
