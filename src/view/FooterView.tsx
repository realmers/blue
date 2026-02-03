import Link from "next/link";

export const FooterView = () => {

  return (
    // Footer container
    <footer className="w-full border-t border-gray-800 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Grid layout: 1 kolumn på mobil, 3 kolumner på större skärmar */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Kolumn 1: Namn / Info. Bör en Footer innehålla. */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80">
              GreenGrove Recruitment
            </Link>
            <p className="text-sm text-gray-400">
              Connecting top talent KTH students with flipping fries stations at McDonalds.
            </p>
          </div>

          {/* Kolumn 2: För Sökande (Relevant för Task 5) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-200">
              For Candidates
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/register" className="hover:text-white transition-colors">Register Account</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link>
              </li>
            </ul>
          </div>

          {/* Kolumn 3: Om vi ska göra Task 28 och 30 kan detta vara nödvändiga länkar. Plus det ser snyggt ut. */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-200">
              Support & Legal
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-white transition-colors">System Status</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright-sektion längst ner, vet ej om det är nödvändigt. */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <p className="text-xs text-gray-500">
            &copy; 2026 GreenGrove Recruitment. IV1201 Project. All rights hopefully reserved.
          </p>
        </div>
        
      </div>
    </footer>
  );
};