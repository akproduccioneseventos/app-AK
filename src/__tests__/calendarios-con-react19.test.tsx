import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import { DashboardCalendar } from '@/components/dashboard-calendar';
import { Calendar } from '@/components/ui/calendar';
import { SocialMediaCalendar } from '@/components/social-media/SocialMediaCalendar';
import type { SocialPost } from '@/types/social-media';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

function renderInDom(element: React.ReactNode) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  return {
    host,
    render: async () => act(async () => { root.render(element); }),
    cleanup: () => { act(() => root.unmount()); host.remove(); },
  };
}

function dayButton(host: HTMLElement, day: number) {
  const button = Array.from(host.querySelectorAll<HTMLButtonElement>('button'))
    .find(candidate => candidate.textContent?.trim() === String(day));
  if (!button) throw new Error(`No se encontro el boton del dia ${day}`);
  return button;
}

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date(2026, 4, 1, 12)); });
afterEach(() => { jest.useRealTimers(); });

test('DashboardCalendar muestra la fecha seleccionada y reservada, cambia de mes y selecciona un dia', async () => {
  const selected = jest.fn();
  function ControlledCalendar() {
    const [month, setMonth] = React.useState(new Date(2026, 4, 1));
    return (
    <DashboardCalendar
      month={month}
      onMonthChange={setMonth}
      selected={new Date(2026, 4, 14)}
      occupiedDates={[new Date(2026, 4, 18)]}
      onSelect={selected}
    />
    );
  }
  const view = renderInDom(<ControlledCalendar />);
  try {
    await view.render();
    const selectedDay = dayButton(view.host, 14);
    const bookedDay = dayButton(view.host, 18);
    expect(selectedDay.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(bookedDay.closest('[role="gridcell"]')).toHaveStyle({ fontWeight: 'bold' });

    const nextMonth = view.host.querySelector<HTMLButtonElement>('button[aria-label="Ir al mes siguiente"]');
    expect(nextMonth).toBeTruthy();
    await act(async () => { nextMonth!.click(); });
    expect(view.host.textContent).toContain('junio 2026');

    await act(async () => { dayButton(view.host, 9).click(); });
    expect(selected.mock.calls[0][0]).toEqual(new Date(2026, 5, 9));
  } finally { view.cleanup(); }
});

test('Calendar en modo rango marca los dos extremos seleccionados', async () => {
  const view = renderInDom(
    <Calendar
      mode="range"
      month={new Date(2026, 4, 1)}
      selected={{ from: new Date(2026, 4, 12), to: new Date(2026, 4, 16) }}
    />,
  );
  try {
    await view.render();
    expect(dayButton(view.host, 12).closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(dayButton(view.host, 16).closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
  } finally { view.cleanup(); }
});

test('Calendar deja las flechas clicables y usa chevron hacia abajo en desplegables', async () => {
  const view = renderInDom(<Calendar captionLayout="dropdown" startMonth={new Date(2025, 0)} endMonth={new Date(2028, 11)} month={new Date(2026, 4)} />);
  try {
    await view.render();
    const previous = view.host.querySelector<HTMLButtonElement>('button[aria-label="Go to the Previous Month"]');
    expect(previous).toBeTruthy();
    expect(previous).toHaveClass('pointer-events-auto');
    expect(previous!.closest('nav')).toHaveClass('pointer-events-none');
    expect(view.host.querySelector('svg.lucide-chevron-down')).toBeTruthy();
  } finally { view.cleanup(); }
});

test('SocialMediaCalendar abre el contenido de una publicacion y navega al mes siguiente', async () => {
  const posts: SocialPost[] = [{
    id: 'post-calendario-real',
    platform: 'Instagram',
    text: 'Publicacion de prueba visible en el calendario',
    publishDate: '2026-05-14T12:00:00.000Z',
    status: 'Programado',
  }];
  const view = renderInDom(<SocialMediaCalendar posts={posts} />);
  try {
    await view.render();
    await act(async () => { dayButton(view.host, 14).click(); });
    expect(document.body.textContent).toContain('Publicacion de prueba visible en el calendario');

    const nextMonth = view.host.querySelector<HTMLButtonElement>('button[aria-label="Ir al mes siguiente"]');
    expect(nextMonth).toBeTruthy();
    await act(async () => { nextMonth!.click(); });
    expect(view.host.textContent).toContain('junio 2026');
  } finally { view.cleanup(); }
});
