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

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authClient.signIn.username({ username, password });
      if (res?.error) {
        setError(res.error.message ?? "Sign in failed");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error");
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
              Sign in
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your recruitment dashboard
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={onSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="jdoe123"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                  {error}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 mt-4">
              <Button 
                type="submit" 
                className="w-full bg-black text-white hover:bg-slate-800" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              
              <div className="text-center text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/auth/sign-up" 
                  className="font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700"
                >
                  Create account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}