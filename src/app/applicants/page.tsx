import { redirect } from "next/navigation";
import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AvailabilityModal } from "./availability-modal";

/** Applicant landing page shown after successful account creation/login. */
export default async function ApplicantsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  let roleName: string | undefined;

  if ("role_id" in user && typeof user.role_id === "number") {
    const role = await db.role.findUnique({
      where: { role_id: user.role_id },
      select: { name: true },
    });
    roleName = role?.name ?? undefined;
  }

  if (roleName !== "applicant") {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Tack för din ansökan!
          </CardTitle>
          <CardDescription className="text-base text-slate-600 mt-2">
            Din registrering har mottagits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Vi har tagit emot dina uppgifter och kommer att kontakta dig så snart 
            vi har lediga tjänster som matchar din profil.
          </p>
          <div className="pt-2">
            <AvailabilityModal />
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Link href="/">
            <Button variant="secondary">
              Tillbaka till startsidan
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
