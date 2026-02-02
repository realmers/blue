import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function ApplicantsPage() {
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
        <CardContent>
          <p className="text-slate-600">
            Vi har tagit emot dina uppgifter och kommer att kontakta dig så snart 
            vi har lediga tjänster som matchar din profil.
          </p>
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
