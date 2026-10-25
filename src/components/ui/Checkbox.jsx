import Icon from '../icons/Icon.jsx'
import './Checkbox.css'

export default function Checkbox({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`check ${disabled ? 'disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="box">
        <Icon name="check" strokeWidth={3} />
      </span>
      {label}
    </label>
  )
}
