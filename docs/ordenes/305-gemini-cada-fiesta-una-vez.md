# Orden 305 — Cada fiesta se cuenta una vez, y los avisos dicen lo que es (13/11/2026)

**Para Gemini.** Va **en la misma propuesta que la 297 a 304** (la 1393). Antes de "terminé": `docs/ANTES-DE-ENTREGAR.md`.
Toca listas que suman plata (tablero, alertas de seña, flujo de caja): repasá el candado de la plata y la pregunta 37.
Sale de la auditoría de módulos restantes (13/11/2026).

## Lo que NO se toca

- No se borra ningún registro de la base. Sólo se deja de mostrar/contar la copia importada.
- Los borradores de Instagram no se publican solos si la red no está conectada; nada sale a clientes sin una persona.
- La conexión de Google la vuelve a hacer el dueño con su cuenta (botón "Conectar AK"); el despertador de afuera es la orden 278, bloque 1.

## Barrido en toda la app (Claude, 13/11/2026)

- **Dos registros por cliente:** cada fiesta importada existe como `fiesta_doc_<cliente>_<fecha>` (copia vieja, "Otro de…",
  0 invitados) y `fiesta_verified_<cliente>_<fecha>`. Ya existe `dedupeImportedEventCopies` en
  `src/lib/events/event-ordering.ts` (~12), con prueba en `event-ordering.test.ts`, pero **sólo la usa**
  `src/app/(app)/eventos/page.tsx`. Por eso Eventos Activos dice 22 y el Dashboard, Métricas, Calendario, Alertas, Muro Social,
  Recursos Multi-Evento y el generador de posteos dicen 59/60.
- **La fiesta DEMO** ("DEMO AK - XV Martina") entra en posteos, alertas y contadores (igual que la 301 bloque 6 y la 302).
- **Alertas:** "Falta seña" marcado URGENTE en fiestas ya realizadas; "[URGENTE_7_DIAS]" sobre saldos de hace 97 días; todas con la
  hora en que se abrió la pantalla.
- **Menú:** "Alergias y Dietas" (`/fiestas/nueva/alergias`) se queda cargando sin fiesta; "Portal de Proveedores" siempre da error de contexto.
- **Flujo de caja:** costos proyectados $0, "Eficiencia 100%", "Ratio 0.00", leyenda en inglés (complementa la 301, bloque 1).

## Bloque 1 — La copia importada no se cuenta dos veces (P1, plata)

Aplicar `dedupeImportedEventCopies` **en la lectura central** (`getFiestas` en `src/app/actions/fiesta/fiesta.actions.ts` ~228 y en
`leerFiestasCrudas` si la usan los tableros), no pantalla por pantalla. **Antes**, comprobar en la prueba que una copia `fiesta_doc_*`
con pagos, cuotas o seña cargados **no** se oculta: se muestra y se marca "revisar duplicado". Las dos fechas distintas (Lorena
Ferreira, Soraya Texeira) quedan como "revisar duplicado", no se elige una sola.
Prueba Jest: con un par doc+verified, el tablero, las alertas y el generador de posteos ven una fiesta; con pagos en la doc, ven las dos y la marca.

## Bloque 2 — La fiesta de demostración no genera nada (P1)

Excluir la DEMO del generador de posteos, de las alertas y de los contadores, con la misma marca que usa la fiesta de muestra del auditor (orden 299).

## Bloque 3 — Alertas con sentido (P2)

- Fiesta ya realizada con saldo: "Saldo por cobrar", no "Falta seña · URGENTE".
- La etiqueta de urgencia se calcula con los días reales; no "7 días" sobre 97.
- La alerta guarda la fecha en que se generó, no la de apertura de la pantalla.
- "Hay 1 alerta ya leída escondida" (concordancia) y sin ".." dobles.

## Bloque 4 — Menú y flujo de caja (P2)

- "Alergias y Dietas" y "Portal de Proveedores" desde el menú llevan a elegir la fiesta (como hace `/eventos`), nunca a una rueda sin fin.
- Flujo de caja: si no hay costos proyectados, decir "sin proyección de costos" en vez de $0; esconder "Eficiencia" y "Ratio" cuando no
  hay costos; leyenda en castellano (Ingresos, Egresos, Balance).
- Borradores de posteo: no se puede tocar "Sí, hacelo" si la red de destino no está conectada; el texto lleva "Qué noche".

## Pruebas

```comprobar
usa: dedupeImportedEventCopies en src/app/actions/fiesta/fiesta.actions.ts
prueba: src/__tests__/cada-fiesta-se-cuenta-una-vez.test.ts
prueba: tests/e2e/el-menu-lleva-a-elegir-fiesta.spec.ts
```
