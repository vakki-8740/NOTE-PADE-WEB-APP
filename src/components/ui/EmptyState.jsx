import Icon from '../icons/Icon.jsx'
import Button from './Button.jsx'
import './EmptyState.css'

export default function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-art">
        <Icon name={icon} size={64} strokeWidth={1.5} />
      </span>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {actionLabel && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
