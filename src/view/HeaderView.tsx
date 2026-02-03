import Link from "next/link";

export const HeaderView = () => {
  // För Marcus. Dessa variabler för inloggningsstatus för Task 5 och 6.
  const isLoggedIn = false; 
  const userRole = "recruiter";

  return (
    // Main container for Header
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Secation: Link Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            GreenGrove Recruitment
          </Link>
        </div>

        {/* Right Serction: Navigation, Language, Auth */}
        <div className="flex items-center gap-6">
          
          {/* Main Navigation, vet inte vad vi ska ha somwhere 2 och 3 till än men de finns vid behov, annars ta bort. */}
          <nav>
            <ul className="flex items-center gap-6 text-sm font-medium">
              {/* Links */}
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/somewhere2" className="text-gray-300 hover:text-white transition-colors">
                  Somewhere2
                </Link>
              </li>
              <li>
                <Link href="/somewhere3" className="text-gray-300 hover:text-white transition-colors">
                  Somewhere3
                </Link>
              </li>
            </ul>
          </nav>

          {/* Language Switcher - Relevant för Task 13, om vi ska implementera det */}
          <div className="flex items-center gap-2 text-sm text-gray-400 border-l border-gray-700 pl-6">
            <button className="hover:text-white transition-colors font-medium text-white">EN</button>
            <span>/</span>
            <button className="hover:text-white transition-colors">SV</button>
          </div>

          {/* Authentication - Relevant för Task 5 */}
          <div>
            {isLoggedIn ? (
              <button className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
                Log out
              </button>
            ) : (
              <Link href="/login" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors">
                Log in
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};