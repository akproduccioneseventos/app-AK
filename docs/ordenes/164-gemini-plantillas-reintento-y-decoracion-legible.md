# Orden164 - Gemini: reintento de plantilla y boton de decoracion legible

**NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.** No se conoce su HEAD.
Antes de programar, comparar esta evidencia con la entrega activa y omitir lo
ya corregido alli. Gemini programa; Claude valida el conjunto y fusiona.
Una sola tanda, no una PR por defecto. No cambiar permisos, reglas comerciales,
plantillas base, posibilidades de crear varias plantillas ni tema global.

## Base comprobada

- Main remoto: `4b6d66201cf9828f7a5328a8640e82f8eb291f5a`.
- PR1301 abierta: `27d024e3a555eb1f7763aab16051220d5740a922`.
- App compilada y usada: `b520f7cee28546634e1c87391efd7a80e1a40f48`.
- Los tres archivos de los dos hallazgos tienen blobs identicos en main y esa
  fuente: accion `2990ba436d5eaa0277bfc23d4f3a3001f735e2a4`, pantalla plantillas
  `c9894ea4025d0fa2c7c117ed8c447c10878f2626`, decoracion
  `c73a29aa0c9945510b077b32158f78b66ea8adf0`.
- Es fallo reproducido tambien en la tanda, NO solo una lectura de main.
  Produccion no se modifico ni se afirma el SHA actualmente servido por Hosting.

## 1. P2 DEFECT - Reintentar crear una plantilla guarda dos copias

Ruta: `/settings/templates/invitaciones`.
Consumidor real: `InvitationTemplatesPage/handleCreateNewTemplate` en
`src/app/(app)/settings/templates/invitaciones/page.tsx`; llama a
`saveInvitationTemplate` en `src/app/actions/invitacion-digital-templates.ts`.
La copia `handleDuplicateTemplate` YA tiene intento; NO reencomendar esa copia.

Pasos ejecutados en Chromium PC y Pixel7 emulado, con accion REAL y Firestore
demo REAL: pulsar Crear Nueva Plantilla; esperar HTTP200 del servidor y un
documento guardado; cortar SOLO esa respuesta; se muestra error; pulsar de
nuevo. El payload de ambas peticiones es identico. Quedan dos IDs distintos,
ambos visibles despues de recargar. Esperado: un documento del mismo intento.
Control: dos creaciones deliberadas y confirmadas conservan dos documentos.

Corregir identidad estable por intento antes del primer envio, conservada ante
respuesta incierta y recarga, con operacion atomica en servidor ligada al actor
y carga. Reutilizar los patrones actuales de intentos; no crear otra capa
general. El resultado repetido debe devolver el mismo ID. No prometer que no
se guardo cuando se perdio la respuesta. Un exito confirmado termina ese
intento: la siguiente creacion deliberada puede ser identica y debe crear otra.
NO deduplicar por nombre, telefono, contenido ni fecha. Revisar choque temporal
de `tpl_${Date.now()}` sin perder creaciones legitimas ni pisar datos ajenos.

Aceptacion pendiente del arreglo: respuesta perdida despues de commit + retry,
recarga + mismo intento, dos envios concurrentes del mismo intento, dos intentos
deliberados con la misma carga y rechazo por actor/carga incompatibles. Usar
solo datos ficticios. No declarar corregido por agregar un parametro sin
engancharlo al boton real. No modificar condiciones comerciales.

Evidencia: `docs/evidencias/126-plantillas-native.json`, script homonimo `.mjs`
y capturas PC/mobile. Cuatro escenarios: dos controles PASS, dos FAIL reales.
La sonda Jest del ayudante NO dio resultado y se archivo como texto, NO como
prueba de fallo ni como test aprobado.

## 2. P2 DEFECT - Texto de Quiero cambiar algo casi invisible

Ruta: `/portal/qa126-fiesta/decoracion` (ID ficticio).
Consumidor: `ClientDecoracionPage`,
`src/app/portal/[fiestaId]/decoracion/page.tsx`, boton que abre
`showFeedbackForm` antes de `handleOpinion(false)`.

Tema claro por defecto, fondo del boton RGB252/252/252 y texto226/232/240;
contraste REAL `1.2016041726524667` a12px, frente al umbral de prueba4.5.
Mismo resultado en PC y Pixel7. Captura confirma el texto casi blanco.
El Textarea y el guardado NO se marcaron rotos: sugerencia ficticia persistio
en SDK y reaparecio tras recarga en ambos dispositivos.

Corregir colores del consumidor para texto legible en su superficie oscura,
incluidos normal/hover/focus/disabled y temas claro/oscuro. Revisar otros
outline de ESA pantalla con el mismo patron, sin dar por reproducido un defecto
de otro boton solo por compartir clases. No cambiar Button/Input globales ni
redisenar servicios, rutas o contenido de venta. Mantener accion y guardado.

Aceptacion pendiente del arreglo: captura y color computado antes del hover,
normal y foco de teclado, contraste>=4.5, PC/mobile, abrir formulario, escribir,
enviar, comprobar SDK y recuperar tras recarga. Nuestra sesion era una sesion
local ficticia del organizador: NO certifica autenticacion real de cliente.

Evidencia: `docs/evidencias/126-decoracion-native.json`, script homonimo `.mjs`
y dos capturas. Dos fallos de contraste y dos controles de persistencia PASS.

## Validacion y entrega

- Ejecutar sondas focalizadas antes/despues; conservar expectativa un intento
  = un ID. Ajustar solamente gate de SHA/build al parche REAL y su compilacion;
  no usar el buildb520 para validar codigo nuevo ni maquillar el esperado.
- Claude congela la fuente y valida el conjunto una vez, sin repetir la amplia
 759suites/4765tests de b520 como si validara el parche nuevo.
- Registrar SHA, entorno, resultado y limites en YA/ESTADO y evidencias.
- No tocar datos reales, OAuth, cuentas, cargos, mensajes ni hardware.
- Orden163 de dependencias sigue separada: no aplicar overrides mayores a ciegas.
- Esta orden NO dice que toda la app este auditada ni libre de errores.

```comprobar
archivo: src/app/actions/invitacion-digital-templates.ts
usa: saveInvitationTemplate en src/app/(app)/settings/templates/invitaciones/page.tsx
prueba: src/__tests__/plantilla-nueva-reintento-no-duplica.test.ts
archivo: src/app/portal/[fiestaId]/decoracion/page.tsx
usa: ClientDecoracionPage/showFeedbackForm/handleOpinion en src/app/portal/[fiestaId]/decoracion/page.tsx
prueba: src/__tests__/decoracion-quiero-cambiar-algo-legible.test.tsx
```
