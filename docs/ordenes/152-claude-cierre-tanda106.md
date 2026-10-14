# 152 - Claude: cierre de pendientes de la tanda106

## Destinatario y base

El dueno deja a Claude disponible para programar lo pendiente. Codex entrega
esta orden; escribirla NO inicia otra IA. No fusionar sin autorizacion.

- PR1288 abierta: rama codex/auditoria-97-ia-contexto-20261011.
- HEAD remoto contrastado antes de entregar:48829bfde9e419903944b60f8b4f26fe86dc1415.
- Main contrastado:99faf4eb061fa46341cfdde6f81b93b3bfb9c73c.
- Fuente de app corregida y compilada:8fa5b56a2833938541a657dcd15ef88130d24b0e.
- Harness posterior6c3d6971: cambia solo pruebas/registro, no app.

Leer ESTADO-ACTUAL.md, docs/YA-RESUELTO.md y106-validacion.json primero.
Antes de programar, actualizar referencias e identificar HEAD real de la tanda.
Si otra entrega ya lo corrige, validar lo existente; no volver a implementarlo.
Esta orden viaja dentro de PR1288; NO supone que ya esta en main o publicada.

## 1. Barra flotante y guardado: verificar antes de corregir

Clasificacion: FRICCION VISUAL OBSERVADA TAMBIEN EN CANDIDATO, no fallo de
guardado reproducido. No acreditado en publicado. Captura:
docs/evidencias/106-artifactos/106-3d-pre-camera-007.png.
La barra flotante cubre parte de Guardar como Presupuesto Formal en PC.
La tanda106 NO pulso ese boton ni certifica su flujo.

Ruta y simbolos comprobados en8fa:
src/app/(app)/empresa/configurador-reunion/page.tsx,
ConfiguradorReunionPage y handleSaveBudget; botones llaman handleSaveBudget
y este consume savePresupuesto desde src/app/actions/presupuestos.

En entorno aislado, comprobar hitbox con elementFromPoint, teclado y PC/movil.
Identificar el componente que realmente dibuja la barra antes de editarlo;
no asumir que es multiagent-widget por su nombre. Si hay bloqueo, impedir el
solapamiento conservando movimiento del widget, chat y controles accesibles.
Comprobar guardar una sola vez, error/reintento y destino del presupuesto con
datos ficticios, sin tocar los19presupuestos originales.
No cambiar importes, permisos, condiciones comerciales ni ocultar entretenimientos.
Si guardar funciona y el solapamiento no impide usarlo, registrarlo como friccion
de UX, no inventar un error de persistencia.

## 2. Dependencias: clasificar lo restante, no aplicar force

106 ya parchea busboy3.2.2 y source-map-js1.2.2; no repetir ese trabajo.
106-npm-audit.json deja27avisos GHSA unicos pendientes;91entradas agregadas
NO significan91errores de la app. Hay0critical/25high/65moderate/1low.

Determinar para cada aviso si alcanza una ruta real, si es solo herramienta
de build o si necesita un cambio mayor. Usar fuentes oficiales y preservar
los rangos/API, PWA y SDK existentes. No aceptar npm audit fix --force,
downgrades ciegos ni parches que solo borren la alerta.
Cambiar solo parches compatibles demostrables con regresion focalizada.
Lo no corregible de forma compatible queda registrado con riesgo/causa, no
se declara seguro porque el build pase. Codex conserva revision final sensible.

## 3. Evidencia y limites de cierre

Reutilizar resultados vigentes si la fuente de app sigue siendo8fa:
4focalizadas,692suites/4139Jest,tipos/acentos/build exit0 y12casos unicos
de navegador. No hay una sola corrida12/12:11aprobados en ronda general,
mas2camaras repetidas tras optimizar la sonda; timeout anterior conservado.
Si cambia app, validar el conjunto final una vez y registrar el nuevoSHA.

Actualizar YA-RESUELTO y ESTADO-ACTUAL en la misma tanda, con hechos y fallos.
No crear una PR por bloque ni tocar notificaciones locales ajenas.
No declarar toda la app sin errores: cuentas externas,19originales,hardware,
guardado y empaquetado/despliegue Firebase del mismoSHA siguen sin certificado.
Graphify local actualizado:13713nodos/42463relaciones/838comunidades; salida
ignorada por Git, no entregada como grafo remoto. Actualizar en la copia propia.

## Comprobacion pendiente de esta orden

La prueba indicada abajo es PROPUESTA: no existe ni se ejecuto en esta tanda.
No basta encontrar el archivo o un import: adjuntar el resultado observable.

```comprobar
archivo: src/app/(app)/empresa/configurador-reunion/page.tsx
usa: handleSaveBudget en src/app/(app)/empresa/configurador-reunion/page.tsx
prueba: src/__tests__/el-asistente-flotante-no-tapa-guardar.test.tsx
```
