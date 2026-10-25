/**
 * Plain-text helpers used for word/character counts and list previews.
 * The editor stores content as sanitized HTML, so these helpers strip
 * markup before counting/measuring.
 */

export function stripHtml(html) {
  if (!html) return ''
  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (div) {
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }
  // Non-DOM fallback (e.g. tests/node)
  return html.replace(/<[^>]*>/g, ' ')
}

export function wordCount(html) {
  const text = stripHtml(html).trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function charCount(html) {
  return stripHtml(html).length
}

export function previewText(html, maxLen = 140) {
  const text = stripHtml(html).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen).trim()}…`
}
