/**
 * Enhetstester för startsidan (page.tsx).
 *
 * Täcker:
 * - Rendering av rubrik och kort utan session (utloggat läge).
 * - Rendering av välkomstmeddelande och navigeringslänkar med session (inloggat läge).
 *
 * Presentation Layer test.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";
import { getSession } from "@/server/better-auth/server";

// Mocka serverberoenden
vi.mock("@/server/better-auth/server", () => ({
  getSession: vi.fn(),
}));

// Mocka HydrateClient som en enkel wrapper
vi.mock("@/trpc/server", () => ({
  HydrateClient: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("Page: Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("borde rendera rubrik och kort utan session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const jsx = await Home();
    render(jsx);

    // Huvudrubrik
    expect(
      screen.getByRole("heading", { name: /blå lund/i }),
    ).toBeInTheDocument();

    // Kortrubrikerna
    expect(
      screen.getByRole("heading", { name: /sökande/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /rekryterare/i }),
    ).toBeInTheDocument();

    // Navigeringslänkar i utloggat läge
    expect(screen.getByText(/skapa konto →/i)).toBeInTheDocument();
    expect(screen.getByText(/logga in som rekryterare/i)).toBeInTheDocument();
  });

  it("borde rendera välkomstmeddelande och inloggade länkar med session", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: "Test Testsson", email: "test@example.com" },
      session: {},
    } as any);

    const jsx = await Home();
    render(jsx);

    // Välkomstmeddelande
    expect(screen.getByText("Test Testsson")).toBeInTheDocument();

    // Inloggade navigeringslänkar
    expect(screen.getByText(/min ansökan →/i)).toBeInTheDocument();
    expect(screen.getByText(/hantera ansökningar →/i)).toBeInTheDocument();
    expect(screen.getByText(/gå till instrumentpanelen/i)).toBeInTheDocument();
  });

  it("borde visa 'Logga in på ditt konto'-länk utan session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const jsx = await Home();
    render(jsx);

    expect(screen.getByText(/logga in på ditt konto/i)).toBeInTheDocument();
  });
});
