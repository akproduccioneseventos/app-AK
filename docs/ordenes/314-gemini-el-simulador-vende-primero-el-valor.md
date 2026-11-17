# Orden 314 — El simulador vende primero el valor (aprobada por el dueño el 17/11/2026)

Viene de la "Propuesta comercial del simulador" (17/11). El dueño aprobó: beneficios antes que precio, "reunión a
coordinar", personalizar en el resumen, medir cuánto vende y regalos con sus condiciones. Va en la **misma propuesta** que
lo que tenés abierto (313 primero, después 310, 311, 312). Leé `docs/ANTES-DE-ENTREGAR.md` y la habilidad `vende`.

**No se toca:** precios, promociones, la bonificación, la seña, el ajuste anual, la captura de nombre y celular (va al
CRM), la validación de fecha con alternativas, la elección de paquetes, ni los regalos que ya existen.

Archivo principal: `src/app/simulador-de-presupuesto/page.tsx`.

## Bloque 1 — Una sola portada de valor (paso 0 + paso 1)

Hoy el paso 0 arranca con "Presupuesto para tu evento" y "Vas a ver el precio vigente…", y los beneficios ("¿POR QUÉ ELEGIR
AK PRODUCCIONES?", las 4 tarjetas, el gancho del Club Uruguay 50% OFF) recién aparecen en el paso 1 (`step === 1`, línea
~2121) con su propio "COTIZAR AHORA". Unir: la primera pantalla muestra los beneficios y el gancho del Club Uruguay, con un
solo botón "Armá tu presupuesto". **Se reordena lo que ya existe**, no se redactan textos nuevos de venta, y no aparece la
palabra "precio" en la primera pantalla. El símbolo roto de "COTIZAR AHORA" desaparece con el botón viejo.

## Bloque 2 — "Reunión a coordinar", no "oficina"

AK ya no tiene oficina pública. Cambiar:
- `src/components/simulator/SimulatorMeetingScheduler.tsx` línea ~170: "…tu entrevista sin costo en nuestra oficina" →
  "…tu reunión sin costo: en el salón, por videollamada o donde acordemos".
- `src/components/landing/EntrevistaGratuitaModal.tsx` línea ~173: "Te esperamos en nuestra oficina en Salto" → "Coordinamos
  dónde: en el salón, por videollamada o donde te quede cómodo".
- En el resumen del simulador, "entrevista" → "reunión". El botón principal del cierre es "Coordinar reunión por WhatsApp"
  (el mensaje prearmado ya existe; no lo cambies).

## Bloque 3 — Personalizar también en el resumen

Después de mostrar el precio, tres botones visibles: "Sacá servicios que no querés", "Agregá servicios" y "Cambiá de
paquete". Cada uno vuelve al paso que corresponde **conservando todo lo cargado** (`excludedPackageServiceIds`,
`formData.serviciosSeleccionados`, menús). Prueba de navegador: desde el resumen, "Sacá servicios", sacar uno, volver al
resumen: el total baja y lo demás sigue igual.

## Bloque 4 — Regalos con sus condiciones

En el resumen, cada regalo de "Regalos Incluidos" se lista con qué es y con qué contratación aplica, tomado de los datos
del regalo que ya existen. **No inventes regalos ni condiciones**: si un regalo no tiene condición cargada, se muestra sólo
su nombre.

## Bloque 5 — El reloj dice la verdad al llegar a cero

**Decisión de Claude con el visto bueno del dueño:** el reloj se queda (es decisión suya) y el texto de la promoción se queda.
Lo que cambia es el final: hoy (líneas ~415-439) al recargar después de vencido arranca de nuevo en 15:00. Ahora:
- La hora de vencimiento se guarda en `localStorage` (no `sessionStorage`) y **no se renueva** al recargar ni al volver.
- Al llegar a 0:00 queda en 0:00 y el cartel pasa a decir: "La promoción y los regalos los confirmamos en tu reunión.
  Coordinala ahora." con el mismo botón de coordinar. **No** se agrega un vencimiento de precio ni se borra nada del
  presupuesto: el texto de "30 días" (línea ~1804) sigue igual.
- Prueba con reloj falso: a los 16 minutos dice 0:00 y el cartel nuevo; recargando sigue en 0:00.

Esto reemplaza el bloque 5 de la orden 312.

## Bloque 6 — Medir cuánto vende

Registrar cuatro momentos por presupuesto (sin datos personales): empezó el simulador, lo terminó, tocó "coordinar reunión"
y, cuando el presupuesto pasa a aceptado, venta. Guardarlos con la herramienta de medición que ya existe (`src/lib/medicion-segura.ts`) y mostrar los
cuatro números del mes en el panel de Marketing. Prueba: un recorrido completo suma 1 en cada uno de los tres primeros.

```comprobar
usa: localStorage en src/app/simulador-de-presupuesto/page.tsx
no-usa: nuestra oficina en src/components/simulator/SimulatorMeetingScheduler.tsx
no-usa: nuestra oficina en src/components/landing/EntrevistaGratuitaModal.tsx
usa: Armá tu presupuesto en src/app/simulador-de-presupuesto/page.tsx
```
