/**
 * Testar header-komponenten.
 * Verifierar att rätt navigering visas beroende på auth-status (inloggad/utloggad)
 * och att logga ut-knappen fungerar.
 * Tillhör UI Layer.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from './header';
import { authClient } from '@/server/better-auth/client';

// Mocka auth-klienten
vi.mock('@/server/better-auth/client', () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  }
}));

// Mocka useRouter
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe('Component: Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Logga in" when user is NOT logged in', () => {
    // Simulera utloggad (session är null)
    // LÄGG TILL "as any" HÄR:
    vi.mocked(authClient.useSession).mockReturnValue({ 
      data: null, 
      isPending: false, 
      error: null 
    } as any);

    render(<Header />);

    expect(screen.getByText('Blå Lund Rekrytering')).toBeInTheDocument();
    // Kollar att vi har en länk till login
    expect(screen.getByRole('link', { name: /logga in/i })).toBeInTheDocument();
    // Kollar att "Logga ut" INTE finns
    expect(screen.queryByText(/logga ut/i)).not.toBeInTheDocument();
  });

  it('should show "Logga ut" when user IS logged in', () => {
    // Simulera inloggad
    // LÄGG TILL "as any" HÄR:
    vi.mocked(authClient.useSession).mockReturnValue({ 
      data: { user: { id: '1', email: 'test@test.se' } }, 
      isPending: false, 
      error: null 
    } as any);

    render(<Header />);

    // Kollar att "Logga ut" finns
    expect(screen.getByRole('button', { name: /logga ut/i })).toBeInTheDocument();
    // Kollar att länken till login INTE finns
    expect(screen.queryByRole('link', { name: /logga in/i })).not.toBeInTheDocument();
  });

  it('should handle logout click', async () => {
    // Simulera inloggad
    // LÄGG TILL "as any" HÄR:
    vi.mocked(authClient.useSession).mockReturnValue({ 
      data: { user: { id: '1' } }, 
      isPending: false, 
      error: null 
    } as any);

    render(<Header />);

    const logoutBtn = screen.getByRole('button', { name: /logga ut/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });
});