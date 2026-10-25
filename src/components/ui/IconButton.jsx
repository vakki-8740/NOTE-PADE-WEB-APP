import Icon from '../icons/Icon.jsx'
import './IconButton.css'

/**
 * IconButton — mirrors the kit's `.p-iconbtn` / `.ghost-btn` patterns:
 * plain, filled (accent) and soft (accent-tinted) variants.
 */
export default function IconButton({
  icon,
  label,
  variant = 'plain',
  size = 'md',
  active = false,
  className = '',
  ...rest
}) {
  const classes = ['icon-btn', variant, size !== 'md' ? size : '', active ? 'active' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={classes} aria-label={label} title={label} {...rest}>
      {typeof icon === 'string' ? <Icon name={icon} size={size === 'sm' ? 15 : 17} /> : icon}
    </button>
  )
}
