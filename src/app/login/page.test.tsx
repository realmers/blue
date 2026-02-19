/**
 * Integrationstest för inloggningssidan (loginPage).
 *
 * Testar hela flödet från rendering till interaktion:
 * - Mockar serveranrop (authClient) och routing (useRouter).
 * - Testar inloggning med användarnamn/lösenord, både lyckad och misslyckad.
 * - Testar "Magic Link"-flödet.
 * - Verifierar att felmeddelanden visas för användaren.
 *
 * Integration Layer test.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";
import { authClient } from "@/server/better-auth/client";

// 1. Mocka beroenden
// Vi mockar authClient för att inte göra riktiga anrop till servern.
vi.mock("@/server/better-auth/client", () => ({
  authClient: {
    signIn: {
      username: vi.fn(),
      magicLink: vi.fn(),
    },
  },
}));

// Mocka useRouter från Next.js för att se om vi omdirigeras.
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

  // Verifierar att inloggningssidan renderar rubrik, användarnamn- och lösenordsfält.
  it("borde rendera login korrekt", () => {
    render(<LoginPage />);
    // Kollar att rubriker och fält finns på plats.
    expect(
      screen.getByRole("heading", { name: /logga in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/användarnamn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lösenord/i)).toBeInTheDocument();
  });

  // Verifierar att signIn.username anropas med rätt data och att vi navigeras till "/" vid lyckad inloggning.
  it("borde calla signIn.username när ett formulär är submittad", async () => {
    // Mocka att inloggningen lyckas.
    vi.mocked(authClient.signIn.username).mockResolvedValue({
      data: {},
      error: null,
    } as any);

    render(<LoginPage />);

    // Fyll i formuläret.
    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "testuser6767" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "password6767" },
    });

    // Klicka på "Logga in".
    const submitBtn = screen.getByRole("button", { name: /^logga in$/i });
    fireEvent.click(submitBtn);

    // Verifiera att vi anropade auth-klienten med rätt data.
    await waitFor(() => {
      expect(authClient.signIn.username).toHaveBeenCalledWith({
        username: "testuser6767",
        password: "password6767",
      });
    });

    // Verifiera att användaren skickas vidare till startsidan ("/").
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  // Verifierar att serverns felmeddelande visas i UI:t vid misslyckad inloggning.
  it("borde visa error meddelande om login misslyckas", async () => {
    // Mocka att inloggningen misslyckas.
    vi.mocked(authClient.signIn.username).mockResolvedValue({
      data: null,
      error: { message: "Fel användarnamn eller lösenord" },
    } as any);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "behövervaraminsttre" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "behövervaraminståtta" },
    });

    const submitBtn = screen.getByRole("button", { name: /^logga in$/i });
    fireEvent.click(submitBtn);

    // Vänta på att felmeddelandet dyker upp i UIn.
    await waitFor(() => {
      expect(
        screen.getByText("Fel användarnamn eller lösenord"),
      ).toBeInTheDocument();
    });
  });

  // Verifierar att signIn.magicLink anropas med rätt e-post och att "Länk skickad!" visas.
  it("borde calla signIn.magicLink när email är sibmittad", async () => {
    // Mocka att magic länk anropet lyckas.
    vi.mocked(authClient.signIn.magicLink).mockResolvedValue({
      data: {},
      error: null,
    } as any);

    render(<LoginPage />);

    // Hitta e-post fältet och fyll i det.
    const emailInput = screen.getByLabelText(/logga in med e-post/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    // Klicka på "Skicka inloggningslänk".
    const submitBtn = screen.getByRole("button", {
      name: /skicka inloggningslänk/i,
    });
    fireEvent.click(submitBtn);

    // Verifiera att rätt funktion anropades.
    await waitFor(() => {
      expect(authClient.signIn.magicLink).toHaveBeenCalledWith({
        email: "test@example.com",
        callbackURL: "/",
      });
    });

    // Verifiera att success meddelandet visas ("Länk skickad!").
    expect(screen.getByText(/länk skickad!/i)).toBeInTheDocument();
  });

  // Verifierar att serverns felmeddelande visas om magic link-anropet returnerar error.
  it("borde visa fel meddelande om magic link misslyckas", async () => {
    // Simulera att servern svarar med fel på magic link.
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

  // Verifierar att "Försök igen"-knappen återställer formuläret efter att länken skickats.
  it("borde försöaka med med magic link igen (reset form)", async () => {
    // 1. Skicka länken först (Success).
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

    // Vänta på att success meddelandet visas.
    await waitFor(() => {
      expect(screen.getByText(/länk skickad!/i)).toBeInTheDocument();
    });

    // 2. Klicka på "Försök igen".
    const retryBtn = screen.getByRole("button", { name: /försök igen/i });
    fireEvent.click(retryBtn);

    // 3. Verifiera att formuläret är tillbaka.
    expect(screen.getByLabelText(/logga in med e-post/i)).toBeInTheDocument();
    expect(screen.queryByText(/länk skickad!/i)).not.toBeInTheDocument();
  });

  // Verifierar att ett nätverksfel (kastat Error) fångas och visas som felmeddelande.
  it("borde hantera oförväntade errors för användarnamn login", async () => {
    // Simulera att funktionen kraschar helt (kastar Error).
    vi.mocked(authClient.signIn.username).mockRejectedValue(
      new Error("Nätverksfel"),
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "behövervaraminståttatecken" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^logga in$/i }));

    await waitFor(() => {
      expect(screen.getByText("Nätverksfel")).toBeInTheDocument();
    });
  });

  // Verifierar att felmeddelandet från Error-objektet visas vid reject.
  it("borde hantera okända fel för användarnamn login", async () => {
    vi.mocked(authClient.signIn.username).mockRejectedValue(
      new Error("Nätverksfel"),
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "behövervaraminståttatecken" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^logga in$/i }));

    await waitFor(() => {
      expect(screen.getByText("Nätverksfel")).toBeInTheDocument();
    });
  });

  // 1. Testa att Zod stoppar ogiltig input (klientvalidering).
  it("borde visa validerings error om input är fel (Client-side validation)", async () => {
    const signInSpy = vi.mocked(authClient.signIn.username);
    render(<LoginPage />);

    // 1. Vi fyller i värden som är för korta för Zod (min 3 och min 8),
    // men tillräckliga för att webbläsaren inte ska stoppa oss pga "required".
    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "ab" }, // Bara 2 tecken (Kravet är 3)
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "12345" }, // Bara 5 tecken (Kravet är 8)
    });

    // 2. Klicka på knappen.
    fireEvent.click(screen.getByRole("button", { name: /^logga in$/i }));

    await waitFor(() => {
      // Verifiera att servern INTE anropades
      expect(signInSpy).not.toHaveBeenCalled();
      // Verifiera att vi får exakt det felmeddelande som står i schema-filen.
      expect(
        screen.getAllByText("Felaktigt användarnamn eller lösenord")[0],
      ).toBeInTheDocument();
    });
  });

  // 2. Testa Exception (krasch) i Magic Link-flödet.
  it("borde hantera okända errors för magic link", async () => {
    // Simulera att funktionen kraschar (kastar Error).
    vi.mocked(authClient.signIn.magicLink).mockRejectedValue(
      new Error("Kunde inte nå servern"),
    );

    render(<LoginPage />);

    // Fyll i e-post.
    const emailInput = screen.getByLabelText(/logga in med e-post/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    // Klicka skicka.
    fireEvent.click(
      screen.getByRole("button", { name: /skicka inloggningslänk/i }),
    );

    // Verifiera att felmeddelandet från Error-objektet visas.
    await waitFor(() => {
      expect(screen.getByText("Kunde inte nå servern")).toBeInTheDocument();
    });
  });

  // 3. Testa "Edge case" för catch blocket.
  it("borde hantera om oväntat fel kastas", async () => {
    // Vi kastar en sträng istället för ett Error objekt.
    vi.mocked(authClient.signIn.username).mockRejectedValue(
      "Bara en sträng, inget Error-objekt",
    );

    render(<LoginPage />);

    // Fyll i giltiga värden så vi passerar Zod-valideringen.
    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "giltigtNamn" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "giltigtLösenord123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^logga in$/i }));

    await waitFor(() => {
      // Här förväntar vi oss fallback-texten.
      expect(
        screen.getByText("Ett oväntat fel inträffade"),
      ).toBeInTheDocument();
    });
  });
});
