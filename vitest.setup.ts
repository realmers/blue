/**
 * Global setup-fil för testmiljön.
 * Importerar jest-dom matchers (t.ex. toBeInTheDocument) så de finns tillgängliga i alla tester,
 * och hanterar automatisk städning (cleanup) efter varje test.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Kör städning efter varje test.
afterEach(() => {
  cleanup();
});