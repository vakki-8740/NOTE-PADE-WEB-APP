import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import App from './App.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './components/ui/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DataProvider>
  </StrictMode>,
)
