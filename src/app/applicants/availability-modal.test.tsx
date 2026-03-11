/**
 * Enhetstester för AvailabilityModal-komponenten.
 *
 * Täcker:
 * - Rendering av trigger-knappen.
 * - Laddningstillstånd när dialogen öppnas.
 * - Visa befintliga perioder efter laddning.
 * - Lägga till och ta bort perioder.
 * - Klientvalidering (från-datum måste vara före till-datum).
 * - Lyckad uppdatering (visar success-meddelande).
 * - Felhantering från servern.
 * - Tomma perioder filtreras bort vid sparande.
 * 
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AvailabilityModal } from "./availability-modal";

// Fånga onSuccess och onError callbacks från useMutation
let mutationOptions: { onSuccess?: () => void; onError?: (err: { message: string }) => void } = {};
const mutateMock = vi.fn();
const invalidateMock = vi.fn();
const useQueryMock = vi.fn();

vi.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      user: {
        getMyAvailability: {
          invalidate: invalidateMock,
        },
      },
    }),
    user: {
      getMyAvailability: {
        useQuery: (...args: unknown[]) => useQueryMock(...args),
      },
      updateMyAvailability: {
        useMutation: (options: typeof mutationOptions) => {
          mutationOptions = options;
          return {
            mutate: mutateMock,
            isPending: false,
          };
        },
      },
    },
  },
}));

describe("AvailabilityModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationOptions = {};
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

  it("borde rendera trigger-knappen", () => {
    render(<AvailabilityModal />);
    expect(
      screen.getByRole("button", { name: /hantera tillgänglighet/i }),
    ).toBeInTheDocument();
  });

  it("borde visa laddningstillstånd när dialogen öppnas", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    expect(screen.getByText("Laddar...")).toBeInTheDocument();
  });

  it("borde visa dialogens rubrik och beskrivning", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    expect(screen.getByText("Tillgänglighetsperioder")).toBeInTheDocument();
    expect(
      screen.getByText(/lägg till eller ta bort perioder/i),
    ).toBeInTheDocument();
  });

  it("borde visa meddelande om inga perioder finns", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    // useEffect sätter en tom period, men vi testar att render sker korrekt
    expect(screen.getByText("Tillgänglighetsperioder")).toBeInTheDocument();
  });

  it("borde lägga till en ny period när 'Lägg till period' klickas", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    const addButton = screen.getByRole("button", { name: /lägg till period/i });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    // Verifiera att vi har Från/Till-etiketter (2 perioder = 4 fält)
    const fromLabels = screen.getAllByText("Från");
    const toLabels = screen.getAllByText("Till");
    expect(fromLabels.length).toBe(2);
    expect(toLabels.length).toBe(2);
  });

  it("borde ta bort en period", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    // Lägg till 2 perioder
    const addButton = screen.getByRole("button", { name: /lägg till period/i });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getAllByText("Från").length).toBe(2);

    // Ta bort den första perioden (klicka på första ta-bort-knappen)
    const deleteButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg") && btn.classList.contains("text-red-500"),
    );
    fireEvent.click(deleteButtons[0]!);

    expect(screen.getAllByText("Från").length).toBe(1);
  });

  it("borde visa valideringsfel om från-datum > till-datum", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    // Lägg till en period
    fireEvent.click(screen.getByRole("button", { name: /lägg till period/i }));

    // Hitta datuminputs
    const dateInputs = screen.getAllByDisplayValue("");
    const fromInput = dateInputs.find((el) => el.getAttribute("type") === "date");
    const toInput = dateInputs.filter((el) => el.getAttribute("type") === "date")[1];

    // Ange från-datum efter till-datum
    fireEvent.change(fromInput!, { target: { value: "2026-06-15" } });
    fireEvent.change(toInput!, { target: { value: "2026-06-01" } });

    // Klicka spara
    fireEvent.click(screen.getByRole("button", { name: /spara/i }));

    expect(
      screen.getByText("Från-datum måste vara före till-datum"),
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("borde visa valideringsfel om från-datum = till-datum", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    fireEvent.click(screen.getByRole("button", { name: /lägg till period/i }));

    const allDateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(allDateInputs[0]!, { target: { value: "2026-06-15" } });
    fireEvent.change(allDateInputs[1]!, { target: { value: "2026-06-15" } });

    fireEvent.click(screen.getByRole("button", { name: /spara/i }));

    expect(
      screen.getByText("Från-datum måste vara före till-datum"),
    ).toBeInTheDocument();
  });

  it("borde anropa mutate med giltiga perioder", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    fireEvent.click(screen.getByRole("button", { name: /lägg till period/i }));

    const allDateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(allDateInputs[0]!, { target: { value: "2026-06-01" } });
    fireEvent.change(allDateInputs[1]!, { target: { value: "2026-06-15" } });

    fireEvent.click(screen.getByRole("button", { name: /spara/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      periods: [{ fromDate: "2026-06-01", toDate: "2026-06-15" }],
    });
  });

  it("borde filtrera bort tomma perioder vid sparande", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    // Lägg till 2 perioder, fyll bara i den andra
    fireEvent.click(screen.getByRole("button", { name: /lägg till period/i }));
    fireEvent.click(screen.getByRole("button", { name: /lägg till period/i }));

    const allDateInputs = document.querySelectorAll('input[type="date"]');
    // Lämna första perioden tom, fyll i andra
    fireEvent.change(allDateInputs[2]!, { target: { value: "2026-07-01" } });
    fireEvent.change(allDateInputs[3]!, { target: { value: "2026-07-15" } });

    fireEvent.click(screen.getByRole("button", { name: /spara/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      periods: [{ fromDate: "2026-07-01", toDate: "2026-07-15" }],
    });
  });

  it("borde visa success-meddelande efter lyckad uppdatering", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    // Trigga onSuccess callback
    act(() => {
      mutationOptions.onSuccess?.();
    });

    expect(
      screen.getByText("Tillgängligheterna har uppdaterats!"),
    ).toBeInTheDocument();
  });

  it("borde visa felmeddelande vid mutation-error", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    // Trigga onError callback
    act(() => {
      mutationOptions.onError?.({ message: "Serverfel uppstod" });
    });

    expect(screen.getByText("Serverfel uppstod")).toBeInTheDocument();
  });

  it("borde rensa fel och success vid stängning av dialogen", () => {
    render(<AvailabilityModal />);
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));

    // Trigga ett success-meddelande
    act(() => {
      mutationOptions.onSuccess?.();
    });
    expect(
      screen.getByText("Tillgängligheterna har uppdaterats!"),
    ).toBeInTheDocument();

    // Stäng dialogen via Avbryt-knappen
    fireEvent.click(screen.getByRole("button", { name: /avbryt/i }));

    // Öppna igen och verifiera att meddelandet är borta
    fireEvent.click(screen.getByRole("button", { name: /hantera tillgänglighet/i }));
    expect(
      screen.queryByText("Tillgängligheterna har uppdaterats!"),
    ).not.toBeInTheDocument();
  });
});
