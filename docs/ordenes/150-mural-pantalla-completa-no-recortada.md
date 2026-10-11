# Orden150 - Mural que dice cargado pero no pinta su contenido

NO CONTRASTADO CON LA TANDA DE PROGRAMACION LOCAL NO SUBIDA.

Gemini corrige estilos/consumidor; Claude compila. Codex aporta evidencia.
Una tanda con las ordenes pendientes, no otra PR por cada hallazgo. No cambiar
moderacion, permisos, ventas ni esconder entretenimientos por este arreglo.

Area: entretenimiento / pantalla publica de la fiesta.
Fuente ejecutada y main remoto: `755f0707d55a09dbc0641f65e2d56c2e7ac77c60`.
PR abierta accesible1288 solo QA; no otra entrega correctiva subida al contrastar.
Clasificacion: **reproducido en fuente main aislada**, NO incidencia publicada
verificada en Hosting. Antes de programar contrastar la rama local real.

## VIS98-MURAL P1 - El contenido se recorta en PC y celular

Ruta real: `/evento/muro-en-vivo/<fiesta-ficticia>`, sin cookie del equipo.
Fiesta propia habilitada, pantalla forzada a mural, ninguna publicacion.
HTTP200, peticiones reales a acciones/Firestore demo; sin respuestas de app
simuladas. Tras cargar, esperar4s y otros4s mantiene el fallo en ambos viewports.
No fue un instante de animacion ni una cuenta/proveedor externo caido.

- PC1280x720 y movil412x839: panel principal `relative flex-1` mide0px de alto.
- `live-wall-empty` tiene caja80px por su padding, pero su padre tiene0 y
  overflow:hidden: mensaje/titulo recortados. El DOM SI contiene el texto.
- Titulo no recibe el punto de su centro (`elementFromPoint` devuelveHTML,
  no titulo/descendiente); captura muestra solo cabecera/redes y fondo.
- Control causal en navegadorQA: cambiar SOLO position del mismo
  `.ak-live-stage` a fixed restaura area540px PC/659px movil y titulo pintado.
  Mismos datos, ruta, navegador y resto de CSS. No se parcheo app/repositorio.
- Dos negativos iniciales y dos repeticiones con control positivo causal;
  UNA causa, NO cuatro defectos. Raw98-visual-primer/control + capturas.

## Causa y archivos reales en el SHA

`src/app/ak-public-experience.css:260` aplica
`.ak-red-premium-live > * { position: relative; z-index: 1; }`.
Tiene mayor especificidad que la utilidad `.fixed`: el root del mural
declarado fixed/inset-0 pasa a computed position:relative/alto180 en PC.
Su area flex central colapsa. No alcanza agregar otra clase Tailwind.

Conexiones verificadas:
- `src/app/layout.tsx` importa esa hoja.
- `AkRedPremiumSurface` en `src/components/brand/ak-red-premium-surface.tsx`
  pone mode live => clase ak-red-premium-live.
- `EventoMuroEnVivoLayout` en `src/app/evento/muro-en-vivo/layout.tsx`
  envuelve esta pantalla con ese componente/mode.
- `MuroEnVivoPage` / `EmptyWallState` estan en
  `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` (root518, contenido570).

Corregir el alcance/precedencia del estilo para que la capa de marca NO
cambie la posicion estructural fixed/absolute/sticky de sus consumidores.
Mantener las capas/fondo intencionales; no quitar el sistema visual entero
ni extender un !important indiscriminado. Revisar consumidores directos
afectados por esa regla; NO declarar que todos fallan sin reproducirlos.

## Aceptacion y metodo para Claude

No cerrar por `toBeVisible` solamente: en este defecto PASA aunque ningun
texto se pinte. Comprobar dimensiones/pintura/recorte y captura estabilizada.
El control con position sobrescrita sirve para explicar la causa, NO para
aprobar el producto original. La prueba permanente no debe inyectar el arreglo.

- PC/movil y pantalla horizontal: escena ocupa viewport entre bandas;
  titulo, mensaje y QR visibles sin quedar cortados ni tapados.
- Mural vacio real: instrucciones pintadas; sin falsas fotos ni "cargando" eterno.
- Foto aprobada de prueba: imagen real visible/pixeles; pendiente excluida.
- Reintento/rotacion/teclado/pantalla completa conservan controles/layout.
- Otros mode live tocados por el ajuste: validar posicion/overlays relacionados.

Solo el vacio y control causal se ejecutaron aqui. Fotos aprobadas, QR y otras
diapositivas son criterios correctivos PENDIENTES, no pruebas ya aprobadas.
No fabricar 0errores/14areaslimpias ni reabrir moderacion144 (ya pasa98).
Prueba permanente propuesta PENDIENTE: tests/e2e/mural-geometria-visible.spec.ts.

```comprobar
archivo: src/app/ak-public-experience.css
archivo: src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
usa: AkRedPremiumSurface en src/app/evento/muro-en-vivo/layout.tsx
usa: EmptyWallState en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
prueba: docs/evidencias/98-mural-visual.spec.ts
```
