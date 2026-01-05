/**
 * Jest Setup File
 * Runs before each test file
 */

// Set test environment
process.env.NODE_ENV = "test";

// Mock environment variables for testing
process.env.JWT_SECRET =
  "test-jwt-secret-with-minimum-32-characters-for-testing";
process.env.JWT_REFRESH_SECRET =
  "test-jwt-refresh-secret-with-minimum-32-chars";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.BCRYPT_SALT_ROUNDS = "4"; // Lower rounds for faster tests
process.env.FE_URL = "http://localhost:3000";
process.env.SMTP_USER = "test@example.com";

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests (uncomment to enable)
  // log: jest.fn(),
  // Suppress console.info during tests
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
  debug: console.debug,
};

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
});
