# Orden 343 — El simulador que vende solo: primera pantalla de valor, paquetes por tipo de fiesta y precios a elección

**Para Gemini. Una sola propuesta con la 343, la 344 y la 345, rama nueva `gemini/orden-343` desde la principal recién
actualizada.** Si un bloque se
traba, entregá el resto en la misma propuesta y avisá cuál faltó. Antes de decir "terminé", leé
`docs/ANTES-DE-ENTREGAR.md`. Usá las habilidades `animaciones-pro`, `celular-primero` y `vende` del repositorio.

## Por qué (pedido del dueño, 24/11/2026)
El simulador (`/simulador-de-presupuesto`) es **el primer canal por el que vende**. Palabras suyas: *"la primera pantalla
es la que realmente muestra todos los beneficios… es lo que convence a las personas antes de poner sus datos y el
precio"*; *"no tiene movimiento, no tiene botones que titilan, no tiene colores, es muy blanco; tampoco muy llamativo:
un punto medio estético que dirija a las personas"*; *"dar primero la propuesta de valor de lo que somos antes del
precio, y decirle a la gente que en 2 minutos, sin compromiso"*. Partió de un informe propio
("Replanteo simulador AK — portada y precio") que Claude ajustó con él.

**Decisiones del dueño que valen para toda la orden (no se discuten):**
- **"En 2 minutos" y "válido 30 días" son ciertos y van.** El presupuesto es válido 30 días; los precios se pueden
  ajustar después porque suben las cosas.
- **El reloj de la promoción queda** como está: es la llamada a la acción para que se comuniquen. El 10% promocional
  también.
- Cifras: **"+200 fiestas"** y **"+7 años"**. Nada de "garantía", "24/7" ni porcentajes de satisfacción. No se nombra a
  nadie del personal.
- Las reseñas son **reales**: nunca inventar testimonios.

## Lo que ya existe (no lo rehagas)
- El simulador: `src/app/simulador-de-presupuesto/page.tsx` (3.400 líneas, `'use client'`). La portada es el bloque
  `if (!hasStarted)` (~1661-1722). El paso 1 de presentación es `step === 1` (~2245-2378). Pasos 2 a 5 hasta ~3190.
- Los datos llegan por `getPublicSimulatorBootstrap` (`src/app/actions/public-simulator-bootstrap.ts` ~78): config de
  paquetes (`getArmadoRapidoConfig`), servicios, menús. El simulador lo usa en ~568-576.
- La config de paquetes: tipo `ArmadoRapidoConfig` en `src/types/armado-rapido.ts` ~61. **Ya tiene `mostrarPrecios`**
  (~65, por omisión `true` en `src/app/actions/armado-rapido.ts` ~28), pero **el simulador público no lo lee** y el panel
  de Ajustes no lo muestra. Se guarda con `saveArmadoRapidoConfig` (`armado-rapido.ts` ~48).
- El panel de paquetes en Ajustes: `src/components/settings/panels/budget-display.tsx` (paquetes ~217-310, secciones por
  tipo `PACKAGE_EVENT_SECTIONS` ~55-62).
- El filtro por tipo: `isPackageApplicableToEventType` en `src/types/armado-rapido.ts` ~103. El simulador lo usa en
  ~1497 (`paquetesAplicables`).
- Reseñas aprobadas: `getTestimonials()` (`src/app/actions/feedback.ts` ~133), con el respaldo
  `src/data/testimonials.json` igual que la portada de la web (`src/app/page.tsx`, `AsyncTestimonialsSection` ~603).
- Fotos de fiestas reales: `getCatalogoFotos()` (`src/app/actions/catalogo-fotos`), las `destacada`, como la galería de
  la portada (`src/app/page.tsx` ~397-420).
- Cifras: `src/components/landing/StatsSection.tsx` ~9-10 ("+200", "+7").

## Bloque 1 — Una sola bienvenida que vende (fusionar la portada y el paso 1)
Hoy hay **dos pantallas que dicen casi lo mismo y tres botones** ("Comenzar mi presupuesto" rojo, "Armá tu presupuesto"
violeta `bg-indigo-700` ~2290, y "Continuar"). Queda **una sola pantalla de bienvenida** (la de `!hasStarted`) que lleva
todo, y el botón entra directo a los datos (paso 2). El `step === 1` se saca y la numeración de "Paso X de 5" se ajusta
a 4 pasos. La URL con `?paso=` u otros enlaces que hoy abran el paso 1 tienen que caer en la bienvenida.

