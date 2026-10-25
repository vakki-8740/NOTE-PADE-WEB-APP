import './Button.css'

/**
 * Button — mirrors the kit's `.btn` variants (primary/secondary/success/
 * danger/outline/ghost) and sizes (sm/md/lg).
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  full = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const classes = ['btn', variant, size !== 'md' ? size : '', full ? 'full' : '', loading ? 'loading' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="btn-spin" aria-hidden="true" />}
      {!loading && icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}
