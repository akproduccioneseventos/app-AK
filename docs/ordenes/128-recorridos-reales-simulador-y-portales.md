# 128. Corregir cuatro fallos comprobados en los recorridos reales

> **HECHA por Claude el 7 de octubre de 2026** (los cuatro bloques, en la misma propuesta que el
> traspaso). A: las variantes con mesa bufet salen de una sola función (`agregarVariantesBufet`)
> que usan la lectura pública y el guardado del servidor. B: la pantalla del presupuesto pide la
> ficha pública de la empresa y no tapa el presupuesto si falla un dato accesorio; distingue
> "no se pudo cargar" de "este enlace no abre". C: el portal cuenta personas con
> `contarPersonasDelPortal`, con la misma regla que el centro del equipo. D: la fecha de la
> fiesta va en `eventDate`; `followUpDate` queda sólo para citas reales (también en el alta
> manual). No se migraron registros viejos. Codex vuelve a probar sólo esto.

## Base y reparto

7 de octubre de 2026. Codex revisa; no programa estos cambios.

- Navegador: copia compilada de main `f790a002426aecb6598efa239fa948db57571752`,
  BUILD_ID `iZL-zBn4z4fNZ_IXFyUCN`, datos ficticios y proveedores sin credenciales.
- Destino contrastado: main `09051f80ee7722537a06c50c8eb7524b21ac11e8`.
- Tanda abierta al contrastar: PR 1266, `claude/app-debug-stabilize-m70e6z`,
  HEAD `8f4f6895a2150628271c4beef7c9b64f9a0d718f`. Su diff efectivo contra main
  es SOLO `ESTADO-ACTUAL.md`: no trae correcciones de estos cuatro fallos.
- Los archivos causales de A-D no cambiaron entre ambos main. El simulador cambió
  para corregir fotos; no cambió la validación de los menús virtuales.
- Claude: comida, catálogo/precios autorizados, permisos y compilación.
  Gemini: consumidores de pantalla, portal y CRM. Coordinar A y B con Claude.
- Antes de programar, volver a contrastar el HEAD de la tanda que esté abierta.
  No tocar datos reales, cambiar reglas comerciales ni fusionar sin el dueño.

Evidencia: `docs/evidencias/78-recorridos-reales-y-retest.md` y `78-resultados/`.
Las sondas reproducen fallos; que pasen NO significa que el fallo esté corregido.

## A. P1: el simulador ofrece platos que rechaza al guardar

Área: `comida` / `plata`. Clasificación: reproducido en main compilado, causa
presente en main de destino, sin corrección en la tanda abierta.

Reproducción en la pantalla, no sólo en una función:

1. Simulador común, Cumpleaños, 100 adultos, local propio, 23/1/2027.
2. Entradas SANDWICHES Y SALADITOS y SHOW DE PIZZAS; principal recomendado
   POLLO ARROLLADO CON MESA BUFET; paquete intermedio.
3. Pulsar "Ver Resumen y Propuesta": informa "Uno o mas servicios ya no estan
   disponibles. Actualiza el simulador." No llega al presupuesto descargable.
4. Cambiar sólo el principal a POLLO ARROLLADO C/ GUARNICIÓN: sí guarda,
   genera el PDF y el prospecto queda relacionado en el CRM.

Archivos y conexiones reales:

- `src/app/actions/menus-catering.ts`: `armarMenus`, líneas 136-172,
  agrega cuatro IDs `_virtual_buffet`; `getMenusPublicos`, línea 184, los ofrece.
- `src/lib/budget/public-simulator-persistence.ts`: `loadAuthoritativePricingData`,
  línea 117, lee menús crudos; `persistPublicSimulatorBudget`, línea 204,
  rechaza IDs no incluidos en ese catálogo, línea 242.
- `src/lib/simulator/catalog.ts`: `buildAuthoritativeSimulatorServices`, línea 34,
  no deriva las variantes que sí derivó la lectura pública.
- `src/app/simulador-de-presupuesto/page.tsx`: `SimuladorContent`, envío de
  `selectedServiceIds` en línea 949 y `generateBudgetAndLeadFromSimulator` en 957.
- La sonda con las funciones reales reproduce los cuatro IDs rechazados:
  `dish_main_18_virtual_buffet`, `dish_main_2_virtual_buffet`,
  `dish_main_17_virtual_buffet`, `dish_main_7_virtual_buffet`.

Corrección requerida: una derivación autorizada y compartida de las variantes,
usada al ofrecerlas Y al validar/recalcular del lado servidor. Mantener la
validación de IDs, recetas y precios del servidor. NO aceptar un ID o precio
arbitrario enviado por el navegador ni eliminar silenciosamente un plato elegido.
No decidir un cambio de precio/receta sin Claude y aprobación del dueño si cambia
el funcionamiento comercial. La sonda actual sólo prueba IDs, no acepta precios.

