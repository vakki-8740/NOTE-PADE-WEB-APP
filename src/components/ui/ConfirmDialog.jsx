import Modal from './Modal.jsx'
import Button from './Button.jsx'

/**
 * Confirmation dialog used for anything destructive (delete note/folder,
 * empty trash, replace all data on import, etc). Centralizing this means
 * every destructive action in the app gets the same "protect against
 * accidental deletion" treatment.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon = 'alert-triangle',
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={icon}
      tone={tone}
      title={title}
      description={description}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
