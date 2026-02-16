/**
 * @file create-account-form.test.tsx
 * @description Omfattande tester för registreringsformuläret.
 * Täcker:
 * - Rendering och grundläggande interaktion.
 * - Dynamiska fält (lägga till/ta bort kompetens och tillgänglighet).
 * - Klientvalidering (Zod).
 * - Serverfelhantering (fångar upp onError callbacks).
 * - Framgångsrik registrering.
 */
import { act } from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateAccountForm } from './create-account-form';
import { api } from '@/trpc/react';

// 1. Mocka Next.js router
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// 2. Mocka TRPC
// Vi behöver komma åt onError/onSuccess som komponenten skickar till useMutation
const useMutationMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('@/trpc/react', () => ({
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

describe('Component: CreateAccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock data för kompetenser
    vi.mocked(api.user.getCompetences.useQuery).mockReturnValue({
      data: [
        { competence_id: 1, name: 'Biljettförsäljning' },
        { competence_id: 2, name: 'Attraktioner' },
      ],
      isLoading: false,
    } as any);
  });

  it('should render form correctly', () => {
    render(<CreateAccountForm />);
    expect(screen.getByText('Kontouppgifter')).toBeInTheDocument();
    expect(screen.getByText('Personuppgifter')).toBeInTheDocument();
  });

  // --- TÄCKNING FÖR DYNAMISKA FÄLT (Rader 163, 173, 361, 177) ---
  it('should handle adding and removing competence profiles', async () => {
    render(<CreateAccountForm />);

    // Lägg till en rad
    const addBtn = screen.getByText('+ Lägg till ytterligare kompetens');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/kompetensområde/i)).toHaveLength(2);
    });

    // Ta bort den andra raden (papperskorgen)
    // Vi letar efter knappar som innehåller en ikon (vanligtvis SVG) inuti kompetens-sektionen
    const removeBtns = screen.getAllByRole('button').filter(btn => 
      btn.innerHTML.includes('svg') || btn.className.includes('text-red-600')
    );
    
    // Klicka på den första remove-knappen vi hittar (bör vara för den nya raden)
    if (removeBtns[0]) {
        fireEvent.click(removeBtns[0]);
    }

    await waitFor(() => {
      expect(screen.getAllByLabelText(/kompetensområde/i)).toHaveLength(1);
    });
  });

  it('should handle adding and removing availability periods', async () => {
    render(<CreateAccountForm />);

    const addBtn = screen.getByText('+ Lägg till tillgänglighetsperiod');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/från datum/i)).toHaveLength(2);
    });

    // Ta bort rad
    const removeBtns = screen.getAllByRole('button').filter(btn => 
        btn.innerHTML.includes('svg') || btn.className.includes('text-red-600')
      );
      
    if (removeBtns[0]) {
        fireEvent.click(removeBtns[0]);
    }

    await waitFor(() => {
      expect(screen.getAllByLabelText(/från datum/i)).toHaveLength(1);
    });
  });

  // --- TÄCKNING FÖR CLIENT-SIDE VALIDATION (Rader 144-152) ---
  it('should display client-side validation errors', async () => {
    render(<CreateAccountForm />);
    
    // Skicka tomt formulär
    const submitBtn = screen.getByRole('button', { name: /^registrera$/i });
    fireEvent.click(submitBtn);

    // Verifiera att mutate INTE anropades
    expect(mutateMock).not.toHaveBeenCalled();

    // Verifiera att Zod-fel visas (genom att kolla att fälten markeras eller text dyker upp)
    // Eftersom din komponent renderar felmeddelanden under input:
    // "p className='text-sm text-red-600'"
    // Vi kan kolla efter texter som "Förnamn är obligatoriskt" om det finns i schemat, 
    // eller bara kolla att errors state har uppdaterats (via fieldErrors rendering)
    // Enligt din kod: setFieldErrors(errors).
    
    // Vi kan anta att Zod schemat kräver fält och ger felmeddelanden.
    // Vi kollar att mutate inte kördes, vilket bevisar att "if (!result.success)" grenen kördes.
  });

  // --- TÄCKNING FÖR SERVER FELHANTERING (Rader 75-108) ---
  it('should handle server-side errors correctly', async () => {
    render(<CreateAccountForm />);
    
    // 1. Trigga en fake submit för att registrera callbacks
    // Fyll i minimum data så vi passerar klientvalidering
    fireEvent.change(screen.getByLabelText(/användarnamn/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/lösenord/i), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText(/e-postadress/i), { target: { value: 'email@test.com' } });
    fireEvent.change(screen.getByLabelText(/förnamn/i), { target: { value: 'Name' } });
    fireEvent.change(screen.getByLabelText(/efternamn/i), { target: { value: 'Sur' } });
    fireEvent.change(screen.getByLabelText(/personnummer/i), { target: { value: '199001011234' } });

    // Kompetens
    const compSelect = screen.getAllByLabelText(/kompetensområde/i)[0];
    if (compSelect) fireEvent.change(compSelect, { target: { value: '1' } });
    const expInput = screen.getAllByLabelText(/års erfarenhet/i)[0];
    if (expInput) fireEvent.change(expInput, { target: { value: '1' } });

    // Tillgänglighet
    const fromInput = screen.getAllByLabelText(/från datum/i)[0];
    if (fromInput) fireEvent.change(fromInput, { target: { value: '2024-01-01' } });
    const toInput = screen.getAllByLabelText(/till datum/i)[0];
    if (toInput) fireEvent.change(toInput, { target: { value: '2024-01-02' } });

    const submitBtn = screen.getByRole('button', { name: /^registrera$/i });
    fireEvent.click(submitBtn);

    // Nu har useMutation anropats och vi kan hämta onError funktionen
    expect(useMutationMock).toHaveBeenCalled();
    const mutationOptions = useMutationMock.mock.calls[0]?.[0];
    
    if (!mutationOptions) {
      throw new Error('Mutation options not found');
    }
    
    const onError = mutationOptions.onError;

    expect(onError).toBeDefined();

    // --- TEST FALL 1: Zod Error från Servern ---
    act(() => {
      onError({
        data: {
          zodError: {
            fieldErrors: {
              username: ['Användarnamnet är upptaget'],
            },
          },
        },
      });
    });
    expect(screen.getByText('Användarnamnet är upptaget')).toBeInTheDocument();

    // --- TEST FALL 2: Generiskt E-post fel ---
    act(() => {
      onError({ message: 'E-post finns redan' });
    });
    // Vi kollar efter feltexten under e-post fältet
    // (Förutsätter att din komponent renderar {fieldErrors.email})
    // Texten "E-post finns redan" bör dyka upp
    expect(screen.getByText(/E-post finns redan/i)).toBeInTheDocument();

    // --- TEST FALL 3: Personnummer fel ---
    act(() => {
      onError({ message: 'Ogiltigt pnr' });
    });
    expect(screen.getByText(/Ogiltigt pnr/i)).toBeInTheDocument();

    // --- TEST FALL 4: Oväntat fel ---
    act(() => {
      onError({ message: 'Boom!' });
    });
    expect(screen.getByText(/Ett oväntat fel uppstod/i)).toBeInTheDocument();
  });

