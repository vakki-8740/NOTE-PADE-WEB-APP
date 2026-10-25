import { useEffect, useRef, useState } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import { TextField } from './TextField.jsx'

/**
 * Simple single-field text prompt, used for "New folder", "Rename
 * note/folder/tag" and similar quick-input actions.
 */
export default function PromptDialog({
  open,
  onClose,
  onSubmit,
  title,
  label = 'Name',
  placeholder = '',
  initialValue = '',
  confirmLabel = 'Save',
  icon = 'edit',
}) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      setTimeout(() => inputRef.current?.select(), 30)
    }
  }, [open, initialValue])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit?.(trimmed)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={icon}
      tone="accent"
      title={title}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!value.trim()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <TextField
          ref={inputRef}
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
      </form>
    </Modal>
  )
}
