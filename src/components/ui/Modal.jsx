import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../icons/Icon.jsx'
import IconButton from './IconButton.jsx'
import './Modal.css'

export default function Modal({
  open,
  onClose,
  icon,
  tone = 'accent',
  title,
  description,
  children,
  actions,
  className = '',
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    // basic focus management: focus the dialog on open
    modalRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" tabIndex={-1} ref={modalRef}>
        {(title || icon) && (
          <div className="modal-head">
            {icon && (
              <span className={`modal-icon ${tone}`} aria-hidden="true">
                <Icon name={icon} size={19} />
              </span>
            )}
            <div className="modal-title">
              {title && <h3>{title}</h3>}
              {description && <p>{description}</p>}
            </div>
            <IconButton icon="x" label="Close" size="sm" onClick={onClose} />
          </div>
        )}
        {children && <div className="modal-body">{children}</div>}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  )
}
