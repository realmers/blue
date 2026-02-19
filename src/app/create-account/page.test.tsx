/**
 * Enhetstester för skapa konto-sidan (create-account/page.tsx).
 *
 * Täcker:
 * - Rendering av rubrik och formulär utan session.
 * - Förfyllda standardvärden från en befintlig session.
 *
 * Presentation Layer test.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CreateAccountPage from "./page";
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

// Mocka CreateAccountForm för att isolera sidans logik
let capturedProps: Record<string, unknown> = {};
vi.mock("./create-account-form", () => ({
  CreateAccountForm: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="create-account-form">CreateAccountForm</div>;
  },
}));

describe("Page: Create Account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps = {};
  });

  it("borde rendera rubrik och formulär", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const jsx = await CreateAccountPage();
    render(jsx);

    expect(
      screen.getByRole("heading", { name: /skapa konto/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("create-account-form")).toBeInTheDocument();
  });

  it("borde skicka tomma standardvärden utan session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const jsx = await CreateAccountPage();
    render(jsx);

    expect(capturedProps.defaultEmail).toBe("");
    expect(capturedProps.defaultName).toBe("");
    expect(capturedProps.defaultSurname).toBe("");
  });

  it("borde skicka förfyllda standardvärden från session", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: {
        name: "Anna Svensson",
        email: "anna@example.com",
      },
      session: {},
    } as any);

    const jsx = await CreateAccountPage();
    render(jsx);

    expect(capturedProps.defaultEmail).toBe("anna@example.com");
    expect(capturedProps.defaultName).toBe("Anna");
    expect(capturedProps.defaultSurname).toBe("Svensson");
  });

  it("borde hantera namn med flera efternamn korrekt", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: {
        name: "Anna Maria Svensson",
        email: "anna@example.com",
      },
      session: {},
    } as any);

    const jsx = await CreateAccountPage();
    render(jsx);

    expect(capturedProps.defaultName).toBe("Anna");
    expect(capturedProps.defaultSurname).toBe("Maria Svensson");
  });
});
