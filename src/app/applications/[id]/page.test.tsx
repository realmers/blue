/**
 * Enhetstester för detaljsidan för en ansökan (applications/[id]/page.tsx).
 *
 * Täcker:
 * - Omdirigering till /login utan session.
 * - Omdirigering till / om användaren inte har rollen "recruiter".
 * - Korrekt rendering när användaren har rätt roll.
 *
 * Presentation Layer test.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationPage from "./page";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

// Mocka serverberoenden
vi.mock("@/server/better-auth/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/server/db", () => ({
  db: {
    role: {
      findUnique: vi.fn(),
    },
  },
}));

// Mocka ApplicationDetail för att isolera sidans logik
vi.mock("./application-detail", () => ({
  ApplicationDetail: () => (
    <div data-testid="application-detail">ApplicationDetail</div>
  ),
}));

describe("Page: Application Detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("borde omdirigera till /login utan session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(ApplicationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("borde omdirigera till / om användaren inte har recruiter-rollen", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { role_id: 2 },
      session: {},
    } as any);
    vi.mocked(db.role.findUnique).mockResolvedValue({
      name: "applicant",
    } as any);

    await expect(ApplicationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("borde omdirigera till / om användaren saknar role_id", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: "Test" },
      session: {},
    } as any);

    await expect(ApplicationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("borde rendera sidan korrekt för recruiter-användare", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { role_id: 1 },
      session: {},
    } as any);
    vi.mocked(db.role.findUnique).mockResolvedValue({
      name: "recruiter",
    } as any);

    // Återställ redirect så den inte kastar
    vi.mocked(redirect).mockImplementation((() => {}) as any);

    const jsx = await ApplicationPage();
    render(jsx);

    expect(screen.getByTestId("application-detail")).toBeInTheDocument();
  });
});
