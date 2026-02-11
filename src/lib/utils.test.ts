/**
 * Enhetstester för cn klasser.
 * Testar att CSS-klasser slås ihop korrekt, att villkorlig rendering hanteras,
 * och att Tailwind-konflikter löses (t.ex. att p-4 skriver över p-2).
 * Testar Logic Layer.
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils: cn', () => {
  it('should merge class names correctly', () => {
    // Testar att vanliga klasser slås ihop
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    // Testar att false-värden ignoreras (clsx funktionalitet)
    expect(cn('bg-red-500', false && 'text-white', 'p-4')).toBe('bg-red-500 p-4');
  });

  it('should resolve tailwind conflicts', () => {
    // Testar att tailwind-merge fungerar (p-4 ska skriva över p-2)
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});