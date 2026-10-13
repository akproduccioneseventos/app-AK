import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PortalError from '@/app/portal/c/[accessKey]/error';

test('Reintentar solicita el mismo portal al servidor, no solo repinta el error', () => {
  // jsdom cannot navigate; its native reload reports that limitation instead.
  const navigation = jest.spyOn(console, 'error').mockImplementation(() => {});
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  try {
    act(() => root.render(<PortalError />));
    const button = host.querySelector('button')!;
    expect(button.textContent).toContain('Reintentar');
    act(() => button.click());
    expect(navigation.mock.calls.some(([error]) => /Not implemented: navigation/i.test(String(error)))).toBe(true);
  } finally {
    act(() => root.unmount()); host.remove();
    navigation.mockRestore();
  }
});
