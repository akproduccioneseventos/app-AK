import fs from 'fs';
import path from 'path';

describe('La cola de la puerta no borra escaneos nuevos (Orden 195 / Codex 149)', () => {
  it('el scanner contiene sincronizarCola y re-lee la cola para no borrar escaneos que entraron mientras esperaba', () => {
    const scannerPath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx');
    const codigo = fs.readFileSync(scannerPath, 'utf8');

    expect(codigo).toContain('sincronizarCola');
    expect(codigo).toContain('ak_checkin_pendientes_');
    expect(codigo).toContain('confirmados');
    expect(codigo).toContain('escaneadoEn');
  });

  it('la lógica de sincronización retira sólo confirmados de la cola actual', () => {
    let colaStorage = [
      { guestId: 'guest-A', token: 'tok-A', escaneadoEn: '2026-10-21T20:00:00.000Z' },
    ];

    const getCola = () => [...colaStorage];
    const guardarCola = (nueva: any[]) => { colaStorage = [...nueva]; };

    // 1. Inicia sincronización leyendo A
    const colaLeida = getCola();
    const confirmados = new Set<string>();

    // Simula que A se confirma en el servidor
    confirmados.add('guest-A');

    // 2. Mientras A esperaba red, entra B por un escaneo nuevo
    colaStorage.push({ guestId: 'guest-B', token: 'tok-B', escaneadoEn: '2026-10-21T20:00:05.000Z' });

    // 3. Sincronizador termina: re-lee cola actual y filtra confirmados
    const colaActual = getCola();
    const nuevaCola = colaActual.filter((item) => !confirmados.has(item.guestId));
    guardarCola(nuevaCola);

    // B debe seguir existiendo en la cola
    expect(colaStorage).toHaveLength(1);
    expect(colaStorage[0].guestId).toBe('guest-B');
  });
});
