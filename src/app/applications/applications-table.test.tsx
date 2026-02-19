/**
 * Tester för ansökningstabell-komponenten.
 *
 * Täcker:
 * - Laddningstillstånd (loading state).
 * - Feltillstånd (error state).
 * - Tomt tillstånd (inga ansökningar).
 * - Rendering av data med kompetenser, tillgänglighet och status.
 * - Navigering vid radklick.
 *
 * Presentation Layer test.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApplicationsTable } from "./applications-table";

// Mocka Next.js router
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mocka tRPC
const useQueryMock = vi.fn();
vi.mock("@/trpc/react", () => ({
  api: {
    application: {
      listAll: {
        useQuery: (...args: unknown[]) => useQueryMock(...args),
      },
    },
  },
}));

describe("ApplicationsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Verifierar att laddningsmeddelandet visas medan data hämtas.
  it("borde visa laddningstillstånd", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<ApplicationsTable />);
    expect(screen.getByText("Laddar ansökningar...")).toBeInTheDocument();
  });

  // Verifierar att ett felmeddelande visas när API-anropet misslyckas.
  it("borde visa felmeddelande vid error", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Serverfel" },
    });

    render(<ApplicationsTable />);
    expect(
      screen.getByText(/Kunde inte ladda ansökningar: Serverfel/),
    ).toBeInTheDocument();
  });

  // Verifierar att "inga ansökningar"-meddelande visas vid tom lista.
  it("borde visa tomt tillstånd när det inte finns ansökningar", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);
    expect(
      screen.getByText("Inga ansökningar hittades."),
    ).toBeInTheDocument();
  });

  // Verifierar att tomt tillstånd hanteras även när data är undefined.
  it("borde visa tomt tillstånd när data är undefined", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);
    expect(
      screen.getByText("Inga ansökningar hittades."),
    ).toBeInTheDocument();
  });

  // Verifierar att tabellhuvuden och ansökningsdata (namn, e-post, kompetens, status) renderas korrekt.
  it("borde rendera ansökningsdata korrekt", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Anna",
          surname: "Svensson",
          email: "anna@test.com",
          application_status: "unhandled",
          createdAt: "2024-06-15T10:00:00Z",
          competence_profile: [
            {
              competence_profile_id: 10,
              years_of_experience: 3,
              competence: { name: "Frontend" },
            },
          ],
          availability: [
            {
              availability_id: 20,
              from_date: "2024-07-01T00:00:00Z",
              to_date: "2024-08-01T00:00:00Z",
            },
          ],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);

    // Tabellhuvuden
    expect(screen.getByText("Namn")).toBeInTheDocument();
    expect(screen.getByText("E-post")).toBeInTheDocument();
    expect(screen.getByText("Kompetenser")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    // Data
    expect(screen.getByText("Anna Svensson")).toBeInTheDocument();
    expect(screen.getByText("anna@test.com")).toBeInTheDocument();
    expect(screen.getByText(/Frontend/)).toBeInTheDocument();
    expect(screen.getByText(/3 år/)).toBeInTheDocument();
    expect(screen.getByText("Obehandlad")).toBeInTheDocument();
  });

  // Verifierar att ett streck (—) visas som fallback när e-post saknas.
  it("borde visa streck när e-post saknas", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test",
          surname: null,
          email: null,
          application_status: "accepted",
          createdAt: "2024-01-01T00:00:00Z",
          competence_profile: [],
          availability: [],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);
    // E-post saknas -> "—" visas
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Godkänd")).toBeInTheDocument();
  });

  // Verifierar att streck visas när kompetenser och tillgänglighetsperioder är tomma.
  it("borde visa streck när kompetenser och tillgänglighet saknas", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test",
          surname: "User",
          email: "test@test.com",
          application_status: "rejected",
          createdAt: "2024-01-01T00:00:00Z",
          competence_profile: [],
          availability: [],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);
    // Tomma kompetenser och tillgänglighet -> "—" visas
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Avvisad")).toBeInTheDocument();
  });

  // Verifierar att klick på en tabellrad navigerar till rätt detalj-sida.
  it("borde navigera till ansökningsdetalj vid radklick", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 42,
          name: "Klickbar",
          surname: "Rad",
          email: "klick@test.com",
          application_status: "unhandled",
          createdAt: "2024-01-01T00:00:00Z",
          competence_profile: [],
          availability: [],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);

    const row = screen.getByText("Klickbar Rad").closest("tr");
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    expect(pushMock).toHaveBeenCalledWith("/applications/42");
  });

  // Verifierar att "Okänd" visas som fallback när kompetensens namn saknas.
  it("borde visa 'Okänd' när kompetensnamn saknas", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test",
          surname: "User",
          email: "test@test.com",
          application_status: "unhandled",
          createdAt: "2024-01-01T00:00:00Z",
          competence_profile: [
            {
              competence_profile_id: 10,
              years_of_experience: 2,
              competence: null,
            },
          ],
          availability: [],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);
    expect(screen.getByText("Okänd")).toBeInTheDocument();
  });

  // Verifierar att "?" visas som fallback när tillgänglighetsdatum saknas.
  it("borde visa '?' när from_date eller to_date saknas", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test",
          surname: "User",
          email: "test@test.com",
          application_status: "unhandled",
          createdAt: "2024-01-01T00:00:00Z",
          competence_profile: [],
          availability: [
            {
              availability_id: 20,
              from_date: null,
              to_date: null,
            },
          ],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);
    // Datumen visas som "? – ?" i ett element
    expect(screen.getByText(/\? – \?/)).toBeInTheDocument();
  });

  // Verifierar att en okänd status visas med sitt råvärde och outline-variant.
  it("borde visa okänd status med råvärde som fallback", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test",
          surname: "User",
          email: "test@test.com",
          application_status: "unknown_status",
          createdAt: "2024-01-01T00:00:00Z",
          competence_profile: [],
          availability: [],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);
    expect(screen.getByText("unknown_status")).toBeInTheDocument();
  });

  // Verifierar att tabellen renderar flera rader korrekt.
  it("borde rendera flera ansökningar", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          name: "Person",
          surname: "En",
          email: "en@test.com",
          application_status: "unhandled",
          createdAt: "2024-01-01T00:00:00Z",
          competence_profile: [],
          availability: [],
        },
        {
          id: 2,
          name: "Person",
          surname: "Två",
          email: "tva@test.com",
          application_status: "accepted",
          createdAt: "2024-02-01T00:00:00Z",
          competence_profile: [],
          availability: [],
        },
      ],
      isLoading: false,
      error: null,
    });

    render(<ApplicationsTable />);

    expect(screen.getByText("Person En")).toBeInTheDocument();
    expect(screen.getByText("Person Två")).toBeInTheDocument();
    expect(screen.getByText("en@test.com")).toBeInTheDocument();
    expect(screen.getByText("tva@test.com")).toBeInTheDocument();
  });
});
