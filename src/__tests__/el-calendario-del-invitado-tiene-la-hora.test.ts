/** @jest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AddToCalendarButton, buildGoogleCalUrl, buildIcsContent } from '@/components/invitacion/AddToCalendarButton';

describe('Orden 369 Bloque 4.1: el calendario del invitado tiene la hora de Uruguay', () => {
  const originalTZ = process.env.TZ;
  let root: Root;
  let host: HTMLDivElement;

  beforeAll(() => {
    process.env.TZ = 'UTC';
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    process.env.TZ = originalTZ;
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('fiesta el 20/12/2026 a las 21:00 arma enlace con 20261220T210000 en America/Montevideo', () => {
    const url = buildGoogleCalUrl({
      eventName: 'Fiesta 20/12',
      startDate: '20/12/2026',
      horaEvento: '21:00',
      location: 'Salón AK',
    });

    expect(url).toContain('dates=20261220T210000/20261221T010000');
    expect(url).toContain('ctz=America%2FMontevideo');
    expect(url).not.toContain('T000000');

    const ics = buildIcsContent({
      eventName: 'Fiesta 20/12',
      startDate: '2026-12-20',
      horaEvento: '21:00',
      location: 'Salón AK',
    });
    expect(ics).toContain('DTSTART;TZID=America/Montevideo:20261220T210000');
    expect(ics).toContain('DTEND;TZID=America/Montevideo:20261221T010000');
  });

  it('renderiza el botón Agendar y genera el link de Google Calendar con 20261220T210000', () => {
    act(() => {
      root.render(
        React.createElement(AddToCalendarButton, {
          eventName: 'Boda Ana & Luis',
          startDate: '2026-12-20',
          horaEvento: '21:00',
          location: 'Chacra Salto',
        }),
      );
    });

    const agendarBtn = Array.from(host.querySelectorAll('button')).find(
      b => /Agendar/i.test(b.textContent || ''),
    );
    expect(agendarBtn).toBeTruthy();

    act(() => {
      agendarBtn!.click();
    });

    const link = Array.from(host.querySelectorAll('a')).find(
      a => /Google Calendar/i.test(a.textContent || ''),
    );
    expect(link).toBeTruthy();
    expect(link!.getAttribute('href')).toContain('20261220T210000');
    expect(link!.getAttribute('href')).toContain('ctz=America%2FMontevideo');
  });

  it('todas las plantillas pasan horaEvento a AddToCalendarButton', () => {
    const templatesDir = path.join(process.cwd(), 'src/components/invitacion/templates');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.tsx'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      if (content.includes('<AddToCalendarButton')) {
        expect(content).toContain('horaEvento=');
      }
    }
  });
});