Arriba, sin bajar (en el celular, 390 px):
1. Logo, y título: **"Tu fiesta, sin dolores de cabeza."** Debajo, en grande: **"Tu presupuesto en 2 minutos."**
2. **Un solo botón, rojo de marca** (`bg-red-600`): **"Armar mi presupuesto gratis"**. Debajo, línea chica:
   **"Sin compromiso · Te llega en PDF · Válido 30 días"**.
3. Franja de confianza: **"+200 fiestas · +7 años · Salto"** (de `StatsSection`, no escritas de nuevo a mano).

Bajando, en este orden:
4. **"Tu miedo, nuestra respuesta"**: seis tarjetas con ícono, máximo 12 palabras cada respuesta:
   | Miedo | Respuesta |
   |---|---|
   | ¿Voy a tener que coordinar todo yo? | Un solo responsable, una reunión y una seña. El día de la fiesta coordinamos nosotros. |
   | ¿Y si un proveedor falla? | Un solo equipo AK coordina todos los servicios. |
   | ¿Cómo llegan y vuelven los invitados? ¿Es seguro? | Salón Club Uruguay en pleno centro, con 50% OFF al contratar la producción integral. |
   | ¿Voy a pagar de más? | Presupuesto claro, sin compromiso, en PDF válido 30 días. |
   | ¿Quién me asesora? | Un coordinador te acompaña en cada decisión. |
   | ¿Qué más recibo? | Regalos incluidos en cada paquete. |
5. **Lo que dicen de nosotros:** 2 o 3 reseñas aprobadas (nombre, frase corta, estrellas si las tiene). Sumá
   `testimonios` al bootstrap con la misma fuente y respaldo que la portada. Si no hay ninguna, la sección no aparece.
6. **Fiestas reales:** carrusel chico de 3 a 6 fotos `destacada` de `getCatalogoFotos()` (sumalo al bootstrap). Sin
   fotos, no aparece.
7. **"Qué incluye cada paquete"**: una tarjeta por paquete de la config (los que aplican a "todos" o al tipo elegido si
   ya viene en la URL), con nombre, cantidad de servicios y **cantidad de regalos contada de `esRegalo`**, nunca escrita a
   mano. **Sin precio** (el precio viene después de los datos).
8. El aviso del **Salón Club Uruguay 50% OFF** (el texto de hoy ~2372-2374).
9. **"Cómo sigue":** 1 Armás tu fiesta · 2 Ves tu precio · 3 Si querés, coordinamos una reunión gratis.
10. Repetir el botón rojo al final. A Sofía, un enlace chico al pie (como hoy ~3416).

En el celular, cuando el botón de arriba sale de la pantalla, aparece **un botón fijo abajo** con el mismo texto.

## Bloque 2 — Color y movimiento: un punto medio que dirige
- **Color:** fondo de la bienvenida oscuro con la foto de una fiesta (como hoy), y las secciones de abajo en tonos
  cálidos suaves alternados (no todo blanco): por ejemplo, tarjetas blancas sobre `slate-50` y `rose-50/40`, íconos en
  rojo de marca y dorado (`amber`). **El violeta/índigo sale de todo el simulador** (botones `bg-indigo-*` de los pasos
  2 a 5 incluidos): el color de acción es el rojo de marca en todos los pasos.
- **Movimiento** (framer-motion, con las curvas y tiempos de la habilidad `animaciones-pro`): aparición suave al bajar
  en cada sección y tarjeta; el botón principal con un **latido suave** cada 3 a 4 segundos (no parpadeo); la barra de
  progreso de los pasos animada; el botón "Continuar" late cuando el paso está completo; al elegir un paquete, la
  tarjeta elegida se destaca con un movimiento corto. Todo respeta `prefers-reduced-motion` (sin movimiento si el
  teléfono lo pide).
- **Nada que distraiga del botón:** un solo elemento late por pantalla.

## Bloque 3 — Precio de cada servicio, a elección del dueño (interruptor en Ajustes)
1. En el panel de paquetes de Ajustes (`budget-display.tsx`), un interruptor: **"Mostrar el precio de cada servicio en
   el simulador"**, que guarda `mostrarPrecios` de la config. **Por omisión, encendido** (como hoy).
