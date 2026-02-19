/**
 * Tester för registreringsformuläret.
 * 
 * Täcker:
 * - Rendering och grundläggande interaktion.
 * - Dynamiska fält (lägga till/ta bort kompetens och tillgänglighet).
 * - Klientvalidering (Zod).
 * - Serverfelhantering (fångar upp onError callbacks).
 * - Lyckad registrering.
 * 
 * Integration layer test.
 */

import { act } from "react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateAccountForm } from "./create-account-form";
import { api } from "@/trpc/react";

// Mocka Next.js router. Kontrollerar att routern försöker byta sida.
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mocka TRPC
// Behöver komma åt onError/onSuccess som komponenten skickar till useMutation.
const useMutationMock = vi.fn();

// Ersätter den funktionen som faktiskt skickar datan till servern.
const mutateMock = vi.fn();

vi.mock("@/trpc/react", () => ({
  api: {
    user: {
      getCompetences: {
        useQuery: vi.fn(),
      },
      createAccount: {
        useMutation: vi.fn((options) => {
          useMutationMock(options); // Fånga options (onSuccess, onError)
          return {
            mutate: mutateMock,
            isPending: false,
          };
        }),
      },
    },
  },
}));

describe("create-account-form", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock data för dropdown meny.
    vi.mocked(api.user.getCompetences.useQuery).mockReturnValue({
      data: [
        { competence_id: 1, name: "Biljettförsäljning" },
        { competence_id: 2, name: "Attraktioner" },
      ],
      isLoading: false,
    } as any);
  });

  // Verifierar att formulärets rubriker och sektioner renderas korrekt.
  it("borde rendera formuläret korrekt", () => {
    render(<CreateAccountForm />);
    expect(screen.getByText("Kontouppgifter")).toBeInTheDocument();
    expect(screen.getByText("Personuppgifter")).toBeInTheDocument();
  });

  // --- TESTAR DYNAMISKA FÄLT I FORMULÄRET ---
  // Verifierar att en kompetensrad kan läggas till och tas bort dynamiskt.
  it("borde hantera att lägga till och ta bort kompetens", async () => {
    render(<CreateAccountForm />);

    // Lägg till en rad
    const addBtn = screen.getByText("+ Lägg till ytterligare kompetens");
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/kompetensområde/i)).toHaveLength(2);
    });

    // Ta bort den andra raden (papperskorgsknapp)
    // Vi letar efter knappar som innehåller en ikon inuti kompetens sektionen.
    const removeBtns = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.innerHTML.includes("svg") ||
          btn.className.includes("text-red-600"),
      );

    // Klicka på den första remove knappen vi hittar (bör vara för den nya raden på sidan)
    if (removeBtns[0]) {
      fireEvent.click(removeBtns[0]);
    }

    await waitFor(() => {
      expect(screen.getAllByLabelText(/kompetensområde/i)).toHaveLength(1);
    });
  });

  // Verifierar att en tillgänglighetsperiod kan läggas till och tas bort dynamiskt.
  it("borde hantera lägga till och ta bort tillgänliga perioder", async () => {
    render(<CreateAccountForm />);

    const addBtn = screen.getByText("+ Lägg till tillgänglighetsperiod");
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/från datum/i)).toHaveLength(2);
    });

    // Ta bort rad för tillgänglighets period
    const removeBtns = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.innerHTML.includes("svg") ||
          btn.className.includes("text-red-600"),
      );

    if (removeBtns[0]) {
      fireEvent.click(removeBtns[0]);
    }

    await waitFor(() => {
      expect(screen.getAllByLabelText(/från datum/i)).toHaveLength(1);
    });
  });

  // --- TESTAR CLIENT SIDE VALIDATION ---
  // Verifierar att mutate INTE anropas när formuläret skickas tomt (Zod-validering).
  it("borde visa client side validation errors", async () => {
    render(<CreateAccountForm />);

    // Skicka tomt formulär
    const submitBtn = screen.getByRole("button", { name: /^registrera$/i });
    fireEvent.click(submitBtn);

    // Verifiera att mutate INTE anropades.
    expect(mutateMock).not.toHaveBeenCalled();
  });

  // --- TEST FÖR SERVER FELHANTERING ---
  // Verifierar att onError-callbacken hanterar Zod-fel, e-post-/pnr-dubbletter och okända serverfel.
  it("borde hantera server side errors korrekt", async () => {
    render(<CreateAccountForm />);

    // Provocera fram onError för fel antal tecken på pw.
    // Först mocka ett tillräckligt formulär för att registrera callbacks efter submit.
    // Fyll i minimum data så vi passerar klientvalidering.
    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "pass123" },
    });
    fireEvent.change(screen.getByLabelText(/e-postadress/i), {
      target: { value: "email@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/förnamn/i), {
      target: { value: "Name" },
    });
    fireEvent.change(screen.getByLabelText(/efternamn/i), {
      target: { value: "Sur" },
    });
    fireEvent.change(screen.getByLabelText(/personnummer/i), {
      target: { value: "199001011234" },
    });

    // Kompetens
    const compSelect = screen.getAllByLabelText(/kompetensområde/i)[0];
    if (compSelect) fireEvent.change(compSelect, { target: { value: "1" } });
    const expInput = screen.getAllByLabelText(/års erfarenhet/i)[0];
    if (expInput) fireEvent.change(expInput, { target: { value: "1" } });

    // Tillgänglighet
    const fromInput = screen.getAllByLabelText(/från datum/i)[0];
    if (fromInput)
      fireEvent.change(fromInput, { target: { value: "2024-01-01" } });
    const toInput = screen.getAllByLabelText(/till datum/i)[0];
    if (toInput) fireEvent.change(toInput, { target: { value: "2024-01-02" } });

    const submitBtn = screen.getByRole("button", { name: /^registrera$/i });
    fireEvent.click(submitBtn);

    // Nu har useMutation anropats och vi kan hämta onError funktionen
    expect(useMutationMock).toHaveBeenCalled();
    const mutationOptions = useMutationMock.mock.calls[0]?.[0];

    if (!mutationOptions) {
      throw new Error("Mutation options not found");
    }

    const onError = mutationOptions.onError;

    expect(onError).toBeDefined();

    // --- TEST FALL 1: Zod Error från Servern ---
    act(() => {
      onError({
        data: {
          zodError: {
            fieldErrors: {
              username: ["Användarnamnet är upptaget"],
            },
          },
        },
      });
    });
    expect(screen.getByText("Användarnamnet är upptaget")).toBeInTheDocument();

    // --- TEST FALL 2: Upptaget E-postaddress fel ---
    act(() => {
      onError({ message: "E-post finns redan" });
    });
    // Vi kollar efter feltexten under e-post fältet
    // Texten "E-post finns redan" bör dyka upp
    expect(screen.getByText(/E-post finns redan/i)).toBeInTheDocument();

    // --- TEST FALL 3: Personnummer fel ---
    act(() => {
      onError({ message: "pnr finns redan" });
    });
    expect(screen.getByText(/pnr finns redan/i)).toBeInTheDocument();

    // --- TEST FALL 4: Oväntat fel, frontend känner inte igen "Boom!" ---
    act(() => {
      onError({ message: "Boom!" });
    });
    expect(screen.getByText(/Ett oväntat fel uppstod/i)).toBeInTheDocument();
  });

  // --- TEST FÖR ALLT RÄTT I REGI ---
  // Verifierar att mutate anropas med korrekt data och att onSuccess navigerar till /applicants.
  it("should submit successfully", async () => {
    render(<CreateAccountForm />);

    // Fyll i data...
    fireEvent.change(screen.getByLabelText(/användarnamn/i), {
      target: { value: "validuser" },
    });

    // Lösenordet är tillräckligt långt (>8 tecken)
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: "password123" },
    });

    fireEvent.change(screen.getByLabelText(/e-postadress/i), {
      target: { value: "valid@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/förnamn/i), {
      target: { value: "Valid" },
    });
    fireEvent.change(screen.getByLabelText(/efternamn/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/personnummer/i), {
      target: { value: "199001011234" },
    });

    // Tillgänglighet
    const fromInputs = screen.getAllByLabelText(/från datum/i);
    if (fromInputs[0])
      fireEvent.change(fromInputs[0], { target: { value: "2024-01-01" } });

    const toInputs = screen.getAllByLabelText(/till datum/i);
    if (toInputs[0])
      fireEvent.change(toInputs[0], { target: { value: "2024-01-02" } });

    const submitBtn = screen.getByRole("button", { name: /^registrera$/i });
    fireEvent.click(submitBtn);

    // Nu bör valideringen passera och mocken anropas
    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
    });

    // Testa onSuccess callbacken, alltså sidan man kommer till om ansökan gick igenom.
    // Vi hämtar det senaste anropet till useMutation för att få options.
    const calls = useMutationMock.mock.calls;
    const mutationOptions = calls[calls.length - 1]?.[0];

    if (!mutationOptions) {
      throw new Error("Mutation options hittades inte");
    }

    mutationOptions.onSuccess();
    expect(pushMock).toHaveBeenCalledWith("/applicants");
  });
});
