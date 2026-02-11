"use client";

import Link from "next/link";
import { authClient } from "@/server/better-auth/client";
import { useRouter } from "next/navigation";

export const HeaderView = () => {
  const router = useRouter();

  const { data: session } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut()
    router.refresh();
    router.push("/");
  }

  return (
    // Main container
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left column Logo/Name */}
        <div className="flex items-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            Blå Lund Rekrytering
          </Link>
        </div>

        {/* Right Section: Navigation, Language, Auth, länk 2 och 3 för framtida behov.*/}
        <div className="flex items-center gap-6">
          {/* Main Navigation */}
          <nav>
            <ul className="flex items-center gap-6 text-sm font-medium">
              {/* Links */}
              <li>
                <Link
                  href="/"
                  className="text-gray-300 transition-colors hover:text-white"
                >
                  Hem
                </Link>
              </li>
              <li>
                <Link
                  href="/somewhere2"
                  className="text-gray-300 transition-colors hover:text-white"
                >
                  Länk2
                </Link>
              </li>
              <li>
                <Link
                  href="/somewhere3"
                  className="text-gray-300 transition-colors hover:text-white"
                >
                  Länk3
                </Link>
              </li>
            </ul>
          </nav>

          {/* Language Switcher - Relevant för Task 13, om vi bestämmer oss för att implementera det. */}
          <div className="flex items-center gap-2 border-l border-gray-700 pl-6 text-sm text-gray-400">
            <button className="font-medium text-white transition-colors hover:text-white">
              EN
            </button>
            <span>/</span>
            <button className="transition-colors hover:text-white">SV</button>
          </div>

          {/* Authentication - Task 5 */}
          <div>
            {session ? (
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                Logga ut
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Logga in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
