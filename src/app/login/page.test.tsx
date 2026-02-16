/**
 * Integrationstest för inloggningssidan (loginPage).
 * Testar hela flödet från rendering till interaktion:
 * - Mockar serveranrop (authClient) och routing (useRouter).
 * - Testar inloggning med användarnamn/lösenord (både lyckad och misslyckad).
 * - Testar "Magic Link"-flödet.
 * - Verifierar att felmeddelanden visas för användaren.
 * Tillhör Integration Layer.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import { authClient } from "@/server/better-auth/client";

// 1. Mocka beroenden
// Vi mockar authClient för att inte göra riktiga anrop till servern/databasen
vi.mock("@/server/better-auth/client", () => ({
  authClient: {
    signIn: {
      username: vi.fn(),
      magicLink: vi.fn(),
    },
  },
}));

// Mocka useRouter från Next.js för att se om vi omdirigeras
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: vi.fn(),
  }),
}));

describe("Page: Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form correctly", () => {
    render(<LoginPage />);
    // Kollar att rubriker och fält finns på plats
    expect(
      screen.getByRole("heading", { name: /logga in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/användarnamn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lösenord/i)).toBeInTheDocument();
  });

  it("should call signIn.username when form is submitted", async () => {
    // Mocka att inloggningen lyckas
    vi.mocked(authClient.signIn.username).mockResolvedValue({
      data: {},
      error: null,
    } as any);

    render(<LoginPage />);

    // Fyll i formuläret
    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "testuser6767" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "password6767" },
    });

    // Klicka på "Logga in" (använder regex ^...$ för att matcha exakt och inte ta "Logga in med mail")
    const submitBtn = screen.getByRole("button", { name: /^logga in$/i });
    fireEvent.click(submitBtn);

    // Verifiera att vi anropade auth-klienten med rätt data
    await waitFor(() => {
      expect(authClient.signIn.username).toHaveBeenCalledWith({
        username: "testuser6767",
        password: "password6767",
      });
    });

    // Verifiera att användaren skickas vidare till startsidan ("/")
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("should show error message if login fails", async () => {
    // Mocka att inloggningen misslyckas
    vi.mocked(authClient.signIn.username).mockResolvedValue({
      data: null,
      error: { message: "Fel användarnamn eller lösenord" },
    } as any);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "wrong" },
    });

    const submitBtn = screen.getByRole("button", { name: /^logga in$/i });
    fireEvent.click(submitBtn);

    // Vänta på att felmeddelandet dyker upp i UI:t
    await waitFor(() => {
      expect(
        screen.getByText("Fel användarnamn eller lösenord"),
      ).toBeInTheDocument();
    });
  });

  it("should call signIn.magicLink when email form is submitted", async () => {
    // Mocka att magic link-anropet lyckas
    vi.mocked(authClient.signIn.magicLink).mockResolvedValue({
      data: {},
      error: null,
    } as any);

    render(<LoginPage />);

    // Hitta e-post fältet och fyll i det
    const emailInput = screen.getByLabelText(/logga in med e-post/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    // Klicka på "Skicka inloggningslänk"
    const submitBtn = screen.getByRole("button", {
      name: /skicka inloggningslänk/i,
    });
    fireEvent.click(submitBtn);

    // Verifiera att rätt funktion anropades
    await waitFor(() => {
      expect(authClient.signIn.magicLink).toHaveBeenCalledWith({
        email: "test@example.com",
        callbackURL: "/",
      });
    });

    // Verifiera att success-meddelandet visas (baserat på din kod: "Länk skickad!")
    expect(screen.getByText(/länk skickad!/i)).toBeInTheDocument();
  });

  it("should show error message if magic link fails", async () => {
    // Simulera att servern svarar med fel på magic link
    vi.mocked(authClient.signIn.magicLink).mockResolvedValue({
      data: null,
      error: { message: "Kunde inte skicka länk" },
    } as any);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/logga in med e-post/i);
    fireEvent.change(emailInput, { target: { value: "fel@example.com" } });

    const submitBtn = screen.getByRole("button", {
      name: /skicka inloggningslänk/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Kunde inte skicka länk")).toBeInTheDocument();
    });
  });

  it("should allow retrying magic link (reset form)", async () => {
    // 1. Skicka länken först (Success)
    vi.mocked(authClient.signIn.magicLink).mockResolvedValue({
      data: {},
      error: null,
    } as any);
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/logga in med e-post/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(
      screen.getByRole("button", { name: /skicka inloggningslänk/i }),
    );

    // Vänta på att success-meddelandet visas
    await waitFor(() => {
      expect(screen.getByText(/länk skickad!/i)).toBeInTheDocument();
    });

    // 2. Klicka på "Försök igen"
    const retryBtn = screen.getByRole("button", { name: /försök igen/i });
    fireEvent.click(retryBtn);

    // 3. Verifiera att formuläret är tillbaka
    expect(screen.getByLabelText(/logga in med e-post/i)).toBeInTheDocument();
    expect(screen.queryByText(/länk skickad!/i)).not.toBeInTheDocument();
  });

  it("should handle unexpected errors (exceptions) for username login", async () => {
    // Simulera att funktionen kraschar helt (kastar Error)
    vi.mocked(authClient.signIn.username).mockRejectedValue(
      new Error("Nätverksfel"),
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^logga in$/i }));

    await waitFor(() => {
      expect(screen.getByText("Nätverksfel")).toBeInTheDocument();
    });
  });
});
