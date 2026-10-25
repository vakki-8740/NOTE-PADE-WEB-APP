import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../icons/Icon.jsx'
import './Menu.css'

export function MenuList({ items, onRequestClose, style, className = '' }) {
  return (
    <div className={`menu ${className}`} style={style} role="menu">
      {items.map((item, i) =>
        item.separator ? (
          <span className="menu-sep" key={`sep-${i}`} />
        ) : (
          <button
            key={item.key ?? item.label}
            type="button"
            className={`menu-item ${item.danger ? 'danger' : ''}`}
            disabled={item.disabled}
            role="menuitem"
            onClick={() => {
              item.onClick?.()
              onRequestClose?.()
            }}
          >
            {item.icon && <Icon name={item.icon} size={15} />}
            {item.label}
          </button>
        ),
      )}
    </div>
  )
}

/** Dropdown menu anchored below a trigger element (e.g. "..." button). */
export function DropdownMenu({ trigger, items, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu-wrap" ref={wrapRef}>
      {trigger(() => setOpen((v) => !v), open)}
      {open && <MenuList items={items} onRequestClose={() => setOpen(false)} className={`dropdown align-${align}`} />}
    </div>
  )
}

/** Hook-based context menu (right click) rendered via a portal at the cursor position. */
export function useContextMenu() {
  const [state, setState] = useState(null) // { x, y, items }

  function open(e, items) {
    e.preventDefault()
    setState({ x: e.clientX, y: e.clientY, items })
  }
  function close() {
    setState(null)
  }

  useEffect(() => {
    if (!state) return
    function onDocClick() {
      close()
    }
    function onKey(e) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', onDocClick, true)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', onDocClick, true)
    }
  }, [state])

  const menu = state
    ? createPortal(
        <MenuList
          items={state.items}
          onRequestClose={close}
          className="context"
          style={{ top: state.y, left: Math.min(state.x, window.innerWidth - 210) }}
        />,
        document.body,
      )
    : null

  return { openMenu: open, closeMenu: close, menu }
}
