import Link from "next/link";

export const HeaderView = () => {
  // Dessa variabler simulerar inloggningsstatus för att uppfylla Task 5 och 6.
  // I en riktig app hämtar du detta från din GlobalContext/State.
  const isLoggedIn = false; 
  const userRole = "recruiter"; // Kan vara 'recruiter' eller 'applicant'

  return (
    // Main container
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Link Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            Blå Lund Rekrytering
          </Link>
        </div>

        {/* Right Section: Navigation, Language, Auth */}
        <div className="flex items-center gap-6">
          
          {/* Main Navigation */}
          <nav>
            <ul className="flex items-center gap-6 text-sm font-medium">
              {/* Links */}
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Hem
                </Link>
              </li>
              <li>
                <Link href="/somewhere2" className="text-gray-300 hover:text-white transition-colors">
                  Länk2
                </Link>
              </li>
              <li>
                <Link href="/somewhere3" className="text-gray-300 hover:text-white transition-colors">
                  Länk3
                </Link>
              </li>
            </ul>
          </nav>

          {/* Language Switcher - Required for Task 13  */}
          <div className="flex items-center gap-2 text-sm text-gray-400 border-l border-gray-700 pl-6">
            <button className="hover:text-white transition-colors font-medium text-white">EN</button>
            <span>/</span>
            <button className="hover:text-white transition-colors">SV</button>
          </div>

          {/* Authentication - Required for Task 5  */}
          <div>
            {isLoggedIn ? (
              <button className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
                Logga ut
              </button>
            ) : (
              <Link href="/login" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors">
                Logga in
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};