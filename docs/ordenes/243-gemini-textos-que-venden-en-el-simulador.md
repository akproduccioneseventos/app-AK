# Orden 243 — Los textos nuevos del simulador (27/10/2026)

**Para Gemini. Va en la MISMA propuesta que la orden 242** (rama `gemini/orden-242-con-o-sin-alcohol`). Si un
bloque se traba, entregá el resto y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`
sobre lo que tocaste.

El dueño aprobó estos textos el 27/10/2026, con sus palabras: *"me gusta más lo que dijo ChatGPT, lo que tiene
no vende"*. **Se copian TAL CUAL.** No los mejores, no los acortes y no agregues promesas.

Pantalla: `src/app/simulador-de-presupuesto/page.tsx`, que es la que usan la portada y los anuncios.

## Lo que NO se toca

- **El reloj de la promoción** (líneas ~1667-1692, `COMMERCIAL_TIMER_SECONDS` ~93, "Tu promoción, mientras corre el
  reloj"). Es decisión del dueño.
- **Los precios y cuentas:** `calculateSimulatorPricing` (`src/lib/simulator/pricing.ts`), `stats.totalFinal`, el
  descuento de Club Uruguay y el ajuste anual.
- **`SimulatorMeetingScheduler`** y `src/app/actions/simulator-agenda.ts`: la entrevista ya agenda. Sólo cambian
  textos, salvo el bloque 5.
- **Los `data-testid`** existentes, como `simulator-first-step-cta`.
- **Prohibido en lo que ve el cliente:** "garantía", "24/7", plazos de respuesta, "congelar", porcentajes de
  satisfacción y nombres del personal.

## Bloque 1 — Bienvenida (paso 1, `step === 1`, ~2036-2075)

- **h1 (~2056):** "Tu fiesta, como la imaginás. Nosotros te ayudamos a hacerla realidad."
- **Bajada (~2060), dos párrafos:**
  - "En AK Producciones Eventos reunimos todo lo que necesitás para celebrar: salón, comida, decoración,
    discoteca, fotografía, filmación, barra de tragos y mucho más."
  - "Elegí los servicios que te interesan, conocé un presupuesto estimado y descubrí las opciones para organizar
    tu fiesta."
- **Botón (~2070):** "Armar mi presupuesto". Debajo, en chico: "Sin compromiso. Podés adaptar los servicios a tus
  necesidades."
- **Sección nueva debajo del botón**, con el título "¿Por qué elegir AK Producciones?" y cuatro tarjetas, de una
  columna en el celular y dos en la tablet o más:
  - **Una organización más sencilla:** "En lugar de coordinar distintos servicios por separado, contás con un
    equipo que planifica y organiza los detalles de tu celebración."
  - **Una fiesta a tu manera:** "Elegí la comida, la ambientación, la música y los servicios que mejor se adapten
    a tu estilo, tus invitados y tu presupuesto."
  - **Disfrutá junto a tus invitados:** "Nos ocupamos de coordinar los servicios contratados para que puedas
    dedicarte a disfrutar de una noche especial."
  - **Presupuesto claro:** "Conocé cuánto cuesta cada servicio y cómo se compone tu propuesta. Después podemos
    revisarla juntos y ajustar los detalles."
- **En el celular, el botón tiene que quedar visible sin bajar la pantalla** (con un ancho de 390 px). Las
  tarjetas van debajo.

## Bloque 2 — Elegir servicios

Arriba del paso de gastronomía (~2338) y del de paquetes (~2458), un mismo encabezado:

- **h2:** "Elegí lo que querés para tu fiesta"
- **Bajada:** "Cada celebración es diferente. Seleccioná las opciones que más te gusten y mirá cómo se actualiza tu
  presupuesto."

Que no se repita dos veces en la misma pantalla.

## Bloque 3 — Presentación del presupuesto (paso 6, ~1624)

- **h2:** "Esta es tu fiesta, y este es tu presupuesto estimado."
- **Debajo:** "Ya tenés una primera propuesta. Ahora podemos ayudarte a ajustar el menú, los servicios y los detalles
  para que todo se adapte a lo que estás buscando."
- **Con `salonChoice === 'club'`, tres renglones claros:**
  1. "Alquiler del salón Club Uruguay (se paga directo al Club)", con `clubUruguayDetails`. Se muestra el precio con
     promoción, igual que hoy.
  2. "Servicios AK", con `stats.totalFinal`.
  3. "Total de referencia (salón + servicios)", que es la suma.

  La suma **sólo se muestra**: no entra en el presupuesto guardado ni en `stats.totalFinal`. La nota de ~3044
  sigue igual. Lo mismo en el paso 5 (~1933), si ahí se muestra el total.

## Bloque 4 — Cierre (paso 6)

- **Título:** "El siguiente paso es conocernos."
- **Texto:** "Te invitamos a coordinar una entrevista gratuita y sin compromiso para conversar sobre tu fiesta,
  mostrarte las opciones disponibles y preparar una propuesta personalizada."
- **Botón principal:** "Coordinar mi entrevista gratuita". Abre o lleva al `SimulatorMeetingScheduler` que ya
  existe (~1696).
- **Botón secundario:** "Consultar por WhatsApp". Usa el `handleWhatsAppQuickConsult` que ya existe (~1144).
- **Debajo, en chico:** "La fecha se reserva una vez confirmada su disponibilidad y cumplidas las condiciones de
  contratación."
- El botón "Compartir WhatsApp" del presupuesto (~1734) queda donde está.

## Bloque 5 — Una promesa que hay que sacar

`src/components/simulator/SimulatorMeetingScheduler.tsx:135` dice "congelamos las promociones de tu presupuesto para
la entrevista". Contradice la decisión del dueño: nada se congela. Cambialo por "Tu promoción sigue vigente mientras
corre el reloj."

## Bloque 6 — el simulador avisa cuando usa la lista guardada (27/10/2026)

`src/app/actions/public-simulator-bootstrap.ts:74-83` cae a `servicios-empresa.json` si la lectura viva falla, viene
vacía o tarda de más, y nadie se entera. Si esa lista está vieja, el prospecto ve precios viejos.

- Al cliente **no** se le muestra nada distinto: el simulador sigue andando.
- Al dueño le llega un aviso con `createNotification`: "El simulador usó la lista de precios guardada porque no pudo
  leer la del momento". Uno por día como máximo.
- La respuesta del bootstrap lleva `origenDePrecios: 'vivo' | 'respaldo'` para poder probarlo.

Prueba Jest: con la lectura viva fallando, `origenDePrecios` es `'respaldo'` y se crea un solo aviso aunque se llame
dos veces el mismo día.

```comprobar
# Bloque 6
usa: origenDePrecios en src/app/actions/public-simulator-bootstrap.ts
```

## Pruebas

Navegador, en `tests/e2e/el-simulador-tiene-los-textos-nuevos.spec.ts`. Comprobar:

- El paso 1 muestra el h1 nuevo y las cuatro tarjetas.
- En 390×844, el botón "Armar mi presupuesto" está dentro de la pantalla sin bajar.
- Con Club Uruguay y servicios elegidos, el paso 6 muestra los tres renglones, y el total de referencia es la suma
  de los otros dos. Leé los números de la pantalla y sumalos.
- Están "Coordinar mi entrevista gratuita" y "Consultar por WhatsApp".
- La pantalla no contiene "congel".

Las pruebas viejas del simulador que buscaban los textos anteriores se actualizan al texto nuevo. Su comprobación
no se afloja.

Corré `npx tsc --noEmit`, `npx jest --silent` y `npm run "publicar?:rapido"`, y pegá las últimas líneas de cada uno.

```comprobar
usa: Tu fiesta, como la imaginás en src/app/simulador-de-presupuesto/page.tsx
usa: ¿Por qué elegir AK Producciones? en src/app/simulador-de-presupuesto/page.tsx
usa: Elegí lo que querés para tu fiesta en src/app/simulador-de-presupuesto/page.tsx
usa: Total de referencia en src/app/simulador-de-presupuesto/page.tsx
usa: Coordinar mi entrevista gratuita en src/app/simulador-de-presupuesto/page.tsx
no-usa: congelamos en src/components/simulator/SimulatorMeetingScheduler.tsx
prueba: tests/e2e/el-simulador-tiene-los-textos-nuevos.spec.ts
```
