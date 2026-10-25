import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Only relevant for component tests that render into jsdom; a no-op for the
// plain-node unit tests elsewhere in the suite.
afterEach(() => {
  cleanup()
})
