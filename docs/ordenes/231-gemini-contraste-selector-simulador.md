# 231 - Gemini: texto legible en el selector publico de simuladores

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

## Fuente y reproduccion

Fuente978af7d65a60bd287f3ee3cc05037a29566074f4, build486, ruta `/simulador`.
La fuente final f8f7cf34e8778de784b20e2654058fd722b2a2ec conserva pagina
y estilos: su delta solo modifica CUATRO fuentes de medios. No se anuncia
otra prueba visual en f8f7 por esa identidad; no es una orden duplicada.
Navegador Pixel7, captura NATIVA520/521; no imagen de maqueta.
Evidencia extraida sin alterar bytes: `docs/evidencias/546-simulador-movil.png`.
La pagina abre200 y no desborda horizontalmente: esos PASS NO implican que
su contenido se lea bien. Este defecto se encontro mirando la captura real.

## Defecto P2 comprobado visualmente

Debajo del hero, el titulo "Elegi la experiencia para cotizar tu fiesta"
esta blanco sobre un fondo practicamente blanco. El texto existe pero cuesta
leerlo. El subtitulo gris tambien necesita contraste suficiente en ese fondo.

Consumidor REAL en este SHA: `src/app/simulador/page.tsx`, componente
`SimulatorHubPage`, seccion Main Options Grid, h2 con `text-white` en linea106
y subtitulo `text-slate-400` en107. El main declara `bg-slate-950` pero el
fondo EFECTIVO de ese bloque en navegador es claro. Investigar la cascada
real: no asumir que la clase de fondo declarada sea la que se renderiza.

## Correccion acotada

- Hacer compatibles fondo y texto de ESTE bloque publico, con contraste
  medido en el navegador:4.5:1 para texto normal y3:1 para titulo grande.
- Mantener el contraste del hero, tarjetas, barra y panel interno. No
  modificar globalmente todos los h2/CardTitle ni pintar todo el sitio oscuro.
- Conservar rutas, atribucion comercial, precios y las opciones existentes.
  No ocultar fotocabina,360 ni espejo tras desplegables si se toca la venta.
- Probar PC y celular con la misma hoja de estilos final. No aceptar solo
  presencia de `text-white`, existencia del nodo ni HTTP200 como resultado.

## Friccion aparte, no instruccion automatica de producto

En celular, la introduccion y las tres insignias ocupan casi toda la primera
pantalla antes de ver la eleccion de herramienta. Se propone acercar la
primera accion al comienzo. Es una propuesta comercial separada: no quitar
opciones, promociones ni contenido por decision de Codex.

Las capturas estaticas NO prueban presencia ni ausencia de animaciones.
Mantener separados preferencias de movimiento reducido del QA y experiencia
real; no aprobar movimiento por encontrar una clase o una animacion invisible.

Aceptacion PENDIENTE de programacion y prueba: captura legible en390x844
y1280x720, color efectivo/fondo rasterizado documentados, enlaces conservados,
sin regresion del hero ni desborde. Prueba siguiente PROPUESTA, aun no creada.

```comprobar
archivo: src/app/simulador/page.tsx
usa: SimulatorHubPage en src/app/simulador/page.tsx
prueba: tests/e2e/simulador-hub-contraste-real.spec.ts
```
