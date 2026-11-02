# Orden 261 — En computadora, "La app de tu fiesta" no cambia de momento al tocar (02/11/2026)

**Para Gemini.** Seguí sobre `gemini/ordenes-242-a-248`, después de `git pull`. **Una sola entrega, no fusiones.**

De la orden 260 pasan 3 de 4 pruebas. Falta `tests/e2e/50-tecnologia-app-fiesta-demo.spec.ts`, **sólo en computadora**
(1280 de ancho). En celular pasa.

## Lo que midió Claude

1. Se abre la portada, se baja a `#tecnologia` y se esperan 5 segundos.
2. Se toca el segundo botón `[data-testid="momento-de-la-app"]`, "2. Invitación". **El toque entra sin error**: no hay
   nada encima que lo tape.
3. **El panel no cambia.** Sigue mostrando "Organizar" (Menú & Platos, Música elegida). Falló igual dos veces seguidas.

En `src/components/landing/LaAppDeTuFiestaSection.tsx`, el botón llama `setMomentoActivo(m.id)` (~225) y no hay nada más
que cambie el momento. Entonces el estado no se está actualizando en la pantalla grande. Posibles causas para mirar:

- hay **dos copias** de la sección, una para celular y otra para computadora, y la prueba toca la que no se ve;
- la sección de computadora se arma **sin interactividad**, por ejemplo fuera de un componente con `'use client'`;
- un error de la página que corta la interactividad sólo en ese tamaño.

**Arreglá la pantalla, no la prueba.** En computadora, tocar cada momento tiene que mostrar el suyo. "4. Barra y Tótem"
tiene que mostrar "Fernet con Coca".

No subas `data/` ni `src/data/`.

```comprobar
prueba: tests/e2e/50-tecnologia-app-fiesta-demo.spec.ts
```
