# 119 - Fecha y botones del portal del cliente

Responsable: Gemini (interfaz del portal); Claude compila y registra resultados.
Base: `main` / `feb90f4d40906029d6d31ba2e2abbed64461a2ad`, PR 1256 fusionada.
No habia PR abierta al contrastar. **NO CONTRASTADO CON LA TANDA** si hay cambios
locales de otra IA aun no publicados: comprobarlos antes de programar.
No tocar precios, cobros ni permisos; lo sensible va en la orden 118 a Claude.

## PORTAL01 / P2 - Una fiesta de hoy aparece concluida

Ruta usada en navegador: portal de cliente local de `ak_audit69_portal`, con
datos sinteticos y clave del entorno aislado. Ingreso aprobado. La cabecera dice
5 de octubre de 2026; antes del inicio 21:00, el cuerpo dice "Evento Concluido"
y "Resumen de Asistencia", en lugar de la situacion del dia del evento.

Archivo/simbolos reales: `src/app/portal-cliente/[id]/page.tsx`, calculos
`eventDate`, `isEventToday`, `isEventPast` alrededor de las lineas 567-572.
`new Date('2026-10-05')` representa medianoche UTC y `toDateString()` en Uruguay
lo convierte al 4/10. Tambien se usa `new Date(fechaEvento)` para el temporizador
anterior: revisar ese consumidor, sin inventar un cierre del evento.

Sonda ejecutada: `node docs/evidencias/69-sonda-fecha-portal.cjs`. Carga el calculo
real de la pagina y fija 5/10, 19:00 Uruguay: obtiene `isEventToday:false` y
`isEventPast:true`. Su salida exitosa demuestra el defecto, no su correccion.

Corregir con las utilidades de fecha del proyecto. La fecha de calendario del
evento debe interpretarse en Uruguay y no variar segun la zona del navegador.
Comprobar ayer, hoy antes/durante/despues, manana y cruce de medianoche 21:00-05:00.
Conservar la regla de cierre aprobada; si hace falta cambiarla, consultar al
propietario. No marcar terminado un evento que todavia no comenzo.

## PORTAL02 / P2 - WhatsApp tapa el asistente

Navegador de auditoria, ancho 660 px. Rectangulos DOM observados:

- Asistente: x=374, y=500, ancho=206, alto=56.
- WhatsApp: x=468, y=512, ancho=176, alto=44.
- Interseccion: 112 x 44 px. El rotulo y parte del boton del asistente quedan
  debajo del boton de ayuda; ambos usan `z-50` y `bottom-6`.

Consumidores reales: `AsistenteDelCliente` en
`src/app/portal-cliente/[id]/page.tsx:1411`; su boton esta en
`src/components/portal/AsistenteDelCliente.tsx:112`. El WhatsApp independiente
esta en la misma pagina, alrededor de la linea 1424. No es la observacion vieja
del CTA de la galeria: es otra pantalla y otros dos controles.

Mantener disponibles asistente y ayuda, sin superponerlos ni tapar contenido
accionable. Probar 360, 660 y 1280 px, teclado, apertura/cierre del chat y scroll.
No sustituir funcionalidades ni esconder ninguna sin aprobacion del propietario.

## Aceptacion pendiente

Crear o ampliar una prueba real que reproduzca primero estos dos defectos y
despues pase con el arreglo. Guardar SHA, entorno y resultados. No basta comprobar
que existen las palabras, funciones o botones: medir fechas y rectangulos y usar
los controles. Codex vuelve a revisar solo estos casos tras la entrega.

```comprobar
archivo: src/app/portal-cliente/[id]/page.tsx
usa: AsistenteDelCliente en src/app/portal-cliente/[id]/page.tsx
prueba: tests/e2e/portal-fecha-y-botones.spec.ts
```
