/**
 * Shared icon set — plain inline SVGs in the same style used throughout
 * the provided UI kit (feather-style: 24x24 viewBox, stroke-based,
 * round line caps/joins, currentColor). No emojis anywhere in the UI.
 */
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  'folder-plus': [
    'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    'M12 11v6M9 14h6',
  ],
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  'folder-open':
    'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  note: ['M14 3v4a1 1 0 0 0 1 1h4', 'M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z'],
  star: 'M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.8 5.9 21l1.5-6.8-5.2-4.7 6.9-.7z',
  pin: ['M12 2l2 6h5l-4 4 2 7-5-4-5 4 2-7-4-4h5z'],
  archive: ['M3 4h18v4H3z', 'M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8', 'M10 13h4'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v5M14 11v5'],
  'rotate-ccw': ['M3 11a9 9 0 1 0 2.6-6.4L3 7', 'M3 3v4h4'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
  sun: ['M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41'],
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  'more-horizontal': ['M5 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0', 'M12 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0', 'M19 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0'],
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M20 6L9 17l-5-5',
  copy: ['M9 9h11v11H9z', 'M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1'],
  download: ['M12 3v12', 'M7 10l5 5 5-5', 'M5 21h14'],
  upload: ['M12 21V9', 'M7 14l5-5 5 5', 'M5 3h14'],
  bold: ['M7 4h6a3.5 3.5 0 0 1 0 7H7z', 'M7 11h7a3.5 3.5 0 0 1 0 7H7z'],
  italic: ['M19 4h-9', 'M14 20H5', 'M15 4L9 20'],
  underline: ['M6 4v6a6 6 0 0 0 12 0V4', 'M4 20h16'],
  strikethrough: ['M5 12h14', 'M16 6.5C15.3 5 13.8 4 12 4c-2.5 0-4.5 1.6-4.5 3.5 0 1.3.8 2.2 2 2.7', 'M8 17.5c.7 1.5 2.2 2.5 4 2.5 2.5 0 4.5-1.6 4.5-3.5 0-1-.5-1.8-1.3-2.4'],
  list: ['M8 6h13M8 12h13M8 18h13', 'M3 6h.01M3 12h.01M3 18h.01'],
  'list-ordered': ['M10 6h11M10 12h11M10 18h11', 'M4 6h1v4M4 10h2', 'M4.5 14h2a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5H5v.5h2v.75a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 1 .5-.5z'],
  'list-checks': ['M3.5 6l1.5 1.5L8 4', 'M3.5 12l1.5 1.5L8 10', 'M3.5 18l1.5 1.5L8 16', 'M12 6h9M12 12h9M12 18h9'],
  quote: ['M7 7h4v4a4 4 0 0 1-4 4', 'M15 7h4v4a4 4 0 0 1-4 4'],
  link: ['M9 17H7a5 5 0 0 1 0-10h2', 'M15 7h2a5 5 0 0 1 0 10h-2', 'M8 12h8'],
  table: ['M3 4h18v16H3z', 'M3 10h18', 'M9 4v16'],
  code: ['M8 6l-6 6 6 6', 'M16 6l6 6-6 6'],
  undo: ['M9 14 4 9l5-5', 'M4 9h11a6 6 0 0 1 0 12h-1'],
  redo: ['M15 14l5-5-5-5', 'M20 9H9a6 6 0 0 0 0 12h1'],
  heading: ['M6 4v16M18 4v16M6 12h12'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  'arrow-left': ['M19 12H5', 'M11 18l-6-6 6-6'],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  'cloud-check': ['M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z', 'M9 13l2 2 4-4'],
  'alert-triangle': ['M10.3 4.3L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z', 'M12 9v4M12 17h.01'],
  info: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 11v5M12 7.5v.5'],
  inbox: ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
  'file-text': ['M14 3v4a1 1 0 0 0 1 1h4', 'M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z', 'M9 13h6M9 17h6'],
  grip: ['M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01'],
  sparkles: ['M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z', 'M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z'],
  compass: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M16 8l-5 3-3 5 5-3z'],
  'chevron-left': 'M15 18l-6-6 6-6',
}

export default function Icon({ name, size = 16, className, strokeWidth = 2, ...rest }) {
  const d = PATHS[name]
  if (!d) return null
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  )
}
