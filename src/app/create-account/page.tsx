import { getSession } from "@/server/better-auth/server";
import { HydrateClient } from "@/trpc/server";
import { CreateAccountForm } from "./create-account-form";

export default async function CreateAccountPage() {
  const session = await getSession();

  // Extract default values from session
  const defaultEmail = session?.user.email ?? "";
  const nameParts = session?.user.name?.split(" ") ?? [];
  const defaultName = nameParts[0] ?? "";
  const defaultSurname = nameParts.slice(1).join(" ");

  return (
    <HydrateClient>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <main className="container mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Skapa konto
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Registrera dig nedan för att ansöka till lediga tjänster.
            </p>
          </div>

          <CreateAccountForm 
            defaultEmail={defaultEmail}
            defaultName={defaultName}
            defaultSurname={defaultSurname}
          />
        </main>
      </div>
    </HydrateClient>
  );
}