Aceptación: cada variante ofrecida guarda su propuesta, conserva la selección y
genera PDF/CRM; un ID inventado sigue rechazado. También probar el simulador IA
si consume el mismo catálogo. Prueba nueva propuesta: **PENDIENTE**,
`src/__tests__/simulador-variantes-buffet-autorizadas.test.ts`, más recorrido de
navegador con datos ficticios sobre el SHA final.

## B. P1: el enlace del PDF falla para el cliente sin sesión del equipo

Área: `plata` / `permisos`. Clasificación: reproducido en main compilado y sonda
causal en main de destino; sin corrección en la tanda abierta.

Reproducción:

1. Generar propuesta de control, descargar PDF de dos páginas.
2. Cerrar la sesión del organizador por su menú normal.
3. Abrir el enlace COMPLETO del PDF con `cliente=1` y su token correcto.
4. Aparece "Presupuesto no encontrado" / "eliminado o archivado", aunque el
   presupuesto sigue guardado y el organizador lo abre desde el CRM.
5. Servidor: `Sesion no autorizada.` La sonda verifica que el token ficticio del
   PDF sí corresponde al secreto fijo del entorno aislado.

Archivos reales:

- `src/app/(app)/presupuestos/[id]/ver/page.tsx`: `fetchPresupuestoAndSettings`,
  líneas 160-198, llama `getCompanyInfo()` dentro de `Promise.all` antes de
  asignar el presupuesto. El rechazo deja el estado de presupuesto vacío.
- `src/app/actions/settings.ts`: `getCompanyInfo`, línea 126, exige sesión;
  `getCompanyInfoPublica`, línea 148, ya ofrece la proyección pública sin cuentas
  bancarias. `getBudgetDisplaySettings` y `getInvoiceTemplateSettings` sí son
  públicos a propósito. NO aflojar la protección de `getCompanyInfo`.
- `src/app/actions/presupuestos.ts`: `getPresupuestoById`, línea 143, acepta
  token válido sin sesión del equipo; ese control se conserva.
- La pantalla presenta el vacío como "no encontrado" en línea 625 y oculta la
  causa de carga al cliente.

Corrección requerida: cargar sólo la proyección pública necesaria en el acceso
por token; conservar acceso interno autorizado donde corresponda. No publicar
cuentas bancarias ni datos privados para reparar una llamada incorrecta.
Distinguir carga fallida, token inválido y documento realmente inexistente sin
filtrar información privada. Validar también consumidores anónimos similares.

Aceptación: enlace original del PDF abre en navegador SIN sesión del equipo;
no ofrece editar, crear fiesta, aprobar, registrar cobros internos ni ajustes.
El token alterado y el acceso sin token siguen rechazados. Prueba nueva propuesta:
**PENDIENTE**, `tests/e2e/presupuesto-publico-sin-sesion.spec.ts`, y una regresión
del consumidor con la función pública real. La sonda actual no reemplaza ese E2E.

## C. P2: el portal del cliente cuenta filas y omite acompañantes

Área: `portal`. Clasificación: reproducido en la pantalla principal del cliente;
código sin cambios en main de destino ni en la tanda abierta.

Misma fiesta ficticia: organizador muestra 121 personas confirmadas; portal del
cliente muestra 61 y "0 / 61 invitados llegaron". Son 61 invitaciones con
acompañantes: en total 121 personas. También 19 invitaciones pendientes son 37
personas. No confundir "pendientes de llegar" con "pendientes de confirmar".

- `src/app/portal-cliente/[id]/page.tsx`, pantalla RAÍZ: filtros `confirmed`,
  `pending`, `checkedIn` en 562-569; consumidores `.length` en 780-819 y 1235.
- `src/app/(app)/fiestas/[id]/centro/page.tsx`: `contarPersonas`, línea 91,
  aplica `partySize` correctamente. Es una referencia existente, no otra función
  para copiar sin revisar las reglas de confirmación/check-in.
- NO es `portal-cliente/[id]/confirmar-invitados/page.tsx`: no rehacer esa pantalla.

Corrección requerida: misma unidad en confirmados, llegadas y porcentaje;
si se muestran filas, llamarlas "invitaciones", y mostrar personas para invitados
y acompañantes. Conservar la semántica aprobada del check-in de cada grupo.

Aceptación: casos con acompañantes, `partySize` ausente/inválido, rechazados y
llegadas parciales/grupales según la regla existente. Coincidencia cliente/equipo
tras actualizar. Prueba nueva propuesta: **PENDIENTE**,
`src/__tests__/portal-cliente-contadores-personas.test.ts`, más captura UI final.

## D. P2: la fecha de fiesta se transforma en una cita no reservada

Área: `fiesta` / ventas-CRM. Clasificación: reproducido en CRM y JSON ficticio;
causa sin cambios en main de destino ni en la tanda abierta.

El prospecto sólo eligió fecha de evento 23/1/2027, nunca reservó una entrevista.
Su tarjeta CRM dice "Cita: 23/1, 00:00hs". El registro guardado contiene esa fecha
en `followUpDate`, que también consume la agenda comercial.

