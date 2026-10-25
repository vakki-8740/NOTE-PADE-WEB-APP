import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../icons/Icon.jsx'
import './Toast.css'

const ToastContext = createContext(null)

const ICONS = {
  success: 'check',
  error: 'alert-triangle',
  warning: 'alert-triangle',
  info: 'info',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message, { title, variant = 'info', duration = 3400 } = {}) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-2), { id, message, title, variant }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {createPortal(
        <div className="toast-stack" aria-live="polite" aria-atomic="false">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-pill ${t.variant}`}>
              <Icon name={ICONS[t.variant] ?? 'info'} className="toast-icon" />
              <div className="toast-text">
                {t.title && <span className="toast-title">{t.title}</span>}
                <span className="toast-message">{t.message}</span>
              </div>
              <button className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>')
  return ctx
}
