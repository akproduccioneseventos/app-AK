/**
 * Reglas del dueño (21/10/2026) para armar el personal según los invitados.
 * - Cocina: una persona cada 25 invitados, y la primera es el chef. 100 invitados = chef y 3 ayudantes.
 * - Utileros: uno cada 30 invitados.
 * - Barra: hasta 99 invitados, un barman que cobra $2000; de 100 a 150, uno que cobra $2800; más de
 *   150, dos que cobran $2000 cada uno.
 */
const invitadosValidos = (n: number) => Math.max(0, Number(n) || 0);

export function personalDeCocina(invitados: number): { chef: number; ayudantes: number } {
  const total = Math.max(1, Math.ceil(invitadosValidos(invitados) / 25));
  return { chef: 1, ayudantes: total - 1 };
}

export function utilerosPorInvitados(invitados: number): number {
  return Math.max(1, Math.ceil(invitadosValidos(invitados) / 30));
}

export function barmanPorInvitados(invitados: number): { cantidad: number; sueldo: number } {
  const n = invitadosValidos(invitados);
  if (n > 150) return { cantidad: 2, sueldo: 2000 };
  if (n >= 100) return { cantidad: 1, sueldo: 2800 };
  return { cantidad: 1, sueldo: 2000 };
}

/** Primero el nombre exacto: "Barman" no tiene que caer en "Ayudante de Barman", que está antes en la lista. */
export function buscarRol<T extends { nombre: string }>(roles: T[], buscado: string): T | undefined {
  const b = buscado.trim().toLowerCase();
  return roles.find(r => r.nombre.trim().toLowerCase() === b) ?? roles.find(r => r.nombre.toLowerCase().includes(b));
}
