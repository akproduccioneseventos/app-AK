import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, MessageCircle } from 'lucide-react';

/**
 * LA PAGINA DE PRIVACIDAD
 *
 * El dueño la pidió el 28 de agosto de 2026, con una condición: **que no moleste**.
 * Por eso es una página común, tranquila, a la que se llega desde el pie —no un
 * cartel que salta encima del visitante ni una ventana que hay que cerrar.
 *
 * Está escrita en criollo a propósito. Una política copiada de un modelo legal
 * inglés no la entiende nadie y no protege a nadie; esta dice, en el idioma en que
 * habla el dueño, exactamente qué pasa con los datos.
 *
 * **La línea que marcó él y que la página respeta:** la web pública muestra fotos
 * del servicio, como las redes. Lo que pasa con las fotos de los invitados en una
 * fiesta va por el contrato con quien la contrata, no por acá.
 */

export const metadata: Metadata = {
  title: 'Privacidad | AK Producciones',
  description:
    'Qué datos usa AK Producciones cuando visitás la web o pedís un presupuesto, y qué no hacemos con ellos.',
  alternates: { canonical: 'https://akproducciones.uy/privacidad' },
};

const ACTUALIZADA = '28 de agosto de 2026';

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">
        Privacidad
      </h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {ACTUALIZADA}</p>

      <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">Quiénes somos</h2>
          <p className="mt-2">
            AK Producciones organiza fiestas y eventos en Salto, Uruguay. Esta página explica
            qué pasa con tus datos cuando entrás a nuestra web o nos pedís un presupuesto.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Qué datos pedimos, y sólo cuando vos los das
          </h2>
          <p className="mt-2">
            Podés recorrer toda la web sin dejarnos ningún dato. Te pedimos algo únicamente
            si vos empezás una conversación con nosotros:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>
              <strong>Si armás un presupuesto:</strong> el tipo de fiesta, la fecha, cuánta
              gente y cómo te llamás, para poder pasarte un precio real.
            </li>
            <li>
              <strong>Si nos escribís:</strong> tu nombre y tu forma de contacto, para
              contestarte.
            </li>
          </ul>
          <p className="mt-3">
            No pedimos documento, ni datos de tarjeta en esta web, ni nada que no haga falta
            para hacerte un presupuesto.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">Para qué los usamos</h2>
          <p className="mt-2">
            Para contestarte, para armarte el presupuesto y para acordar el trabajo si nos
            contratás. Nada más.
          </p>
          <p className="mt-3">
            <strong>No vendemos ni prestamos tus datos a nadie.</strong> No los usamos para
            mandarte publicidad de otros.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Las visitas a la web
          </h2>
          <p className="mt-2">
            Usamos Google Analytics para saber cuánta gente entra y qué páginas mira. Eso
            usa cookies: archivitos que quedan en tu navegador. Sirven para contar visitas,
            no para saber quién sos.
          </p>
          <p className="mt-3">
            Si no las querés, se apagan desde la configuración de tu navegador, y la web
            sigue funcionando igual.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Las fotos que ves en la web
          </h2>
          <p className="mt-2">
            Las fotos y videos que publicamos son de nuestro trabajo: fiestas que hicimos,
            decoración, entretenimiento. Es lo mismo que mostramos en nuestras redes
            sociales.
          </p>
          <p className="mt-3">
            Lo que pasa con las fotos <em>de una fiesta concreta</em> —quién puede verlas,
            descargarlas o publicarlas— se acuerda con quien contrata esa fiesta, y va en el
            contrato de ese evento, no acá.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">Cuánto los guardamos</h2>
          <p className="mt-2">
            Los presupuestos y los contactos quedan guardados mientras haya una relación
            comercial con vos, y después por el tiempo que nos exige la contabilidad.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Si querés que borremos lo tuyo
          </h2>
          <p className="mt-2">
            Escribinos y lo borramos. También podés pedirnos que te digamos qué tenemos
            tuyo, o que lo corrijamos si está mal. No hace falta que expliques por qué.
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-slate-200 pt-8">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 font-bold text-white"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
        <Link
          href="/simulador-de-presupuesto"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-slate-900"
        >
          <MessageCircle className="h-4 w-4" />
          Armar mi presupuesto
        </Link>
      </div>
    </main>
  );
}
