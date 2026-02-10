"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAccountSchema, type CompetenceProfile, type AvailabilityPeriod } from "@/lib/validation/account-schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CalendarIcon, UserIcon, BriefcaseIcon, LockIcon, Trash2Icon, Loader2Icon } from "lucide-react";

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`flex h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" className="h-4 w-4">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}

interface CreateAccountFormProps {
  defaultEmail?: string;
  defaultName?: string;
  defaultSurname?: string;
}

export function CreateAccountForm({ defaultEmail, defaultName, defaultSurname }: CreateAccountFormProps) {
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [name, setName] = useState(defaultName ?? "");
  const [surname, setSurname] = useState(defaultSurname ?? "");
  const [pnr, setPnr] = useState("");
  
  const [competenceProfiles, setCompetenceProfiles] = useState<CompetenceProfile[]>([
    { competence_id: 0, years_of_experience: 0 }
  ]);
  
  const [availabilityPeriods, setAvailabilityPeriods] = useState<AvailabilityPeriod[]>([
    { from_date: "", to_date: "" }
  ]);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: competences, isLoading: isLoadingCompetences } = api.user.getCompetences.useQuery();

  const createAccount = api.user.createAccount.useMutation({
    onSuccess: () => {
      router.push("/applicants");
    },
    onError: (err) => {
      // Check if it's a Zod validation error (fallback just in case)
      const zodError = err.data?.zodError;
      if (zodError?.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(zodError.fieldErrors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            errors[field] = messages[0] as string;
          }
        }
        setFieldErrors(errors);
        setError(null);
      } else {
        const message = err.message;
        if (message.includes("E-post") || message.includes("email")) {
          setFieldErrors({ email: message });
          setError(null);
        } else if (message.includes("Användarnamn") || message.includes("username")) {
          setFieldErrors({ username: message });
          setError(null);
        } else if (message.includes("Personnum") || message.includes("pnr")) {
          setFieldErrors({ pnr: message });
          setError(null);
        } else if (message.includes("Ett fel uppstod") || message.includes("Försök igen")) {
          // Server returned a user-friendly message
          setError(message);
          setFieldErrors({});
        } else {
          // Unknown error - show generic message
          console.error("Registration error:", err);
          setError("Ett oväntat fel uppstod. Försök igen senare.");
          setFieldErrors({});
        }
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Filter out empty competence profiles
    const validCompetenceProfiles = competenceProfiles.filter(
      (cp) => cp.competence_id > 0 && cp.years_of_experience >= 0
    );

    // Filter out empty availability periods
    const validAvailabilityPeriods = availabilityPeriods.filter(
      (ap) => ap.from_date && ap.to_date
    );

    const formData = {
      username,
      password,
      email,
      name,
      surname,
      pnr,
      competenceProfiles: validCompetenceProfiles.length > 0 ? validCompetenceProfiles : undefined,
      availabilityPeriods: validAvailabilityPeriods.length > 0 ? validAvailabilityPeriods : undefined,
    };

    // Client-side validation using Zod
    const result = createAccountSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field && typeof field === "string" && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    createAccount.mutate(result.data);
  };

  const addCompetenceProfile = () => {
    setCompetenceProfiles([...competenceProfiles, { competence_id: 0, years_of_experience: 0 }]);
  };

  const removeCompetenceProfile = (index: number) => {
    setCompetenceProfiles(competenceProfiles.filter((_, i) => i !== index));
  };

  const updateCompetenceProfile = (index: number, field: keyof CompetenceProfile, value: number) => {
    const updated = [...competenceProfiles];
    updated[index] = { ...updated[index]!, [field]: value };
    setCompetenceProfiles(updated);
  };

  const addAvailabilityPeriod = () => {
    setAvailabilityPeriods([...availabilityPeriods, { from_date: "", to_date: "" }]);
  };

  const removeAvailabilityPeriod = (index: number) => {
    setAvailabilityPeriods(availabilityPeriods.filter((_, i) => i !== index));
  };

  const updateAvailabilityPeriod = (index: number, field: keyof AvailabilityPeriod, value: string) => {
    const updated = [...availabilityPeriods];
    updated[index] = { ...updated[index]!, [field]: value };
    setAvailabilityPeriods(updated);
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockIcon className="size-5 text-blue-600" />
            Kontouppgifter
          </CardTitle>
          <CardDescription>
            Dina inloggningsuppgifter.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Användarnamn</Label>
            <Input 
              id="username" 
              name="username" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={createAccount.isPending}
            />
            {fieldErrors.username && (
              <p className="text-sm text-red-600">{fieldErrors.username}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="********" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={createAccount.isPending}
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">E-postadress</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={createAccount.isPending}
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5 text-blue-600" />
            Personuppgifter
          </CardTitle>
          <CardDescription>
            Vem är du?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Förnamn</Label>
            <Input 
              id="name" 
              name="name" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createAccount.isPending}
            />
            {fieldErrors.name && (
              <p className="text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">Efternamn</Label>
            <Input 
              id="surname" 
              name="surname" 
              required 
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              disabled={createAccount.isPending}
            />
            {fieldErrors.surname && (
              <p className="text-sm text-red-600">{fieldErrors.surname}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pnr">Personnummer</Label>
            <Input 
              id="pnr" 
              name="pnr" 
              placeholder="Exempel: 200610231234" 
              required 
              value={pnr}
              onChange={(e) => setPnr(e.target.value)}
              disabled={createAccount.isPending}
            />
            {fieldErrors.pnr && (
              <p className="text-sm text-red-600">{fieldErrors.pnr}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competence Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseIcon className="size-5 text-blue-600" />
            Kompetensprofil
          </CardTitle>
          <CardDescription>
            Berätta om dina färdigheter och erfarenheter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {competenceProfiles.map((profile, index) => (
            <div key={index} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] items-end border p-4 rounded-lg bg-slate-50/50">
              <div className="space-y-2">
                <Label htmlFor={`competence-${index}`}>Kompetensområde</Label>
                <Select 
                  id={`competence-${index}`}
                  value={profile.competence_id}
                  onChange={(e) => updateCompetenceProfile(index, "competence_id", Number(e.target.value))}
                  disabled={createAccount.isPending || isLoadingCompetences}
                >
                  <option value={0}>Välj en kompetens...</option>
                  {competences?.map((c) => (
                    <option key={c.competence_id} value={c.competence_id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`experience-${index}`}>Års erfarenhet</Label>
                <Input 
                  id={`experience-${index}`}
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="99.99"
                  placeholder="0.0"
                  value={profile.years_of_experience || ""}
                  onChange={(e) => updateCompetenceProfile(index, "years_of_experience", Number(e.target.value))}
                  disabled={createAccount.isPending}
                />
              </div>
              {competenceProfiles.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeCompetenceProfile(index)}
                  disabled={createAccount.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              )}
            </div>
          ))}
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full sm:w-auto" 
            size="sm"
            onClick={addCompetenceProfile}
            disabled={createAccount.isPending}
          >
            + Lägg till ytterligare kompetens
          </Button>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-blue-600" />
            Tillgänglighet
          </CardTitle>
          <CardDescription>
            När kan du arbeta?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availabilityPeriods.map((period, index) => (
            <div key={index} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] items-end border p-4 rounded-lg bg-slate-50/50">
              <div className="space-y-2">
                <Label htmlFor={`from_date-${index}`}>Från datum</Label>
                <Input 
                  id={`from_date-${index}`}
                  type="date"
                  value={period.from_date}
                  onChange={(e) => updateAvailabilityPeriod(index, "from_date", e.target.value)}
                  disabled={createAccount.isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`to_date-${index}`}>Till datum</Label>
                <Input 
                  id={`to_date-${index}`}
                  type="date"
                  value={period.to_date}
                  onChange={(e) => updateAvailabilityPeriod(index, "to_date", e.target.value)}
                  disabled={createAccount.isPending}
                  required
                />
              </div>
              {availabilityPeriods.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeAvailabilityPeriod(index)}
                  disabled={createAccount.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              )}
            </div>
          ))}
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full sm:w-auto" 
            size="sm"
            onClick={addAvailabilityPeriod}
            disabled={createAccount.isPending}
          >
            + Lägg till tillgänglighetsperiod
          </Button>
        </CardContent>
      </Card>

      <CardFooter className="flex justify-end pt-6">
        <Button 
          type="submit" 
          size="lg" 
          className="w-full sm:w-auto"
          disabled={createAccount.isPending}
        >
          {createAccount.isPending ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Registrerar...
            </>
          ) : (
            "Registrera"
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
