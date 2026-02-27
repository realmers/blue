/**
 * 
 * Global setup-fil för testmiljön.
 * Importerar jest-dom matchers (t.ex. toBeInTheDocument) så de finns tillgängliga i alla tester,
 * och hanterar automatisk städning (cleanup) efter varje test.
 * 
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock("@/env", () => ({
  env: {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432",
    NODE_ENV: "test",
    LOG_LEVEL: "error", 
    BETTER_AUTH_SECRET: "this_is_a_very_long_test_secret_123456789",
  },
}));

// Kör städning efter varje test.
afterEach(() => {
  cleanup();
});