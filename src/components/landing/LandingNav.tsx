"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Servicios", href: "#landing-services", external: false },
  { label: "Club Uruguay", href: "/club-uruguay", external: true },
  { label: "Galería", href: "#landing-instagram", external: false },
  { label: "Blog", href: "/public/blog", external: true },
] as const;

interface LandingNavProps {
  whatsappNumber?: string;
}

export function LandingNav(_props: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkClass = cn(
    "px-3 py-2 text-sm font-bold transition-colors",
    isScrolled
      ? "text-zinc-600 hover:text-red-700"
      : "text-white/88 hover:text-white",
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-slate-200 bg-white/95 shadow-md backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <CompanyLogo size="sm" />
            <span
              className={cn(
                "hidden font-headline text-lg font-black transition-colors sm:block",
                isScrolled ? "text-zinc-950" : "text-white drop-shadow",
              )}
            >
              AK Producciones
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className={cn(
                "hidden rounded-md border px-4 py-2 text-xs font-bold transition-colors md:block",
                isScrolled
                  ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "border-white/20 text-white hover:bg-white/10",
              )}
            >
              Acceso Staff
            </Link>
            <Link
              href="/simulador-de-presupuesto"
              className="hidden rounded-md bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-red-800 sm:block"
            >
              Cotizá tu fiesta
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className={cn(
                "rounded-md p-2 transition-colors lg:hidden",
                isScrolled
                  ? "text-zinc-800 hover:bg-slate-100"
                  : "text-white hover:bg-white/10",
              )}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-b border-slate-200 bg-white shadow-xl lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-slate-100 hover:text-red-700"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-md px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-slate-100 hover:text-red-700"
                >
                  {link.label}
                </a>
              ),
            )}
            <Link
              href="/simulador-de-presupuesto"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 flex items-center justify-center rounded-md bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800"
            >
              Cotizá tu fiesta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
