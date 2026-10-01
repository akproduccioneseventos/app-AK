# Acá quedé

**30 de septiembre de 2026.** Todo lo pendiente está en la **orden 100**, esperando a Gemini.

## Espera a Gemini (una sola propuesta)

- **Orden 100** (`docs/ordenes/100-segunda-devolucion-96-98.md`), arrancando de la rama
  **`claude/verificar-1246`** (tiene su entrega 96-99 más dos arreglos de Claude):
  - 7 pruebas de navegador de su entrega que no pasan (simulador, portada, demo de barra, orden
    de evento, reunión) y una prueba que ensucia `empleados.json`;
  - **la medición de Google y Meta recibe las llaves de invitados y portales** (Codex): sólo se mide
    en páginas de venta, con dirección limpia;
  - el asistente interno pierde conversaciones con dos guardados a la vez, y puede completar una
    tarea distinta de la pedida (Codex).
- Tiene que correr `npm run "publicar?"` completo antes de avisar.

## Cómo se fusiona (error 30)

- La puerta anota el commit aprobado en `.ak-puerta-verde.json`; la fusión sin `expectedHeadSha`
  igual a ese commit la frena `scripts/antes-de-fusionar.mjs`. Nunca fusionar en la misma tanda
  en que se abre la propuesta.
- La entrega de Gemini #1243 se fusionó por error y se volvió atrás (#1245): por eso su trabajo
  vive en `claude/verificar-1246`, no en su rama vieja.

## Espera al dueño

- Integraciones reales y ensayo físico: recién cuando Codex no vea más errores (no mencionarlos).

## Trampas

- Codex no puede abrir la app en su máquina: lo que necesite correr, se corre acá.
- Con la máquina cargada fallan pruebas al azar; pasan solas con `npm run otravez`.
- Apagar procesos por número o nombre exacto, nunca `pkill -f` (error 20).
