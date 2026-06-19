import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Globe2,
  MonitorPlay,
  QrCode,
  Users,
} from 'lucide-react';

const demonstrations = [
  {
    title: 'Portal del cliente',
    description: 'Mostrá presupuesto, pagos, reuniones y avances en una sola vista.',
    result: 'Orden y tranquilidad para la familia',
    icon: Users,
    href: '/presentacion-led/portafolio',
  },
  {
    title: 'Invitación e invitados',
    description: 'Enseñá la invitación web, las confirmaciones, las mesas y el ingreso con QR.',
    result: 'Menos mensajes y mejor organización',
    icon: QrCode,
    href: '/experiencia-ak',
  },
  {
    title: 'Experiencia en pantalla',
    description: 'Abrí la presentación LED, el muro social, las fotos y los momentos en vivo.',
    result: 'Participación durante el evento',
    icon: MonitorPlay,
    href: '/presentacion',
  },
  {
    title: 'Entretenimiento',
    description: 'Presentá fotocabina, plataforma 360, tótems y espejo mágico.',
    result: 'Más opciones para personalizar la fiesta',
    icon: Camera,
    href: '/fiestas/nueva/entretenimiento',
  },
];

const salesFlow = [
  {
    step: '1',
    title: 'Entender la fiesta',
    description: 'Primero escuchá qué necesita la familia y qué quiere resolver.',
  },
  {
    step: '2',
    title: 'Mostrar una solución',
    description: 'Abrí solamente la demostración que responde a esa necesidad.',
  },
  {
    step: '3',
    title: 'Pasar a la propuesta',
    description: 'Cerrá con el simulador o WhatsApp para avanzar con el presupuesto.',
  },
];

export default function MarketingDemoTecnologiaPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/marketing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Marketing
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-red-700">Herramienta comercial</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Mostrar la tecnología AK</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Elegí una experiencia según lo que le interese al cliente. No hace falta mostrar todo
                ni crear un evento de prueba.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/presentacion-led/portafolio"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                <MonitorPlay className="h-4 w-4" />
                Iniciar demostración
              </Link>
              <Link
                href="/landing"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                <Globe2 className="h-4 w-4" />
                Ver web pública
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
          <div>
            <h2 className="text-lg font-bold">Recorrido recomendado</h2>
            <p className="mt-1 text-sm text-slate-600">
              Una conversación simple funciona mejor que una presentación llena de funciones.
            </p>

            <ol className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {salesFlow.map((item) => (
                <li key={item.step} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <div className="relative aspect-[16/10]">
              <Image
                src="/media/catalogo-servicios/recepcion-display-evento-01.jpeg"
                alt="Pantalla de recepción tecnológica en un evento de AK Producciones"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 440px, 100vw"
                priority
              />
            </div>
            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold">La tecnología acompaña la fiesta</p>
              <p className="mt-1 text-sm text-slate-600">
                Se presenta como una solución concreta, no como una lista de herramientas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">¿Qué querés mostrar?</h2>
            <p className="mt-1 text-sm text-slate-600">Abrí solo el módulo que ayude a cerrar la venta.</p>
          </div>
          <p className="text-sm font-medium text-slate-500">4 demostraciones disponibles</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {demonstrations.map((demo) => {
            const Icon = demo.icon;
            return (
              <article
                key={demo.title}
                className="flex min-h-[220px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{demo.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{demo.description}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{demo.result}</span>
                </div>

                <Link
                  href={demo.href}
                  className="mt-auto inline-flex min-h-10 items-center justify-between gap-3 pt-5 text-sm font-semibold text-red-700 transition hover:text-red-900"
                >
                  Abrir demostración
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-xl font-bold">Cierre comercial</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Después de mostrar una experiencia, llevá la conversación a una propuesta concreta.
                El objetivo no es explicar la tecnología: es ayudar al cliente a imaginar su evento.
              </p>
            </div>
            <Link
              href="/simulador-ak"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ir al simulador
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
