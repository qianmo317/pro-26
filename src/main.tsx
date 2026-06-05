import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import Toast from './components/Toast'
import '@arco-design/web-react/dist/css/arco.css'
import './styles/theme.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toast />
  </StrictMode>,
)
