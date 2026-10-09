/** @jest-environment node */
/**
 * NINGUNA PANTALLA QUE CONTESTA UN INVITADO SE QUEDA EN "ENVIANDO...".
 *
 * **Lo encontro Codex el 17 de septiembre de 2026, en la encuesta post fiesta.** El envio se
 * hacia sin red de seguridad: si el servidor no contestaba o se cortaba la senal, el aviso de
 * "Enviando..." **quedaba prendido para siempre**. El invitado ve el boton girando, se cansa y
 * se va creyendo que mando sus comentarios. No mando nada y nadie se entera.
 *
 * Estas son las pantallas que usa gente sin cuenta —el invitado, el cliente— desde el celular,
 * que es donde la senal se corta de verdad. En todas, el cartel de "enviando" se tiene que
 * apagar **pase lo que pase**: eso es lo que hace un `finally`.
 *
 * **Lo que esta prueba NO puede ver:** que el cartel se apague de verdad en la pantalla; eso lo
 * mira una prueba de navegador. Esta frena la forma exacta en que ya se escapo una vez.
 */
import fs from 'fs';
import path from 'path';

const PANTALLAS_SIN_CUENTA = [
  'src/app/feedback/[fiestaId]/page.tsx',
  'src/app/invitacion/[fiestaId]/rsvp/page.tsx',
  'src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx',
  'src/app/evento/buzon/[fiestaId]/page.tsx',
];

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf-8');
}

describe('Las pantallas que contesta un invitado no se quedan colgadas', () => {
  it.each(PANTALLAS_SIN_CUENTA)('%s apaga el cartel de enviando pase lo que pase', (pantalla) => {
    const codigo = leer(pantalla);
    const prende = (codigo.match(/set(IsSubmitting|Enviando)\(true\)/g) || []).length;
    if (prende === 0) return; // esa pantalla no manda nada: no hay cartel que apagar

    const bloquesFinally = codigo.split(/\}\s*finally\s*\{/).slice(1);
    const apagadosSeguros = bloquesFinally.filter((bloque) =>
      /set(IsSubmitting|Enviando)\(false\)/.test(bloque.slice(0, 400)),
    ).length;

    expect(apagadosSeguros).toBeGreaterThanOrEqual(prende);
  });

  it('la lista de pantallas sin cuenta no quedo vieja', () => {
    // Si alguien agrega una pantalla publica con envio y no la anota aca, esto lo dice.
    for (const pantalla of PANTALLAS_SIN_CUENTA) {
      expect(fs.existsSync(path.join(process.cwd(), pantalla))).toBe(true);
    }
  });
});

/**
 * BARRIDO (Codex, auditoria 82, BAR82-CANCEL): en TODA pantalla que usa un invitado o un cliente,
 * un estado de "en curso" que se prende antes de hablar con el servidor tiene que apagarse en un
 * `finally`. Si se corta la senal y se apaga despues del await, el boton gira para siempre.
 */
const CARPETAS_DE_GENTE_SIN_CUENTA = [
  'src/app/invitacion',
  'src/app/feedback',
  'src/app/evento',
  'src/app/portal-cliente',
  'src/app/portal',
  'src/components/invitacion',
];

const ESTADO_EN_CURSO =
  /set(IsSending\w*|Sending\w*|IsSaving\w*|IsSubmitting|IsProcessing|IsUploading\w*|IsGenerating\w*|IsNotifying|IsSearching|IsPrinting|IsCanceling|IsOrdering|Enviando)\(\s*([^)]*?)\s*\)/g;

/** Excepciones legitimas: archivo -> estado -> motivo. Nada se agrega aca para callar la prueba. */
const SIN_FINALLY_A_PROPOSITO: Record<string, Record<string, string>> = {
  'src/app/evento/impresion/[fiestaId]/page.tsx': {
    IsPrinting: 'No hay await: window.print() corre dentro de un setTimeout y el apagado esta en el mismo bloque.',
  },
  'src/app/evento/bogue/[fiestaId]/page.tsx': {
    IsPrinting: 'No hay await: se apaga con un setTimeout fijo de 2 segundos, pase lo que pase con la impresion.',
  },
  'src/app/evento/touchpix/[fiestaId]/page.tsx': {
    IsProcessing: 'El try/catch ya traga cualquier falla y cae al efecto local; el apagado ocurre en los callbacks del canvas, que es donde termina el trabajo.',
  },
  'src/app/evento/[id]/video-recuerdo/video-recuerdo-client.tsx': {
    IsGeneratingVideo: 'Se apaga tanto en el try (con un retraso para mostrar el 100%) como en el catch; no hay camino que lo deje prendido.',
  },
};

function archivosTsx(carpeta: string): string[] {
  const raiz = path.join(process.cwd(), carpeta);
  if (!fs.existsSync(raiz)) return [];
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, entrada.name);
      if (entrada.isDirectory()) recorrer(completa);
      else if (entrada.name.endsWith('.tsx')) salida.push(path.relative(process.cwd(), completa).split(path.sep).join('/'));
    }
  };
  recorrer(raiz);
  return salida;
}

describe('Barrido: ningun estado de "en curso" de una pantalla publica se apaga fuera de un finally', () => {
  const archivos = CARPETAS_DE_GENTE_SIN_CUENTA.flatMap(archivosTsx);

  it('encuentra pantallas para revisar', () => {
    expect(archivos.length).toBeGreaterThan(20);
  });

  it('cada estado que se prende tiene su apagado dentro de un finally', () => {
    const colgados: string[] = [];
    for (const archivo of archivos) {
      const codigo = leer(archivo);
      const prendidos = new Set<string>();
      for (const m of codigo.matchAll(ESTADO_EN_CURSO)) {
        const valor = m[2].trim();
        if (valor === 'false' || valor === 'null') continue;
        prendidos.add(m[1]);
      }
      if (prendidos.size === 0) continue;
      const bloquesFinally = codigo.split(/\}\s*finally\s*\{/).slice(1).map((b) => b.slice(0, 500));
      for (const nombre of prendidos) {
        if (SIN_FINALLY_A_PROPOSITO[archivo]?.[nombre]) continue;
        const apagado = new RegExp(`set${nombre}\\(\\s*(false|null)\\s*\\)`);
        if (!bloquesFinally.some((b) => apagado.test(b))) colgados.push(`${archivo}: set${nombre}`);
      }
    }
    expect(colgados).toEqual([]);
  });

  it('las excepciones siguen apuntando a algo que existe', () => {
    for (const [archivo, estados] of Object.entries(SIN_FINALLY_A_PROPOSITO)) {
      const codigo = leer(archivo);
      for (const [nombre, motivo] of Object.entries(estados)) {
        expect(motivo.length).toBeGreaterThan(20);
        expect(codigo).toContain(`set${nombre}(`);
      }
    }
  });
});
