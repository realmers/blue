import Link from "next/link";

export const FooterView = () => {
  const currentYear = new Date().getFullYear();

  return (
    // Footer container: Svart bakgrund, grå topp-border
    <footer className="w-full border-t border-gray-800 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Grid-layout: 1 kolumn på mobil, 3 kolumner på större skärmar */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Kolumn 1: Varumärke / Info */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80">
              Blå Lund Rekrytering
            </Link>
            <p className="text-sm text-gray-400">
              Sök Stockholms roligaste sommarjobb nu.
            </p>
          </div>

          {/* Kolumn 2: För Sökande (Relevant för Use Case 5.x) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-200">
              För Sökande
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/register" className="hover:text-white transition-colors">Registrera konto</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Logga in</Link>
              </li>
            </ul>
          </div>

          {/* Kolumn 3: Support & Legal (Relevant för Task 28 & 30) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-200">
              Support & Juridik
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Kontakta support</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Integritetspolicy</Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-white transition-colors">Systemstatus</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright-sektion längst ner */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} Blå Lund Rekrytering. IV1201-projekt. Alla rättigheter förhoppningsvis reserverade :)
          </p>
        </div>
        
      </div>
    </footer>
  );
};