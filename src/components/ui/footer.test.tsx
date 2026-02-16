/**
 * Enkelt renderingstest för Footer-komponenten.
 * Tillhör UI Layer.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

describe('Component: Footer', () => {
  it('should render footer content correctly', () => {
    render(<Footer />);
    // Byt ut texten nedan mot något som faktiskt står i din footer
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); 
  });
});