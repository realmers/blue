import Link from "next/link";

export const FooterView = () => {
  return (
    /*  Footer container */
    <footer className="w-full border-t border-gray-800 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 1 kolumn på mobil, 3 kolumner på större skärmar, bra att ha men inte nödvändigt */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Column 1: Varumärke / Info */}
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-white hover:opacity-80"
            >
              Blå Lund Rekrytering
            </Link>
            <p className="text-sm text-gray-400">
              Sök Stockholms roligaste sommarjobb nu.
            </p>

            <p className="text-sm text-gray-400">
              Som KTH student, med minium 4 års slutförda studier, passar du
              perfekt vid fritösen stationen, i en av våra fantastiska hamburger
              kiosker.
            </p>
          </div>

          {/* Column 2: För Sökande (Relevant för Task 5) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-200 uppercase">
              För Sökande
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/register"
                  className="transition-colors hover:text-white"
                >
                  Registrera konto
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="transition-colors hover:text-white"
                >
                  Logga in
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Legal (Relevant länkar för Task 28 och 30 om vi tänker använda det) */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-200 uppercase">
              Support & Juridik
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-white"
                >
                  Kontakta support
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-white"
                >
                  Integritetspolicy
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="transition-colors hover:text-white"
                >
                  Systemstatus
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright section */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <p className="text-xs text-gray-500">
            &copy; 2026 Blå Lund Rekrytering. IV1201-projekt. Alla rättigheter
            är förhoppningsvis reserverade.
          </p>
        </div>
      </div>
    </footer>
  );
};
