import { getSession } from "@/server/better-auth/server";
import { HydrateClient } from "@/trpc/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default async function Home() {
  const session = await getSession();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center bg-white text-slate-900">
        <div className="container flex flex-1 flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 mb-6">
              Recruitment System
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Welcome to the official recruitment portal for the upcoming season.
              Manage your applications or join our team to create unforgettable experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 w-full max-w-4xl">
            {/* Applicants Card */}
            <Card className="flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300">
              <CardHeader>
                <CardTitle className="text-xl">Applicants</CardTitle>
                <CardDescription>
                  Looking for a job? Register your profile, set your availability, and apply today.
                </CardDescription>
              </CardHeader>
              {!session && (
                <CardFooter>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/auth/sign-up">
                      Create Account →
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Recruiters Card */}
            <Card className="flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300">
              <CardHeader>
                <CardTitle className="text-xl">Recruiters</CardTitle>
                <CardDescription>
                  Log in to manage applications, review candidates, and select staff.
                </CardDescription>
              </CardHeader>
              {!session && (
                <CardFooter>
                  <Button asChild className="w-full sm:w-auto bg-black text-white hover:bg-slate-800">
                    <Link href="/auth/sign-in">
                      Log In as Recruiter
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8">
            {session ? (
              <div className="text-center space-y-4">
                <p className="text-slate-600">Welcome back, <span className="font-semibold text-slate-900">{session.user.name}</span>.</p>
                <Button asChild size="lg" className="px-8">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Label className="text-slate-500 font-normal cursor-pointer">
                  Existing user?
                </Label>
                <Button asChild variant="link" className="px-0">
                  <Link href="/auth/sign-in">Sign in to your account</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