- `src/lib/crm/public-lead-persistence.ts`: `buildLead`, línea 164,
  `followUpDate: existing?.followUpDate || input.eventDate`.
- `src/components/crm/CrmLeadCard.tsx`: etiqueta "Cita", línea 251.
- `src/app/actions/crm.ts`: `getCrmAgendaEntries`, líneas 187-197, usa ese campo.

Corrección requerida: conservar fecha de evento separada de cita/seguimiento
explícito. No borrar citas reales ni inventar una migración masiva basada sólo
en que coinciden las fechas; registros ambiguos requieren origen/evidencia.
No cambiar la regla del dueño: una persona puede generar varios presupuestos y
el teléfono sirve también para llamar, aunque no tenga correo.

Aceptación: un simulador sin entrevista no crea cita; cita real previa se
conserva; múltiples propuestas por mismo teléfono siguen disponibles con sus
fechas. Prueba nueva propuesta: **PENDIENTE**,
`src/__tests__/crm-fecha-evento-no-es-cita.test.ts` y recorrido CRM/agenda.

## No repetir y límites

- Foto buffet: corregida por PR 1265; retest de consumidor y fotos personalizadas
  pasa en `09051f80`. Falta foto REAL del dueño, no es fallo de programación.
- Contador Instagram con transacción repetida: corregido por PR 1263; sonda con
  mutador real devuelve un vídeo guardado/uno informado, no dos. No reimplementar.
- Las 19 pruebas puntuales actuales pasaron. No equivalen a integración Meta ni
  aprobación de toda la app. El navegador sigue usando el build `f790a002`.
- Mural: subida real en aislado rechaza "Firestore no disponible"; conserva foto
  y texto. Es un límite del entorno sin proveedor, NO fallo publicado confirmado.
- Barra: trago sin insumos se rechaza explícitamente. No se aceptó la cola completa.
- Programador: entregar corrección, pruebas rojo/verde y registro compartido con
  el mismo SHA. Claude compila; Codex vuelve a probar SÓLO lo cambiado.

## Retest posterior a la fusión, 8/10/2026

Destino contrastado: main `09c8d814fdecdca00da71de7bc22c1d64ef0e662`, sin
PR abierta en ese contraste. Los cuatro arreglos existen; NO volver a
programarlos. Build aislado autorizado `y3pk-oG28Gx7I91pIPgS2`.
Reporte y archivos: `docs/evidencias/79-barra-real-y-limites-estaciones.md`.

- A: el menú bufet guarda un presupuesto REAL desde el navegador.
- B: enlace del PDF abre sin sesión del equipo; token falso rechaza y sin
  token pide login. PDF directo real: dos A4 numeradas y revisadas visualmente.
- D: prospecto real de prueba muestra Fiesta, no Cita; JSON no inventa
  `followUpDate`. Cita previa probada sólo por regresión unitaria, no UI.
- C: raíz y pestaña ahora muestran 121 personas confirmadas y 37 sin
  responder. **Queda un remate parcial**, no otro fallo nuevo: en
  `src/app/portal-cliente/[id]/page.tsx:883`, `pendientesRsvp.length` aún
  rotula 19 registros como "invitado(s)". Gemini debe explicitar
  "19 invitaciones (37 personas)" o usar 37 personas del helper existente.
  Mantener permisos y reglas RSVP/check-in. Prueba PENDIENTE de esa etiqueta.

Propuesta no bloqueante: limpiar enlaces internos visibles en el presupuesto
público. "Personalizar asistentes" lleva a login, no se comprobó acceso
indebido. No sacar el asistente aprobado ni abrir permisos para arreglarlo.

Nueve pruebas puntuales/4 suites pasan, NO nueve E2E. Estos casos no cierran
toda el área ni concilian los 19 presupuestos originales. No se prueba
despliegue por tener un build local. La decisión posterior del dueño de usar
fotos de ejemplo válidas sustituye aquí el antiguo pendiente de foto real;
no volver a pedirlas ni deshacer las picadas correctas.

```comprobar
archivo: src/lib/simulator/catalog.ts
usa: agregarVariantesBufet en src/app/actions/menus-catering.ts
usa: agregarVariantesBufet en src/lib/simulator/catalog.ts
prueba: src/__tests__/simulador-variantes-buffet-autorizadas.test.ts
usa: getCompanyInfoPublica en src/app/(app)/presupuestos/[id]/ver/page.tsx
no-usa: getCompanyInfo() en src/app/(app)/presupuestos/[id]/ver/page.tsx
prueba: tests/e2e/presupuesto-publico-sin-sesion.spec.ts
prueba: src/__tests__/el-enlace-del-cliente-no-pide-datos-privados.test.ts
usa: contarPersonasDelPortal en src/app/portal-cliente/[id]/page.tsx
prueba: src/__tests__/portal-cliente-contadores-personas.test.ts
usa: eventDate en src/lib/crm/public-lead-persistence.ts
prueba: src/__tests__/crm-fecha-evento-no-es-cita.test.ts
```
