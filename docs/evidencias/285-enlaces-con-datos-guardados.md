# Evidencias Orden 285 — Enlaces armados con datos guardados (Barrido regla 118 / 89)

Este informe lista los enlaces (`href` y `router.push`) en `src/app` y `src/components` armados a partir de datos persistidos (archivos, IDs, tokens, claves de acceso). Se documenta qué se arregló y qué casos tocan cobros, plata o permisos para decisión de Claude.

## Casos arreglados en la Orden 285

1. **`src/app/(app)/customers/[id]/page.tsx`:338 (Contrato del cliente)**
   - **Qué pedía el destino:** `/api/contracts/<nombre-archivo>` acepta únicamente nombres sueltos o URLs `https://`.
   - **Problema previo:** Rutas locales de Windows (`C:/Users/...`) arrojaban un 404 al intentar resolver la ruta.
   - **Arreglo implementado:** Uso de `enlaceDeDocumentoDelCliente()`. Si contiene separadores de ruta o dos puntos, devuelve `null` y el botón queda deshabilitado con "El archivo quedó en una computadora: volvé a subirlo".

2. **`src/app/(app)/customers/[id]/page.tsx`:345 (Presupuesto firmado del cliente)**
   - **Qué pedía el destino:** `/api/budgets/<nombre-archivo>`.
   - **Problema previo:** Si el cliente tenía una ruta de archivo local guardada, abría un 404.
   - **Arreglo implementado:** Valida con `enlaceDeDocumentoDelCliente()`; deshabilita el botón con aviso si quedó en ruta de computadora.

3. **`src/app/(app)/customers/[id]/page.tsx`:352 (Contrato de salón del cliente)**
   - **Qué pedía el destino:** `/api/salon-contracts/<nombre-archivo>`.
   - **Problema previo:** Si la ruta provenía de disco local, producía un error 404.
   - **Arreglo implementado:** Valida con `enlaceDeDocumentoDelCliente()`; deshabilita el botón con aviso explicativo.

4. **`src/app/(app)/fiestas/[id]/centro/page.tsx`:183 (Ver como un invitado)**
   - **Qué pedía el destino:** `/invitacion/[fiestaId]/invitado/[guestId]?token=[guestAccessToken]`.
   - **Problema previo:** Armaba el enlace al primer invitado sin `?token=`, provocando rechazo "Enlace inválido" en la pantalla de destino. Además, la fiesta demo no tenía tokens asignados.
   - **Arreglo implementado:** Acción de servidor `enlaceDeInvitadoDeMuestra()` restringida a dueño y auditor que resuelve dinámicamente el primer invitado con token (o RSVP si no hay token). Se removió la exposición de tokens del payload inicial del centro.

5. **`src/app/portal/page.tsx`:942 y 1056 (Informar Pago del portal del cliente)**
   - **Qué pedía el destino:** `/portal/c/${settings.accessKey}`.
   - **Problema previo:** Usaba `settings.accessKey || fiesta.id`. Al usar `fiesta.id` el portal no lo encontraba y daba 404.
   - **Arreglo implementado:** Si no existe `accessKey`, el botón no se muestra y el enlace queda nulo para evitar 404.

6. **`src/lib/calendar-links.ts`:41 (Sincronizar Google Calendar)**
   - **Qué pedía el destino:** URL de Google Calendar con hora de pared de Uruguay.
   - **Problema previo:** Pasaba por `toISOString()` (Greenwich `Z`), corriendo el evento 3 horas atrás.
   - **Arreglo implementado:** Formateo de fecha sin `Z` con parámetro `ctz=America/Montevideo`.

## Casos que tocan plata, cobros, contratos laborales o permisos (No tocados para decisión de Claude)

- `src/app/(app)/empleados/[id]/editar/page.tsx`:266: `/api/employee-contracts/${empleado.contractFileName}` — pide archivo de contrato laboral de empleado (toca contratos/laboral).
- `src/app/(app)/contabilidad/crm/outbox/page.tsx`:250: `/presupuestos/${msg.presupuestoId}/ver` — pide ID de presupuesto para revisar propuesta comercial vinculada a mensaje saliente (toca ciclo comercial/presupuestario).
- `src/app/(app)/empresa/salones/club-uruguay/page.tsx`:972: `/fiestas/nueva/gestion-documental/contrato-salon?fiestaId=${f.id}` — pide fiestaId para contratos de locación y salón de terceros (toca contratos comerciales).
- `src/app/(app)/empresa/salones/club-uruguay/page.tsx`:980: `/fiestas/nueva/gestion-documental/recibo-pago?fiestaId=${f.id}` — pide fiestaId para emitir recibos de dinero (toca cobros y contabilidad).
- `src/app/(app)/invoices/[id]/page.tsx`:72: `/invoices/${invoice.id}` y `/api/invoices/${invoice.id}/pdf` — pide identificador fiscal de factura y token tributario (toca facturación electrónica).
- `src/app/portal-cliente/[id]/page.tsx`:210: `/portal-cliente/${params.id}` — ruta interna por ID de fiesta para auditoría del dueño (toca permisos de auditoría).
