/**
 * El importe en letras del recibo ("LA SUMA DE ...").
 *
 * Los pesos enteros se escriben igual que siempre. Una factura en otra moneda puede tener
 * centavos (Codex, COB06, 3/10/2026): antes 12,50 salía "DIEZ Y undefined". Ahora el entero va en
 * letras y los centavos como "CON 50/100", que es como se escribe en un recibo.
 */
const PALABRAS: Record<number, string> = {
  0: 'CERO', 1: 'UN', 2: 'DOS', 3: 'TRES', 4: 'CUATRO', 5: 'CINCO', 6: 'SEIS', 7: 'SIETE', 8: 'OCHO', 9: 'NUEVE',
  10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE', 20: 'VEINTE', 30: 'TREINTA',
  40: 'CUARENTA', 50: 'CINCUENTA', 60: 'SESENTA', 70: 'SETENTA', 80: 'OCHENTA', 90: 'NOVENTA',
  100: 'CIEN', 200: 'DOSCIENTOS', 300: 'TRESCIENTOS', 400: 'CUATROCIENTOS', 500: 'QUINIENTOS',
  600: 'SEISCIENTOS', 700: 'SETECIENTOS', 800: 'OCHOCIENTOS', 900: 'NOVECIENTOS',
  1000: 'MIL', 1000000: 'UN MILLÓN',
};

export function enteroEnLetras(n: number): string {
  if (n in PALABRAS) return PALABRAS[n];
  if (n < 100) {
    const decenas = Math.floor(n / 10) * 10;
    const unidades = n % 10;
    return `${PALABRAS[decenas]}${unidades > 0 ? ' Y ' + PALABRAS[unidades] : ''}`;
  }
  if (n < 1000) {
    const cientos = Math.floor(n / 100) * 100;
    const resto = n % 100;
    return `${n === 100 ? 'CIEN' : PALABRAS[cientos]}${resto > 0 ? ' ' + enteroEnLetras(resto) : ''}`;
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    return `${miles === 1 ? 'MIL' : enteroEnLetras(miles) + ' MIL'}${resto > 0 ? ' ' + enteroEnLetras(resto) : ''}`;
  }
  return n.toString();
}

export function montoEnLetras(monto: number): string {
  const centavosTotales = Math.round(Math.abs(monto) * 100);
  const entero = Math.floor(centavosTotales / 100);
  const centavos = centavosTotales % 100;
  const letras = enteroEnLetras(entero);
  return centavos > 0 ? `${letras} CON ${String(centavos).padStart(2, '0')}/100` : letras;
}
