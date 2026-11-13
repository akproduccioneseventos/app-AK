# Orden 291 — Informe del auditor: la IA después del pago, y cobertura (12/11/2026)

**Para Gemini.** Va **en la misma entrega que las 284 a 290** (tu rama `gemini/ordenes-282-283-entrega-completa`).
**Una sola propuesta, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`, preguntas 88 a 97.

## Lo que NO se toca

- El WhatsApp que contesta solo a quien llega de un anuncio (decisión del dueño).
- "Poner al día" con las 7 fiestas pasadas con saldo: es una lista para que una persona marque lo cobrado, a propósito.
- `/fiestas/nueva/proveedores-portal` sin fiesta dice "Abrí este módulo desde una fiesta": está bien.

## Barrido en toda la app (Claude, 12/11/2026)

- **IA que cae al texto de respaldo sin avisar:** `src/app/actions/simulador-copilot.ts` ~451 (Sofía, "modo asistente
  básico") y los `catch` de `src/app/actions/asistente-virtual.ts` devuelven un texto fijo y nadie del equipo se entera.
  Mismo patrón en el resto de `src/ai/flows/` con `generateWithGeminiFallback`: se resuelve de raíz en el bloque 2.
- **El auditor no puede probar la IA:** `registrarConsumoIA` y `reservarConsumoIA` (`src/lib/ai/consumo-servidor.ts` ~85 y
  ~112) empiezan con `exigirQueSePuedaGuardar()`, que tira error con sesión de auditor; el chat cae al respaldo.
- **Lo que la IA le dice al cliente sobre qué incluye un paquete** sale del modelo, no de los datos: Sofía dijo que los
  tres paquetes traen discoteca y pantallas LED. Sólo Sofía enumera paquetes; el asistente del portal lee la fiesta.
- **Tareas que dicen "corrió" sin haber hecho nada:** el blog figura corrido hoy y su última nota es del 25/06
  (`src/lib/automatico/al-entrar-a-la-app.ts` ~192-222: sólo falla si `seoError`).

## Bloque 1 — Sofía no inventa qué trae cada paquete (P1, lo ve el cliente)

En `src/app/actions/simulador-copilot.ts`, ya se arma `paquetesCatalog` (~276) con `serviciosIncluidos` de cada paquete.
- Una función exportada `detalleDePaquetes(paquetesCatalog)` en `src/lib/simulador/detalle-de-paquetes.ts` que arma el
  texto "Básico: … · Intermedio: … · Premium: …" **sólo** con los nombres de `serviciosIncluidos` (los de regalo con
  "(de regalo)").
- Si el mensaje del cliente pregunta por paquetes o por qué incluye (`/paquete|incluye|trae|diferencia/i`), la respuesta
  lleva ese detalle armado por la función **debajo** del texto de la IA, y la instrucción a la IA dice: "No enumeres qué
  incluye cada paquete: el detalle va aparte".
- En las instrucciones de Sofía (`src/types/copilot.ts`), sacá la frase de ejemplo "te transforman la pista por completo,
  bo" (la repetía textual).

## Bloque 2 — Cuando una IA cae al respaldo, el equipo se entera (P2)

- En `src/ai/genkit.ts`, `generateWithGeminiFallback`: cuando termina sin respuesta del modelo (todas las opciones
  fallaron), anotar con una función nueva `anotarFalloIA(funcion, motivo)` en `src/lib/ai/consumo-servidor.ts`
  (`fallos[AAAA-MM-DD][funcion] = { cantidad, ultimoMotivo, ultimaVez }`). Lo mismo en el `catch` de Sofía (~451) y de
  `asistente-virtual.ts`.
- En la pantalla de Ajustes → Asistente IA, una tarjeta "Respuestas de respaldo hoy": por función, cuántas y el último
  motivo. Si hoy hubo más de 5 de una misma función, aviso al dueño con `avisarAlDuenio` una vez por día.

## Bloque 3 — El auditor puede probar la IA sin guardar nada (YA LO HIZO CLAUDE, 13/11/2026: no se toca)

`registrarConsumoIA` y `reservarConsumoIA` ya no escriben ni tiran error con sesión de auditor (`esSesionDeSoloLectura`).
Lo único tuyo acá: que `anotarFalloIA` (bloque 2) tampoco escriba con auditor, usando la misma función.

## Bloque 4 — El blog no dice "corrió" sin nota nueva (P2)

En `src/lib/automatico/al-entrar-a-la-app.ts` ~192: si tocaba publicar (pasaron más de 48 h de la última nota) y después de
`runMarketingAutomation` no hay una nota nueva en `blog-posts.json`, tirar error con el motivo que devuelve (`res.seoError`,
`res.motivo`, o "no se publicó ninguna nota"). Así "Tareas automáticas" muestra el fallo (orden 288, bloque 5).

## Bloque 5 — El Encargado General: el error de los 40 segundos (P2)

`src/components/multiagent/multiagent-widget.tsx` ~724: cualquier error (también un corte por tiempo del servidor) dice
"No llegó la confirmación. El pedido puede haberse guardado". Medí cuánto tarda `multiagent-flow` con una pregunta
abierta; si el corte es por tiempo, que la pantalla diga "Tardó demasiado: no se hizo ninguna acción" cuando el pedido no
llamó ninguna herramienta (el servidor lo sabe: devolvé `accionesEjecutadas: []` antes de cortar), y deje el texto de
ahora sólo cuando sí había una acción en curso.

## Bloque 6 — Detalles de cobertura

- `/admin/carga-historicos`: sumá el aviso de auditor que muestran las demás pantallas que guardan.
- `/eventos` mostró 0 fiestas a un auditor: comprobalo; si es una lectura que falló, que diga "No se pudo leer la lista"
  en vez de 0 (pregunta 3 del método).
- Las tres tarjetas de marketing que llevan a `/empresa/redes-sociales` entran en la reorganización de la orden 284: una
  sola tarjeta.

## Pruebas

- `src/__tests__/sofia-no-inventa-los-paquetes.test.ts`: con un catálogo donde Básico trae sólo "Decoración" e
  "Iluminación", `detalleDePaquetes` no menciona "discoteca" en Básico; y una pregunta "¿qué incluye cada paquete?" con el
  modelo simulado diciendo "todos traen discoteca" devuelve también el detalle armado con los datos.
- `src/__tests__/la-ia-que-cae-al-respaldo-avisa.test.ts`: con el modelo simulado fallando, `anotarFalloIA` suma 1; al
  sexto fallo del día se llama `avisarAlDuenio` una vez.
- `src/__tests__/el-auditor-prueba-la-ia-sin-guardar.test.ts`: con sesión de auditor, `registrarConsumoIA` no escribe y no
  tira error; `reservarConsumoIA` devuelve una reserva y no escribe.
- `src/__tests__/el-blog-no-dice-que-corrio-sin-nota.test.ts`: última nota de hace 5 días y `runMarketingAutomation` sin
  nota nueva → la tarea tira error con motivo.

```comprobar
archivo: src/lib/simulador/detalle-de-paquetes.ts
usa: detalleDePaquetes en src/app/actions/simulador-copilot.ts
no-usa: te transforman la pista por completo en src/types/copilot.ts
usa: anotarFalloIA en src/ai/genkit.ts
usa: anotarFalloIA en src/app/actions/simulador-copilot.ts
usa: anotarFalloIA en src/app/actions/asistente-virtual.ts
prueba: src/__tests__/sofia-no-inventa-los-paquetes.test.ts
prueba: src/__tests__/la-ia-que-cae-al-respaldo-avisa.test.ts
prueba: src/__tests__/el-auditor-prueba-la-ia-sin-guardar.test.ts
prueba: src/__tests__/el-blog-no-dice-que-corrio-sin-nota.test.ts
```
