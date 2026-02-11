/**
 * Komponent-test för UI-komponenten Button.
 * Verifierar att knappen renderar text, hanterar klick-events,
 * applicerar korrekta visuella varianter (t.ex. destructive) och stöder disabled-läget.
 * Tillhör UI Layer.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Component: Button', () => {
  it('should render correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle onClick events', () => {
    const handleClick = vi.fn(); // Skapa en mock-funktion
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    // Kollar att destructive-klassen finns (från din cva-config)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('should be disabled when disabled prop is passed', () => {
    render(<Button disabled>Can't click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});