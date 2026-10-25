import './Switch.css'

export default function Switch({ checked, onChange, label, size = 'md', disabled = false }) {
  return (
    <label className={`switch ${size !== 'md' ? size : ''} ${disabled ? 'disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="track" />
      {label && <span className="switch-label">{label}</span>}
    </label>
  )
}
