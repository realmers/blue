"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [email, setEmail] = useState("");
  const [ismagicLinkSent, setMagicLinkSent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isloading, setLoading] = useState(false);

  async function onSubmitUsername(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.username({ username, password });
      if (res.error) {
        setError(res.error.message ?? "Inloggning misslyckades");
      } else {
        router.push("/");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ett oväntat fel inträffade";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.magicLink({ 
        email, 
        callbackURL: "/"
      });
      
      if (res.error) {
        setError(res.error.message ?? "Kunde inte skicka länk");
      } else {
        setMagicLinkSent(true);
        // check terminal for the link!
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ett oväntat fel inträffade";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-slate-900">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-center">
              Logga in
            </CardTitle>
            <CardDescription className="text-center">
              Välj metod för att logga in på ditt konto.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            
            {error && (
                <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-100 text-center">
                  {error}
                </div>
            )}

            {/* Magic link */}
            {!ismagicLinkSent ? (
              <form onSubmit={onSubmitMagicLink} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Logga in med E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="namn@finnsinte.se"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full bg-black text-white"
                  disabled={isloading}
                >
                  {isloading ? "Skickar..." : "Skicka inloggningslänk"}
                </Button>
              </form>
            ) : (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-green-800 font-semibold mb-2">Länk skickad!</h3>
                <p className="text-sm text-green-700">
                  Vi har skickat en inloggningslänk till <strong>{email}</strong>.
                  <br />
                </p>
                <Button 
                  variant="link" 
                  onClick={() => setMagicLinkSent(false)}
                  className="mt-2 text-green-800"
                >
                  Försök igen
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Eller med användarnamn & lösenord</span>
              </div>
            </div>

            <form onSubmit={onSubmitUsername} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Användarnamn</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full bg-black text-white"
                disabled={isloading}
              >
                Logga in
              </Button>
            </form>

          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-2">
            <div className="text-center text-sm text-slate-600">
              Har du inget konto?{" "}
              <Link
                href="/create-account"
                className="font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700"
              >
                Skapa konto
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}