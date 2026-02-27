/**
 * Tester för Header-komponenten.
 *
 * Täcker:
 * - Rendering av logotyp och navigation.
 * - Utloggat tillstånd (visar "Logga in"-länk).
 * - Inloggat tillstånd (visar "Logga ut"-knapp).
 * - Utloggningsflöde (anropar signOut och navigerar).
 *
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Header } from "./header";

// Mocka Next.js router
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

// Mocka authClient
const useSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/server/better-auth/client", () => ({
  authClient: {
    useSession: () => useSessionMock(),
    signOut: (...args: unknown[]) => signOutMock(...args),
  },
}));

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue(undefined);
  });

  // Verifierar att logotypen "Blå Lund Rekrytering" finns och att användare kan se den.
  it("borde rendera logotypen", () => {
    useSessionMock.mockReturnValue({ data: null });

    render(<Header />);
    expect(screen.getByText("Blå Lund Rekrytering")).toBeInTheDocument();
  });

  // Verifierar att navigeringslänken "Hem" renderas korrekt.
  it("borde rendera Hem-länken", () => {
    useSessionMock.mockReturnValue({ data: null });

    render(<Header />);
    expect(screen.getByText("Hem")).toBeInTheDocument();
  });

  // Verifierar att "Logga in"-länken visas och "Logga ut" döljs när sessionen är null.
  it("borde visa 'Logga in'-länk när användaren är utloggad", () => {
    useSessionMock.mockReturnValue({ data: null });

    render(<Header />);
    expect(screen.getByText("Logga in")).toBeInTheDocument();
    expect(screen.queryByText("Logga ut")).not.toBeInTheDocument();
  });

  // Verifierar att "Logga ut"-knappen visas och "Logga in" döljs när sessionen finns.
  it("borde visa 'Logga ut'-knapp när användaren är inloggad", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "Test User" } },
    });

    render(<Header />);
    expect(screen.getByText("Logga ut")).toBeInTheDocument();
    expect(screen.queryByText("Logga in")).not.toBeInTheDocument();
  });

  // Verifierar att klick på "Logga ut" anropar signOut, refreshar och navigerar till "/".
  it("borde anropa signOut och navigera vid utloggning", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "Test User" } },
    });

    render(<Header />);

    const logoutBtn = screen.getByText("Logga ut");
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  // Verifierar att logotypens <a>-element pekar till "/".
  it("borde ha korrekt länk till startsidan från logotypen", () => {
    useSessionMock.mockReturnValue({ data: null });

    render(<Header />);
    const logoLink = screen.getByText("Blå Lund Rekrytering").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  // Verifierar att "Logga in"-länkens href pekar till "/login".
  it("borde ha korrekt länk till loginsidan", () => {
    useSessionMock.mockReturnValue({ data: null });

    render(<Header />);
    const loginLink = screen.getByText("Logga in").closest("a");
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
