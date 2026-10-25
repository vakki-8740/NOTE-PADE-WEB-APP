import { useEffect, useRef, useCallback } from 'react'

/**
 * Returns a debounced version of `fn` that is safe to use inside React
 * components (always calls the latest `fn`, cleans up on unmount).
 * Used for editor autosave so IndexedDB writes don't happen on every
 * keystroke.
 */
export function useDebouncedCallback(fn, delay) {
  const fnRef = useRef(fn)
  const timerRef = useRef(null)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), [])

  return useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        fnRef.current(...args)
      }, delay)
    },
    [delay],
  )
}
