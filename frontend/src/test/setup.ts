import '@testing-library/jest-dom'
import { beforeAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock API base URL
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Setup function to run before all tests
beforeAll(() => {
  // Mock any global objects or APIs here
})