import Link from 'next/link';
import { Home, Calculator, MessageCircle, Sparkles } from 'lucide-react';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

/**
 * LA PAGINA DE "NO ENCONTRADO"
 *
 * Antes era un callejon sin salida: decia 404 y ofrecia volver al inicio. El que
 * llega aca casi siempre venia de Google o de un enlace viejo, y **si lo unico
 * que puede hacer es volver al inicio, se va.**
 *
 * Ahora ofrece las tres puertas que sirven de verdad: armar el presupuesto,
 * mirar lo que hacemos, o escribir por WhatsApp. Una pagina de error tambien
 * vende.
 */

// El numero sale de la unica fuente que hay. Escribirlo a mano aca fue un error
// que se detecto antes de subir: un numero inventado en una pagina publica manda
// al cliente a la nada.
const WHATSAPP =
  `https://wa.me/${AK_WHATSAPP_NUMBER}?text=` +
  encodeURIComponent('Hola AK Producciones! Entre a la web y queria consultarles.');

const SALIDAS = [
  {
    href: '/simulador-de-presupuesto',
    icono: Calculator,
    titulo: 'Armar mi presupuesto',
    detalle: 'En un minuto y sin compromiso',
  },
  {
    href: '/catalogo',
    icono: Sparkles,
    titulo: 'Ver lo que hacemos',
    detalle: 'Fiestas, decoracion y entretenimiento',
  },
  {
    href: '/',
    icono: Home,
    titulo: 'Ir al inicio',
    detalle: 'Empezar de nuevo',
  },
];

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-16">
      <p className="font-headline text-6xl font-black tracking-tighter text-slate-200">404</p>
      <h1 className="mt-2 font-headline text-3xl font-black tracking-tight text-slate-900">
        Esta pagina no existe
      </h1>
      <p className="mt-3 text-slate-600">
        Puede que el enlace sea viejo o que la hayamos movido. No te vayas con las manos
        vacias: por aca se llega a lo que buscabas.
      </p>

      <div className="mt-8 space-y-3">
        {SALIDAS.map(({ href, icono: Icono, titulo, detalle }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-900 hover:shadow-md"
          >
            <span className="rounded-xl bg-slate-100 p-3">
              <Icono className="h-5 w-5 text-slate-900" />
            </span>
            <span>
              <span className="block font-bold text-slate-900">{titulo}</span>
              <span className="block text-sm text-slate-500">{detalle}</span>
            </span>
          </Link>
        ))}
      </div>

      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white transition hover:bg-emerald-700"
      >
        <MessageCircle className="h-4 w-4" />
        Escribinos por WhatsApp
      </a>
    </main>
  );
}
