import { forwardRef, useId } from 'react'
import Icon from '../icons/Icon.jsx'
import './TextField.css'

export const TextField = forwardRef(function TextField(
  { label, help, error, lead, trail, className = '', id, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? (label ? autoId : undefined)
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <div className={`control ${lead ? 'has-lead' : ''} ${trail ? 'has-trail' : ''}`}>
        {lead && <span className="lead">{lead}</span>}
        <input ref={ref} id={fieldId} className="input" {...rest} />
        {trail && <span className="trail">{trail}</span>}
      </div>
      {(error || help) && <span className={`help ${error ? 'error' : ''}`}>{error || help}</span>}
    </div>
  )
})

export const TextArea = forwardRef(function TextArea({ label, help, error, className = '', id, ...rest }, ref) {
  const autoId = useId()
  const fieldId = id ?? (label ? autoId : undefined)
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <textarea ref={ref} id={fieldId} className="input textarea" {...rest} />
      {(error || help) && <span className={`help ${error ? 'error' : ''}`}>{error || help}</span>}
    </div>
  )
})

export function SearchField({ value, onChange, placeholder = 'Search…', className = '', ...rest }) {
  return (
    <div className={`field search-field ${className}`}>
      <div className="control has-lead">
        <span className="lead">
          <Icon name="search" size={16} />
        </span>
        <input
          type="search"
          className="input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
      </div>
    </div>
  )
}
