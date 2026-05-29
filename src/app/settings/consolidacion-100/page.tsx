import Link from 'next/link';

const coreFlow = [
  'Consulta',
  'CRM',
  'Presupuesto',
  'Cliente',
  'Contrato',
  'Fiesta',
  'Pago',
  'Portal Cliente',
  'Invitados',
  'Fiesta en vivo',
  'Post-fiesta',
];

const areas = [
  { title: 'Venta', main: 'CRM + Presupuestos', status: 'Revisar flujo completo' },
  { title: 'Presupuestos', main: 'Vista formal + PDF + WhatsApp', status: 'Cerrar numeros y edicion' },
  { title: 'Evento confirmado', main: 'Comando Total / Centro de Experiencia', status: 'Definir pantalla principal' },
  { title: 'Cliente', main: 'Portal Cliente', status: 'Validar fases y pagos' },
  { title: 'Invitados', main: 'Invitacion + RSVP + QR', status: 'Probar acceso publico' },
  { title: 'Fiesta en vivo', main: 'Show Control / Centro Total', status: 'Ordenar accesos' },
  { title: 'IA', main: 'Multiagente AK', status: 'Evitar falsos exitos' },
  { title: 'Seguridad', main: 'Seguridad y Cuenta', status: 'Revisar al final' },
  { title: 'Backup', main: 'Backup y restauracion', status: 'Validar antes de cambios grandes' },
];

const nextPrs = [
  'Flujo comercial completo',
  'Presupuestos confiables',
  'Fiesta operativa completa',
  'Portal cliente e invitados',
  'Multiagente operativo real',
  'Seguridad final',
  'Prueba final completa',
];

export default function Consolidacion100Page() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">PR 1 - Consolidacion total</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Mapa real de la app AK</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Esta pantalla ordena lo que ya existe. La prioridad no es crear mas modulos, sino conectar, probar y dejar claro que pantalla manda en cada area.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/settings" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">Volver al Centro de Control</Link>
          <Link href="/eventos" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">Ir a Eventos</Link>
          <Link href="/contabilidad/crm" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">Ir a CRM</Link>
          <Link href="/presupuestos" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">Ir a Presupuestos</Link>
        </div>
      </div>

      <section className="rounded-2xl border bg-background p-6">
        <h2 className="text-xl font-bold">Flujo principal que debe funcionar</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {coreFlow.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border bg-card px-3 py-1 text-sm font-medium">{step}</span>
              {index < coreFlow.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <div key={area.title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-bold">{area.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Principal: {area.main}</p>
            <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm font-medium">{area.status}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Regla de trabajo</h2>
        <p className="mt-3 text-muted-foreground">
          No borrar pantallas todavia. Primero clasificar cada una como principal, secundaria, diagnostico o historica.
        </p>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Siguientes PR grandes</h2>
        <ol className="mt-4 space-y-2">
          {nextPrs.map((item, index) => (
            <li key={item} className="rounded-lg border px-4 py-3 text-sm font-medium">
              {index + 2}. {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