2. **Precisión del dueño (24/11/2026):** *"si apreto el interruptor esconde todos los precios, incluyendo el presupuesto
   que el prospecto descarga; recién aparecen cuando se hace el contrato y se debe firmar; si no está activado, como
   ahora"*. Con el interruptor en "esconder", el precio de cada servicio no aparece en **ningún lugar que vea el
   prospecto**: el simulador, el PDF que descarga, la vista pública del presupuesto (`src/app/(app)/presupuestos/[id]/ver/page.tsx`
   y su PDF) y el mensaje que se le manda. El detalle aparece recién cuando el presupuesto pasa a **contrato**: `estado`
   `'Aceptado'` o `'Facturado'` (`src/types/presupuesto.ts` ~106), o cuando su fiesta tiene contrato
   (`contratoFirmaInfo`, como mira `estadoDelContrato` en `src/app/actions/presupuestos.ts` ~544). El equipo, adentro de la
   app, sigue viendo todo siempre.
3. Con el interruptor en "esconder", en el simulador público:
   - En los pasos 2 a 5 **no se ve el precio de ningún servicio o plato suelto**: hoy aparecen en el paso 3 (~2599, ~2635,
     ~2672, `precioPorPersona || precioVenta`), el paso 5 (~2914-2924, ~2976, ~3043, ~3120, ~3150-3153) y la tarjeta
     "Presupuesto estimado" (~2044, ~2065-2070).
   - **Sí se ve:** el total de cada paquete y el precio por persona (paso 4, ~2731-2732), y el total y el precio por
     persona del resumen. Al sumar o sacar un servicio en la personalización se ve sólo la diferencia del total
     ("+$X" / "−$X"), nunca el precio del ítem en una lista.
   - El presupuesto que se genera al final (paso 6) y su PDF muestran **los servicios incluidos sin precio suelto**, con
     el total, el precio por persona, las cuotas y los regalos. Las cuentas no cambian: sólo qué se muestra.
   - El Club Uruguay sigue mostrando su precio y el 50% OFF (es un argumento de venta, no un ítem).
4. Con el interruptor en "mostrar" (por omisión), todo queda **exactamente como hoy**.
5. La presentación LED **no cambia** (tiene su propio ajuste `showPriceBreakdown`).

## Bloque 4 — Paquetes armados por tipo de fiesta (pre-armado; el dueño los edita después)
**Arreglo primero:** `isPackageApplicableToEventType` (`src/types/armado-rapido.ts` ~103) compara con `includes`, así que
un paquete marcado "Cumpleaños" **también aparece en "Cumpleaños infantil"**. Que compare el tipo exacto (normalizado),
con una función nueva exportada `mismoTipoDeEvento(a, b)` que use también el simulador;
"15 años", "XV años" y "Quince" son el mismo tipo, y "Evento empresarial" y "Evento corporativo" también.

**Después**, en el panel de paquetes de Ajustes, un botón **"Cargar paquetes sugeridos por tipo de fiesta"**. Arma
**tres paquetes por tipo** (Básico, Intermedio —recomendado— y Premium) para los cinco tipos del simulador (Cumpleaños,
Cumpleaños infantil, 15 años, Boda, Evento empresarial), **partiendo de los tres paquetes generales que el dueño ya tiene
cargados** (Básico / Intermedio / Premium: se los reconoce por el nombre; si no están, se usan los de
`src/data/armado-rapido-config.json`). Cada paquete nuevo lleva `tiposDeEventoAplicables: [<tipo>]` y el nombre
"Básico — 15 años", etc. Las reglas, por id del catálogo (`src/data/servicios-empresa.json`):

| Tipo | Se saca de los tres | Se suma |
|---|---|---|
| **Boda** | — | Intermedio y Premium: `serv_foto_civil`. Premium además: `serv_filmacion_civil`, `serv_foto_iglesia`, `serv_filmacion_iglesia`. |
| **15 años** | — (el cuadro de firmas queda) | Intermedio y Premium: `serv_foto_pintada`. Premium además: `serv_filmacion_pintada`. |
| **Cumpleaños** | `serv_cuadro_firmas` | — |
| **Cumpleaños infantil** | `serv_cuadro_firmas`, `serv_barra_tragos`, `serv_fuegos_frios` y el de fuegos fríos de 4 disparos | Intermedio: `serv_candy_bar_tematico` (en Premium ya está). |
| **Evento empresarial** | `serv_cuadro_firmas`, `serv_torta_principal`, `serv_video_vida_regalo`, `serv_candy_bar_tematico`, `serv_lluvia_burbujas` | Intermedio y Premium: `serv_banner` (si no está). |

