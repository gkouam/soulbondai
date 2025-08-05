// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test',
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    // Add other models as needed
  },
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Silence console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})