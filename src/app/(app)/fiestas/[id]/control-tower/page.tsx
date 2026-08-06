import { ModoFiestaPanel } from './modo-fiesta-panel';

export default async function ControlTowerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  return (
    <main className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-white">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-widest">
          Torre de Control
        </h1>
        <p className="mt-2 text-slate-400 font-medium">Panel de lanzamiento para tótems interactivos</p>
      </header>
      <ModoFiestaPanel fiestaId={params.id} />
    </main>
  );
}