Reglas del botón:
- **No borra ni cambia nada de lo que existe.** Si ya hay un paquete con el mismo nombre y tipo, no lo duplica.
- Los tres generales que ya existen quedan, marcados con `tiposDeEventoAplicables: ['Otro']`, para que el cliente no
  vea seis paquetes. Se avisa en pantalla antes de guardar ("Los tres paquetes generales quedan para 'Otro'").
- Se guarda con `saveArmadoRapidoConfig`, como el resto del panel. El dueño después los edita con lo que ya existe.
- El simulador, con el tipo elegido en el paso de datos, muestra sólo los de ese tipo; si un tipo no tiene ninguno,
  muestra los generales (que nunca quede sin paquetes). Sumá "Otro" al selector de tipo del simulador (~2468).
- Ningún servicio se inventa: si un id de la tabla no está en el catálogo del dueño, se saltea y se avisa cuál.

## Lo que NO hay que hacer
- No sacar el reloj, el 10% ni el texto de los 30 días (~1919, ~2193, ~3245).
- No cambiar cómo se calcula ningún precio, descuento ni ajuste anual: esta orden cambia **qué se ve**, no las cuentas.
- No borrar el enlace a Sofía ni el video de ayuda (`VideoDeAyuda`).
- No escribir a mano la cantidad de regalos ni las cifras.
- No tocar la presentación LED (va en la orden 344).

## Qué tiene que comprobar la prueba
- `tests/e2e/el-simulador-vende-antes-del-precio.spec.ts` (en celular y escritorio): la bienvenida tiene **un solo**
  botón de acción visible arriba ("Armar mi presupuesto gratis"), el texto "2 minutos", la franja "+200", las seis
  tarjetas de miedos; no hay ningún botón `bg-indigo`; el botón lleva directo a los datos; con
  `prefers-reduced-motion: reduce` la pantalla no anima.
- `tests/e2e/el-simulador-esconde-precios-sueltos.spec.ts`: con `mostrarPrecios: false`, en los pasos de servicios no
  aparece ningún "$" junto a un servicio suelto, sí el total del paquete y el precio por persona; la vista pública del
  presupuesto generado y su PDF tampoco muestran precios sueltos; el mismo presupuesto pasado a `'Aceptado'` sí los
  muestra. Con `true`, todo como hoy. Y actualizá `tests/e2e/orden-331-y-332.spec.ts` (hoy espera "Armá tu presupuesto"
  y "Paso 1 de 5") a la bienvenida nueva.
- `src/__tests__/los-paquetes-por-tipo-de-fiesta.test.ts`: un paquete de "Cumpleaños" **no** aplica a "Cumpleaños
  infantil"; "XV años" aplica a "15 años"; el armado sugerido de 15 años no trae `serv_foto_civil`, el de infantil no
  trae `serv_cuadro_firmas` ni `serv_barra_tragos`, el de boda premium trae `serv_filmacion_civil`; el botón no borra
  ni duplica paquetes existentes (correrlo dos veces da lo mismo).

## Barrido en toda la app
Forma del informe: un filtro por tipo de fiesta que compara con `includes` y mezcla tipos. Buscá en `src/` toda
comparación de tipo de evento con `includes(` (`rg -n "includes\\(.*(tipo|eventType|tipoEvento)" src`) y que cada una
use la comparación exacta nueva (exportala de `armado-rapido.ts`). Listá lo que encontraste en la propuesta.

```comprobar
usa: Armar mi presupuesto gratis en src/app/simulador-de-presupuesto/page.tsx
usa: 2 minutos en src/app/simulador-de-presupuesto/page.tsx
no-usa: bg-indigo-700 en src/app/simulador-de-presupuesto/page.tsx
usa: mostrarPrecios en src/app/simulador-de-presupuesto/page.tsx
usa: mostrarPrecios en src/components/settings/panels/budget-display.tsx
usa: mostrarPrecios en src/app/(app)/presupuestos/[id]/ver/page.tsx
usa: mismoTipoDeEvento en src/types/armado-rapido.ts
usa: testimonios en src/app/actions/public-simulator-bootstrap.ts
usa: Cargar paquetes sugeridos por tipo de fiesta en src/components/settings/panels/budget-display.tsx
usa: framer-motion en src/app/simulador-de-presupuesto/page.tsx
prueba: tests/e2e/el-simulador-vende-antes-del-precio.spec.ts
prueba: tests/e2e/el-simulador-esconde-precios-sueltos.spec.ts
prueba: src/__tests__/los-paquetes-por-tipo-de-fiesta.test.ts
```
