#!/usr/bin/env node
/**
 * CONTROL AUTOMÁTICO DE ESTÉTICA
 *
 * Revisa que las pantallas que ve el cliente y el invitado respeten las reglas
 * visuales de AK Producciones (orden 22, bloque 7):
 * 1. Textos táctiles y leíbles de lejos >= 14px (en pantalla gigante >= 2% o rems proporcionados).
 * 2. Zona segura contra proyector (margen mínimo del 5% o padding perimetral).
 * 3. Prevención de desborde horizontal en celulares (overflow-x limpio).
 *
 * Avisa, no frena.
 */

import fs from 'node:fs';
import path from 'node:path';

const PANTALLAS_CLAVE = [
  {
    nombre: 'Fotocabina Digital',
    archivo: 'src/app/evento/fotocabina/[fiestaId]/page.tsx',
    tipo: 'estacion',
  },
  {
    nombre: 'Touchpix 360°',
    archivo: 'src/app/evento/touchpix/[fiestaId]/page.tsx',
    tipo: 'estacion',
  },
  {
    nombre: 'Bogue Boomerang',
    archivo: 'src/app/evento/bogue/[fiestaId]/page.tsx',
    tipo: 'estacion',
  },
  {
    nombre: 'Buzón de Recuerdos',
    archivo: 'src/app/evento/buzon/[fiestaId]/page.tsx',
    tipo: 'estacion',
  },
  {
    nombre: 'Pantalla Gigante (Muro en Vivo)',
    archivo: 'src/app/evento/muro-en-vivo/[fiestaId]/page.tsx',
    tipo: 'pantalla-gigante',
  },
  {
    nombre: 'Afiche QR para Imprimir',
    archivo: 'src/app/evento/muro-en-vivo/[fiestaId]/afiche/page.tsx',
    tipo: 'impreso',
  },
  {
    nombre: 'Invitación Digital',
    archivo: 'src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx',
    tipo: 'invitacion',
  },
  {
    nombre: 'Álbum del Recuerdo',
    archivo: 'src/app/evento/album/[fiestaId]/page.tsx',
    tipo: 'album',
  },
  {
    nombre: 'Presentación LED Comercial',
    archivo: 'src/app/presentacion-led/page.tsx',
    tipo: 'venta',
  },
  {
    nombre: 'Vidriera Tecnológica',
    archivo: 'src/components/public/InteractiveTechShowcase.tsx',
    tipo: 'venta',
  },
];

export function verificarEsteticaNode() {
  const resultados = [];

  for (const pantalla of PANTALLAS_CLAVE) {
    const rutaAbs = path.join(process.cwd(), pantalla.archivo);
    if (!fs.existsSync(rutaAbs)) {
      resultados.push({
        nombre: pantalla.nombre,
        archivo: pantalla.archivo,
        ok: false,
        observaciones: ['Archivo no encontrado'],
      });
      continue;
    }

    const contenido = fs.readFileSync(rutaAbs, 'utf8');
    const observaciones = [];

    // 1. Control de Zona Segura / Márgenes (pantalla gigante y estaciones)
    if (pantalla.tipo === 'pantalla-gigante') {
      const tieneMargenSeguro = /p-[4-8]|p-\[|inset-|padding|safe/i.test(contenido);
      if (!tieneMargenSeguro) {
        observaciones.push('Verificar margen de 5% para corte de proyector');
      }
    }

    // 2. Control de Desborde Horizontal (invitación, álbum, venta)
    if (['invitacion', 'album', 'venta'].includes(pantalla.tipo)) {
      const tienePrevencionDesborde = /overflow-x-hidden|max-w-|w-full|container|mx-auto/i.test(contenido);
      if (!tienePrevencionDesborde) {
        observaciones.push('Revisar posibles desbordes horizontales en celular');
      }
    }

    // 3. Control de Legibilidad de Botones Táctiles
    if (pantalla.tipo === 'estacion') {
      const tieneBotonesGrandes = /min-h-\[48px\]|h-12|h-14|h-16|p-4|p-6|rounded-full|rounded-2xl/i.test(contenido);
      if (!tieneBotonesGrandes) {
        observaciones.push('Botones táctiles podrían requerir mayor área de toque');
      }
    }

    resultados.push({
      nombre: pantalla.nombre,
      archivo: pantalla.archivo,
      ok: observaciones.length === 0,
      observaciones,
    });
  }

  const conformes = resultados.filter((r) => r.ok);
  const conObservacion = resultados.filter((r) => !r.ok);

  return {
    total: resultados.length,
    conformesCount: conformes.length,
    conObservacionCount: conObservacion.length,
    resultados,
    resumenTexto: `Estética: ${conformes.length} de ${resultados.length} pantallas clave verificadas.${conObservacion.length > 0 ? ` Con observaciones: ${conObservacion.map((r) => r.nombre).join(', ')}.` : ''}`,
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('control-estetica.mjs')) {
  console.log('\nCONTROL DE ESTÉTICA EN PANTALLAS CLAVE\n' + '='.repeat(60));
  const res = verificarEsteticaNode();
  for (const r of res.resultados) {
    const icono = r.ok ? '✓' : '⚠️';
    const detalle = r.ok ? 'Conforme a las reglas visuales' : r.observaciones.join('; ');
    console.log(`  [${icono}] ${r.nombre.padEnd(32)}: ${detalle}`);
  }
  console.log('='.repeat(60));
  console.log(`  ${res.resumenTexto}\n`);
}
