# Orden 172: despejar el encabezado de feeds en el panel social movil

**Estado:** superposicion reproducida; correccion y revalidacion pendientes.
**Prioridad:** P2, el acceso fijo tapa parte de una columna de datos.
**Base auditada:** app `d10f332a17241de5a4705a560336585853073a76`, build QA aislado `a635b27071ecea22092eba2a285892c84c6f9d08`; `src` coincide con main `9aa64f991f5ddceefa8d278a3f298be861eb10bb`.

## Problema observado

En `/empresa/red-social-eventos`, a 390 x 844 px, `ModuleNavigationDock` queda fijo abajo a la izquierda y cubre el encabezado `Evento` de la tabla `Feeds de Eventos` al cargar arriba de la pagina. Medidas: dock `{left:12,right:114,top:774,bottom:828}`; encabezado `{left:64.03,right:148.62,top:746.64,bottom:803.13}`; interseccion aproximada de 49.97 x 29.13 px (1455 px2). El documento no tiene desborde horizontal (`scrollWidth - clientWidth = 0`); por eso la revision previa de ancho no detectaba el obstaculo visual.

La captura `docs/evidencias/133-mobile-social-overlap-390.png` muestra el dock superpuesto al titulo de columna. La ruta carga (HTTP 200) y muestra el panel; no es un problema de datos vacios.

## Criterio de aceptacion

En 390 x 844 y 412 x 915, el dock fijo no debe cubrir encabezados, filas, controles ni acciones del panel en la posicion inicial ni al desplazar. Mantener accesibles los botones Volver y Panel, sin ocultar columnas ni forzar desplazamiento horizontal como remedio. Confirmar tambien escritorio.

## Contraste con otras tandas

El ancho movil ya se habia medido con un barrido general; ese barrido solo verificaba `scrollWidth` y no detectaba el solapamiento. No se encontro una prueba anterior de interseccion entre el dock y el encabezado de esta tabla. **NO CONTRASTADO CON LA TANDA PRIVADA ACTIVA DE CLAUDE/GEMINI**: comprobar sus HEAD/diffs antes de programar.

## Comprobacion

```comprobar
archivo: src/components/module-navigation-dock.tsx
usa: ModuleNavigationDock en src/components/app-shell.tsx; la tabla Feeds de Eventos vive en src/app/(app)/empresa/red-social-eventos/page.tsx
prueba: tests/e2e/133-mobile-route-latency.spec.ts (reproduccion 390 x 844; asercion de area de solapamiento debe pasar tras corregir)
evidencia: docs/evidencias/133-mobile-social-overlap-390.png y docs/evidencias/133-contrato-mobile-layout.md
```
