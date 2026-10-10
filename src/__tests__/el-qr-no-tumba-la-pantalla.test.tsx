/** @jest-environment node */
/**
 * Un QR no entra con un enlace enorme: sin depósito de archivos el recuerdo vuelve como un enlace
 * con el archivo adentro, y la biblioteca del QR tiraba "Data too long" y se caía la pantalla
 * entera de la 360 con el video ya guardado. Lo encontró la prueba de navegador de las estaciones
 * al arreglar la entrega de la 360 (Codex, auditoría 83). Probado rompiéndolo: sin el control de
 * largo, la primera prueba tira.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { QrRecuerdo } from '@/components/entretenimiento/QrRecuerdo';

it('con un enlace enorme no se cae: avisa que quedó guardado', () => {
  const enorme = `data:video/webm;base64,${'A'.repeat(200_000)}`;
  const html = renderToStaticMarkup(<QrRecuerdo qrCodeUrl={enorme} />);
  expect(html).toContain('Tu recuerdo quedó guardado');
});

it('con un enlace normal dibuja el QR', () => {
  const html = renderToStaticMarkup(<QrRecuerdo qrCodeUrl="https://akproducciones.uy/f/abc" />);
  expect(html).toContain('<svg');
});
