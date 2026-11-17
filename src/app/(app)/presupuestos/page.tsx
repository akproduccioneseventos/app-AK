import { redirect } from 'next/navigation';

// Redirección del servidor: antes era del navegador y mostraba unos segundos "Redirigiendo..." en una pantalla casi
// vacía (auditor, 17/11/2026, O3).
export default function PresupuestosPage() {
  redirect('/presupuestos/nuevo');
}
