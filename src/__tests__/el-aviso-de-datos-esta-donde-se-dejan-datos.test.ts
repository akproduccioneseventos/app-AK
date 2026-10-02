const { TextEncoder, TextDecoder } = require('util');
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import { AvisoDeDatos } from '@/components/legal/AvisoDeDatos';
import fs from 'fs';
import path from 'path';

const { renderToStaticMarkup } = require('react-dom/server');

describe('Orden 101 - Bloque 6: Aviso de datos personales (Ley 18.331)', () => {
  it('para="invitado" muestra su texto sin mencionar organizar ni evento, incluye 18.331 y link a privacidad', () => {
    const html = renderToStaticMarkup(React.createElement(AvisoDeDatos, { para: 'invitado' }));

    expect(html).toContain('Tus datos quedan sólo para esta fiesta');
    expect(html).toContain('18.331');
    expect(html.toLowerCase()).not.toContain('organizar');
    expect(html.toLowerCase()).not.toContain('evento');
    expect(html).toContain('href="/privacidad"');
    expect(html).toContain('Privacidad');

    // No debe tener ningún checkbox ni casilla para marcar
    expect(html).not.toContain('type="checkbox"');
  });

  it('para="cliente" muestra su texto legal sin checkbox', () => {
    const html = renderToStaticMarkup(React.createElement(AvisoDeDatos, { para: 'cliente' }));

    expect(html).toContain('Usamos tus datos sólo para contestarte y para tu evento (Ley 18.331)');
    expect(html).toContain('href="/privacidad"');
    expect(html).toContain('Privacidad');
    expect(html).not.toContain('type="checkbox"');
  });

  it('para="equipo" muestra su texto para trabajo en eventos', () => {
    const html = renderToStaticMarkup(React.createElement(AvisoDeDatos, { para: 'equipo' }));

    expect(html).toContain('Tus datos se usan sólo para el trabajo en los eventos (Ley 18.331)');
    expect(html).toContain('href="/privacidad"');
    expect(html).toContain('Privacidad');
    expect(html).not.toContain('type="checkbox"');
  });

  it('recorre todas las pantallas de afuera con campos de entrada: todas usan AvisoDeDatos y respetan el rol', () => {
    const EXCLUIDAS = [
      'login',
      'buscar',
      'admin',
      'control-tower',
      'marketing',
      'secretaria-ak',
      'presentacion-led', // Diapositivas en pantalla gigante para reuniones internas
    ];

    function getTsxFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          const base = path.basename(full);
          if (base === '(app)' || base === 'api' || EXCLUIDAS.includes(base)) {
            continue;
          }
          results = results.concat(getTsxFiles(full));
        } else if (file.endsWith('.tsx')) {
          results.push(full);
        }
      }
      return results;
    }

    const files = getTsxFiles(path.join(process.cwd(), 'src/app'));
    const filesWithInputs = files.filter((f) => {
      const content = fs.readFileSync(f, 'utf8');
      return /<(Input|input|Textarea|textarea)\b/.test(content);
    });

    expect(filesWithInputs.length).toBeGreaterThan(0);

    for (const filePath of filesWithInputs) {
      const norm = filePath.replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, 'utf8');

      // Todas deben usar AvisoDeDatos
      expect(content).toContain('AvisoDeDatos');

      // Las de invitado, evento o video-vida deben usar para="invitado" (salvo las vistas específicas del organizador)
      if (
        (norm.includes('invitacion/') || norm.includes('evento/') || norm.includes('video-vida/')) &&
        !norm.includes('organizador')
      ) {
        expect(content).toContain('para="invitado"');
      }
    }
  });
});
