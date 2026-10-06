import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, MessageCircle } from 'lucide-react';
import { getCompanyInfoPublica } from '@/app/actions/settings';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

/**
 * LA PAGINA DE PRIVACIDAD
 *
 * Regulada bajo la Ley 18.331 de Protección de Datos Personales de Uruguay.
 */

export const metadata: Metadata = {
  title: 'Privacidad | AK Producciones',
  description:
    'Qué datos usa AK Producciones cuando visitás la web o pedís un presupuesto, y qué no hacemos con ellos.',
  alternates: { canonical: 'https://akproducciones.uy/privacidad' },
};

const ACTUALIZADA = '1 de octubre de 2026';

export default async function PrivacidadPage() {
  const companyInfo = await getCompanyInfoPublica().catch(() => null);
  // Auditoría 74 (CONTACT74): `companyContact` a veces guarda un correo. Antes se mostraba como
  // número de WhatsApp. Sólo cuenta como teléfono lo que tiene cifras de teléfono; si no hay, va
  // el WhatsApp público de AK (`AK_WHATSAPP_NUMBER`).
  const pareceTelefono = (v: unknown): v is string =>
    typeof v === 'string' && !v.includes('@') && /^\+?[\d\s().-]+$/.test(v.trim()) && v.replace(/\D/g, '').length >= 8;
  const contacto = companyInfo?.companyContact;
  const telefono = [(companyInfo as any)?.telefono, contacto].find(pareceTelefono)
    || AK_WHATSAPP_NUMBER.replace(/^598(\d{2})(\d{3})(\d{3})$/, '0$1 $2 $3');
  const email = (companyInfo as any)?.email
    || (typeof contacto === 'string' && contacto.includes('@') ? contacto : 'contacto@akproducciones.uy');

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-headline text-4xl font-black tracking-tight text-slate-900">
        Privacidad y Protección de Datos
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
            Quién es responsable de tus datos
          </h2>
          <p className="mt-2">
            El responsable del tratamiento de los datos personales es <strong>AK Producciones Eventos</strong>,
            RUT <strong>22037268001</strong>, con domicilio en Salto, Uruguay.
          </p>
          <p className="mt-2">
            Podés contactarnos directamente por WhatsApp al <strong>{telefono}</strong> o
            por correo electrónico a <strong>{email}</strong>.
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
            contratás. Las conversaciones mantenidas a través del asistente del cliente en el
            portal quedan guardadas para que el equipo de AK te atienda mejor.
          </p>
          <p className="mt-3">
            <strong>No vendemos ni prestamos tus datos a nadie.</strong> No los usamos para
            mandarte publicidad de otros.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Si sos invitado de una fiesta
          </h2>
          <p className="mt-2">
            Tu nombre, si vas o no (RSVP), lo que elegís de menú y las fotos o mensajes que subís
            al muro o buzón se usan <strong>sólo para esa fiesta</strong>. Lo ve el equipo y quien
            la contrató. No se vende ni se usa para publicidad.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Si trabajás con nosotros
          </h2>
          <p className="mt-2">
            Si sos parte de nuestro personal o un proveedor contratado, tus datos de contacto y
            asistencia se usan exclusivamente para coordinar el trabajo en los eventos y realizar
            los pagos correspondientes.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Las visitas a la web
          </h2>
          <p className="mt-2">
            Usamos Google Analytics y el píxel de Meta (Facebook e Instagram) para conocer cuánta gente
            nos visita, qué páginas resultan de interés y medir el rendimiento de los anuncios publicitarios.
            Esto emplea cookies: pequeños archivos que quedan en tu navegador para estadísticas anónimas.
          </p>
          <p className="mt-3">
            Si preferís no utilizarlas, podés desactivarlas en la configuración de tu navegador y el sitio
            seguirá funcionando con total normalidad.
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
            comercial con vos, y después por el tiempo que nos exige la contabilidad y las normativas vigentes.
            Borramos los datos que no hacen falta una vez cumplidos los plazos legales.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-xl font-bold text-slate-900">
            Tus derechos
          </h2>
          <p className="mt-2">
            Conforme a la ley, podés ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, actualización, inclusión o supresión</strong> de tus datos personales escribiéndonos a nuestros medios de contacto. Contestamos <strong>dentro de los 5 días hábiles</strong>.
          </p>
          <p className="mt-3">
            Si considerás que tus derechos no fueron debidamente atendidos, podés presentar una denuncia ante la <strong>Unidad Reguladora y de Control de Datos Personales (URCDP)</strong> a través de su sitio oficial:{' '}
            <a
              href="https://www.gub.uy/unidad-reguladora-control-datos-personales"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              https://www.gub.uy/unidad-reguladora-control-datos-personales
            </a>.
          </p>
        </section>

        <section className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Esta política se rige por la Ley 18.331 de Protección de Datos Personales y su Decreto reglamentario 414/009.
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