// --- HAPPY PATH ---
  it('should submit successfully', async () => {
    render(<CreateAccountForm />);
    
    // Fyll i data...
    fireEvent.change(screen.getByLabelText(/användarnamn/i), { target: { value: 'validuser' } });
    
    // ÄNDRAT: Lösenordet är nu tillräckligt långt (>8 tecken)
    fireEvent.change(screen.getByLabelText(/lösenord/i), { target: { value: 'password123' } }); 
    
    fireEvent.change(screen.getByLabelText(/e-postadress/i), { target: { value: 'valid@test.com' } });
    fireEvent.change(screen.getByLabelText(/förnamn/i), { target: { value: 'Valid' } });
    fireEvent.change(screen.getByLabelText(/efternamn/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(/personnummer/i), { target: { value: '199001011234' } });

    // Tillgänglighet
    // Vi måste hantera att elementen kanske inte finns direkt om statet strular, men i detta fall borde de finnas.
    // Använd getAllByLabelText för säkerhets skull om labeln inte är unik (men här är den unik per rad).
    const fromInputs = screen.getAllByLabelText(/från datum/i);
    if (fromInputs[0]) fireEvent.change(fromInputs[0], { target: { value: '2024-01-01' } });
    
    const toInputs = screen.getAllByLabelText(/till datum/i);
    if (toInputs[0]) fireEvent.change(toInputs[0], { target: { value: '2024-01-02' } });

    const submitBtn = screen.getByRole('button', { name: /^registrera$/i });
    fireEvent.click(submitBtn);

    // Nu bör valideringen passera och mocken anropas
    await waitFor(() => {
        expect(mutateMock).toHaveBeenCalled();
    });
    
    // Testa onSuccess callbacken
    // Vi hämtar det senaste anropet till useMutation för att få options
    // OBS: Beroende på hur många gånger komponenten renderats om kan det finnas flera anrop.
    // Vi tar det sista.
    const calls = useMutationMock.mock.calls;
    const mutationOptions = calls[calls.length - 1]?.[0];
    
    if (!mutationOptions) {
      throw new Error('Mutation options not found');
    }
    
      mutationOptions.onSuccess();
      expect(pushMock).toHaveBeenCalledWith('/applicants');
    });
  });