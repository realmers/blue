/**
 * Enhetstester för Footer-komponenten.
 *
 * Täcker:
 * - Rendering av varumärke/logotyp.
 * - Navigeringslänkar för sökande.
 * - Navigeringslänkar för support & juridik.
 * - Copyright-text.
 *
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

describe("Footer", () => {
  it("borde rendera varumärket 'Blå Lund Rekrytering'", () => {
    render(<Footer />);
    expect(screen.getByText("Blå Lund Rekrytering")).toBeInTheDocument();
  });

  it("borde rendera beskrivningstexten", () => {
    render(<Footer />);
    expect(
      screen.getByText(/sök stockholms roligaste sommarjobb/i),
    ).toBeInTheDocument();
  });

  it("borde rendera sektionsrubriken 'För Sökande'", () => {
    render(<Footer />);
    expect(screen.getByText("För Sökande")).toBeInTheDocument();
  });

  it("borde rendera länken 'Registrera konto' som pekar till /create-account", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /registrera konto/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/create-account");
  });

  it("borde rendera länken 'Logga in' som pekar till /login", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /^logga in$/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("borde rendera sektionsrubriken 'Support & Juridik'", () => {
    render(<Footer />);
    expect(screen.getByText("Support & Juridik")).toBeInTheDocument();
  });

  it("borde rendera länken 'Kontakta support' som pekar till /contact", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /kontakta support/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("borde rendera länken 'Integritetspolicy' som pekar till /privacy", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /integritetspolicy/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("borde rendera länken 'Systemstatus' som pekar till /status", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /systemstatus/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/status");
  });

  it("borde rendera copyright-texten", () => {
    render(<Footer />);
    expect(
      screen.getByText(/© 2026 blå lund rekrytering/i),
    ).toBeInTheDocument();
  });

  it("borde rendera varumärket som en länk till startsidan", () => {
    render(<Footer />);
    const brandLink = screen.getByRole("link", { name: /blå lund rekrytering/i });
    expect(brandLink).toHaveAttribute("href", "/");
  });
});
