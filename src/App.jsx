import { useEffect } from 'react'
import { useData } from './context/DataContext.jsx'
import AppShell from './components/layout/AppShell.jsx'
import EmptyState from './components/ui/EmptyState.jsx'
import './App.css'

/** Resolves 'light' | 'dark' | 'system' into the concrete theme to paint. */
function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export default function App() {
  const data = useData()

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(data.settings.theme)
    }
    apply()
    if (data.settings.theme !== 'system') return undefined
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [data.settings.theme])

  // Global keyboard shortcuts that make sense anywhere in the app.
  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        data.addNote()
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        document.querySelector('.search-field input')?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [data])

  if (data.loading) {
    return (
      <div className="app-loading">
        <EmptyState icon="note" title="Loading your notes…" description="Just a moment." />
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="app-loading">
        <EmptyState icon="alert-triangle" title="Something went wrong" description={data.error} />
      </div>
    )
  }

  return <AppShell />
}
