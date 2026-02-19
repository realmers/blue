/**
 * Tester för ansökningsdetalj-komponenten.
 *
 * Täcker:
 * - Laddningstillstånd.
 * - Feltillstånd (query error och saknad ansökan).
 * - Rendering av personuppgifter, kompetenser och tillgänglighet.
 * - Statusändring via mutation (onSuccess/onError).
 * - Conflict-felhantering (optimistisk samtidighetskontroll).
 * - Tillbaka-knapp navigering.
 *
 * Integration Layer test.
 */

import { act } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApplicationDetail } from "./application-detail";

// Mocka Next.js router och params
const pushMock = vi.fn();
let mockParamsId: string = "1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useParams: () => ({
    id: mockParamsId,
  }),
}));

// Mocka tRPC med fångade callbacks
const useQueryMock = vi.fn();
const useMutationMock = vi.fn();
const mutateMock = vi.fn();
const invalidateMock = vi.fn();

vi.mock("@/trpc/react", () => ({
  api: {
    application: {
      getById: {
        useQuery: (...args: unknown[]) => useQueryMock(...args),
      },
      updateStatus: {
        useMutation: (options: any) => {
          useMutationMock(options);
          return {
            mutate: mutateMock,
            isPending: false,
            error: null,
          };
        },
      },
    },
    useUtils: () => ({
      application: {
        listAll: {
          invalidate: invalidateMock,
        },
      },
    }),
  },
}));

// Mockad ansökningsdata
const mockApplication = {
  id: 1,
  name: "Anna",
  surname: "Svensson",
  email: "anna@test.com",
  pnr: "199001011234",
  application_status: "unhandled",
  createdAt: "2024-06-15T10:00:00Z",
  updatedAt: "2024-06-15T10:00:00Z",
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
};

describe("ApplicationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParamsId = "1";
  });

  // Verifierar att laddningsmeddelandet visas medan ansökan hämtas.
  it("borde visa laddningstillstånd", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(screen.getByText("Laddar ansökan...")).toBeInTheDocument();
  });

  // Verifierar att serverns felmeddelande visas vid misslyckad datahämtning.
  it("borde visa felmeddelande vid query error", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Hittade inte ansökan" },
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(screen.getByText("Hittade inte ansökan")).toBeInTheDocument();
  });

  // Verifierar att fallback-felmeddelande visas när data är undefined (ingen error, ingen data).
  it("borde visa felmeddelande när ansökan är undefined", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(screen.getByText("Ansökan hittades inte")).toBeInTheDocument();
  });

  // Verifierar att alla personuppgifter (namn, e-post, personnummer) renderas.
  it("borde rendera personuppgifter korrekt", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);

    expect(screen.getByText("Personuppgifter")).toBeInTheDocument();
    expect(screen.getByText("Anna")).toBeInTheDocument();
    expect(screen.getByText("Svensson")).toBeInTheDocument();
    expect(screen.getByText("anna@test.com")).toBeInTheDocument();
    expect(screen.getByText("199001011234")).toBeInTheDocument();
  });

  // Verifierar att streck (—) visas som fallback för saknade valfria fält.
  it("borde visa streck när valfria fält saknas", () => {
    useQueryMock.mockReturnValue({
      data: {
        ...mockApplication,
        surname: null,
        email: null,
        pnr: null,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    // Streck "—" för saknade fält
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  // Verifierar att kompetensnamn och erfarenhetsår renderas korrekt.
  it("borde rendera kompetenser korrekt", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(screen.getByText("Kompetenser")).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText(/3 års erfarenhet/)).toBeInTheDocument();
  });

  // Verifierar att tomt-meddelande visas när kompetenser saknas.
  it("borde visa meddelande när kompetenser saknas", () => {
    useQueryMock.mockReturnValue({
      data: { ...mockApplication, competence_profile: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(screen.getByText("Inga kompetenser angivna.")).toBeInTheDocument();
  });

  // Verifierar att datum för tillgänglighetsperioder visas i sv-SE-format.
  it("borde rendera tillgänglighetsperioder korrekt", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(screen.getByText("Tillgänglighet")).toBeInTheDocument();
    // Datumformat sv-SE
    expect(screen.getByText(/2024-07-01/)).toBeInTheDocument();
    expect(screen.getByText(/2024-08-01/)).toBeInTheDocument();
  });

  // Verifierar att tomt-meddelande visas när inga tillgänglighetsperioder finns.
  it("borde visa meddelande när tillgänglighet saknas", () => {
    useQueryMock.mockReturnValue({
      data: { ...mockApplication, availability: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(
      screen.getByText("Inga tillgänglighetsperioder angivna."),
    ).toBeInTheDocument();
  });

  // Verifierar att nuvarande status visas i Badge och Select.
  it("borde visa nuvarande status", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    expect(screen.getByText("Status")).toBeInTheDocument();
    // "Obehandlad" visas både i Badge och i Select-värdet
    expect(screen.getAllByText("Obehandlad").length).toBeGreaterThanOrEqual(1);
  });

  // Verifierar att tillbaka-knappen navigerar till ansökningslistan.
  it("borde navigera tillbaka vid klick på tillbaka-knappen", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);
    const backBtn = screen.getByText("Tillbaka till alla ansökningar");
    fireEvent.click(backBtn);

    expect(pushMock).toHaveBeenCalledWith("/applications");
  });

  // Verifierar att ett success-meddelande visas efter lyckad statusändring via onSuccess-callback.
  it("borde hantera callback onSuccess vid statusändring", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);

    // Hämta onSuccess callback från useMutation
    expect(useMutationMock).toHaveBeenCalled();
    const mutationOptions = useMutationMock.mock.calls[0]?.[0];
    expect(mutationOptions).toBeDefined();

    // Simulera att onSuccess anropas efter statusändring
    act(() => {
      mutationOptions.onSuccess({
        application_status: "accepted",
      });
    });

    expect(
      screen.getByText(/Status uppdaterad till "Godkänd"/),
    ).toBeInTheDocument();
  });

  // Verifierar att conflict-rutan visas vid samtidighetskonflikt (CONFLICT-error).
  it("borde hantera conflict error vid statusändring", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);

    const mutationOptions = useMutationMock.mock.calls[0]?.[0];
    expect(mutationOptions).toBeDefined();

    // Simulera CONFLICT error
    act(() => {
      mutationOptions.onError({
        data: { code: "CONFLICT" },
        message: "Ansökan har ändrats av en annan användare",
      });
    });

    expect(screen.getByText("Uppdateringen avbröts")).toBeInTheDocument();
    expect(
      screen.getByText("Ansökan har ändrats av en annan användare"),
    ).toBeInTheDocument();
  });

  // Verifierar att conflict-rutan INTE visas vid vanliga (icke-CONFLICT) fel.
  it("borde hantera icke-conflict error vid statusändring", () => {
    useQueryMock.mockReturnValue({
      data: mockApplication,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationDetail />);

    const mutationOptions = useMutationMock.mock.calls[0]?.[0];
    expect(mutationOptions).toBeDefined();

    // Simulera vanligt (icke-CONFLICT) fel
    act(() => {
      mutationOptions.onError({
        data: { code: "INTERNAL_SERVER_ERROR" },
        message: "Något gick fel",
      });
    });

    // Ska INTE visa conflict-rutan
    expect(screen.queryByText("Uppdateringen avbröts")).not.toBeInTheDocument();
  });
});
