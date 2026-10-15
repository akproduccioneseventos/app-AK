# Orden167 - reportes y material del cliente, fuera de165/166

**NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE/GEMINI (HEAD desconocido).**
Gemini programa; Claude revisa dinero/permisos, compila/valida y fusiona.
Codex SOLO audita. Una propuesta con la tanda, no una por pantalla o hallazgo.
Fuente ejecutada ce1ac07d1bb16c24dd73e2d26ac55038028a2472; main contrastado
a97d33f0e73492a15f9eeacee4373668b059caf6, mismos src/deps/config de prueba.
Comparar primero con la rama de trabajo actual. No repetir165/166 en curso.
Tanda abierta contrastada: PR1310, HEADc49a231de42860aaf548fbc3c3de7933b395c859,
orden165 de Gemini. Doce fuentes/consumidores directos de167 coinciden con main.
Registro130-contraste-tanda.json. No es certificacion de dependencias transitivas
ni de los HEAD privados. No modificar la PR1310 desde esta auditoria.

## P1 DEFECTO - El reporte pierde centavos de gastos que la app SI guarda

Acciones reales: saveGastoGeneral/getGastosGenerales en
`src/app/actions/gastos.ts` -> getProfitAndLossData en `src/app/actions/reportes.ts`.
Consumidores del reporte: `src/app/(app)/empresa/contabilidad/reportes/page.tsx`,
`src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx`, y
mandarAlContador en el mismo archivo de acciones. NO se envio ningun mail real.

Recorrido ejecutado con las TRES acciones reales y datos/auth en memoria:
- Gasto60.30: guardado y releido60.30; costos del reporte60; ganancia -60.
- Dos gastos60.30: guardado120.60; reporte120; ganancia -120.
- Control dos gastos30: guardado60 y reporte60, PASS.
No es solo formato visual: la respuesta numerica del servidor ya perdio valor.
La UI real de gastos manda parseFloat(monto); la accion admite y conserva60.30.

Corregir la precision de los COSTOS admitidos al consolidarlos, sus sumas y
ganancia derivada; verificar consumidor del contador sin enviar al proveedor.
No cambiar conciliacion/duplicados/permisos/rangos de fechas ni politicas de caja.

**Limite esencial:** el registro previo contempla ingresos/cuotas en pesos
enteros. NO cambiar globalmente roundMoney de financial-guardrails: tambien
normaliza cantidades de invitados y hay reglas comerciales vigentes.
No convertir las sondas iniciales de ingresos100.25 en una orden de cambiar
presupuestos ni monedas. Conservar esa politica salvo decision expresa del dueno.
Usar precision de centavos SOLO donde el dato guardado la admite; no tocar
precios ni recalcular historicos para hacer coincidir el reporte incorrecto.
Formato visible de costos debe distinguir exacto de redondeado, sin imponer
un rediseño del presupuesto publico. Si se pretende cambiar la politica de
redondeo comercial, pedir decision al dueno, no hacerlo dentro de este arreglo.

Sonda final: `docs/evidencias/130-costos-precision-reporte.test.ts`,1PASS2FAIL.
Observado: `130-costos-precision-observado.json`; resultado130-costos-jest.json.
Diagnosticos anteriores de ingresos, NO regresiones exigibles, archivados
en130-finanzas-politica-diagnostico.txt y130-diagnostico-politica-*.gz.
El primer fixture de factura uso date en vez de paymentDate: error de QA
conservado en130-antes-fixture-*.gz, no una factura desaparecida de produccion.

## P2 DEFECTO - Compartir depende de canShare sin comprobar que existe

Siete paginas React reales y sus botones ejecutados:
- `src/app/(app)/customers/reporte/page.tsx` -> ReporteClientesPage/handleShare.
- `src/app/(app)/proveedores/reporte/page.tsx` -> ReporteProveedoresPage/handleShare.
- `src/app/(app)/empresa/activos-fijos/reporte/page.tsx` -> ReporteActivosFijosPage/handleShare.
- `src/app/(app)/empresa/insumos/reporte/page.tsx` -> ReporteInsumosPage/handleShare.
- `src/app/(app)/empresa/servicios/reporte/page.tsx` -> ReporteServiciosPage/handleShare.
- `src/app/(app)/empresa/menus/reporte/page.tsx` -> ReporteMenusPage/handleShare.
- `src/app/(app)/presupuestos/reporte/page.tsx` -> ReportePresupuestosPage/handleShare.

Con navigator.share disponible y navigator.canShare ausente: TypeError,
cero llamadas nativas y cero alternativa. No se afirma que todos los navegadores
actuales tengan esa combinacion: es una condicion de compatibilidad simulada.
Controles: sin share usa WhatsApp; con canShare=true usa nativo.14PASS7FAIL.
Misma causa en siete consumidores, NO siete defectos independientes.

Hacer deteccion de capacidad segura y conservar alternativa. Patron existente
en `src/app/(app)/fiestas/nueva/carga-operativa/pdf/page.tsx` ya distingue
canShare ausente: no deshacerlo ni exigir un ayudante nuevo sin consumidor.
Probar tambien rechazo real de compartir y AbortError: cancelacion no debe
forzar WhatsApp ni anunciar error/exito falso. Estos dos casos nuevos son
aceptaciones PROPUESTAS, todavia no ejecutadas en esta tanda.

Barrido ADICIONAL ejecutado: diez handlers ORIGINALES extraidos por AST y
su enlace onClick verificado, con APIs de prueba.29PASS1FAIL, NO UI renderizada.
itinerario/pdf, reuniones/imprimir, resumen-imprimible, recibo-pago,
cancelacion-parcial, cancelacion-contrato, cambio-fecha, decoracion/pdf y
musica/pdf mantienen alternativa: no reencargarlos por el grep canShare.
La octava ubicacion que SI falla es handleShare en
`src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx`:
TypeError con ambas alternativas sin usar. Sigue siendo LA MISMA causa, no
otro defecto de logica financiera. Controles del handler nativo/alternativa PASS.
Sonda `130-compartir-variantes.test.ts`, datos130-compartir-variantes-observado.json,
resultado130-variantes-jest.json. Contexto inicial incompleto (data/showLayout/
setShareUrlToShow ausentes) produjo ReferenceError de QA, NO app; archivado
en130-antes-contexto-*.gz. Solo se completo el contexto, no codigo ni esperados.
Referencia de API consultada: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
y https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare.
Sin afirmar compatibilidad fisica ni inventar versiones de navegador afectadas.

Sonda: `docs/evidencias/130-reportes-compartir.test.tsx`.
Resultados/observaciones:130-reportes-jest.json y130-reportes-compartir-observado.json.

## P2 DEFECTO - Fotos/audios del cliente esconden fallos como contenido vacio

Consumidor REAL: FotosVideoPortalPage, en
`src/app/portal-cliente/[id]/fotos-video/page.tsx`.
Las dos lecturas getSocialPosts/getDedications usan catch(()=>[]) sin estado
de error por fuente. Sonda con pagina real y mapFiestaToClientPortal REAL:
- Fotos rechazan: muestra0 fotos compartidas en el muro sin aviso; audio
  leido sigue presente. No es un vacio confirmado.
- Audios rechazan: desaparece esa seccion sin explicar que la lectura fallo.
- Controles vacio real, contenido real y sesion invalida:3PASS. Dos fallos.

Separar vacio comprobado de fallo/desconocido por fuente; informar en pantalla
y ofrecer recuperacion sin perder las entregas oficiales conocidas ni confundir
fallo de contenido con sesion vencida. No cambiar visibilidad contratada, estados
de aprobacion, enlaces de descarga ni permisos. No volver a implementar el
mapeo de entregas86 ni ZIP141, ya cerrados: es OTRO estado de esta pantalla.

Sonda: `docs/evidencias/130-portal-material-lecturas.test.tsx`,3PASS2FAIL;
observado130-portal-material-observado.json y resultado130-portal-jest.json.
Las APIs de contenido/sesion son dobles: NO prueba de servidor/Next nativo,
Firestore real ni cuentas del cliente. No se reprodujo una carrera de cookies.

## P2 FRICCION - El reporte de una fiesta ya elegida manda elegir otra

Consumidor real: ReporteEventoContent/fetchReportData en
`src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx`.
Con fiestaId real de prueba y accion que devuelve error o rechaza por red,
SI se muestra un toast de Error, pero el cuerpo persistente dice Elegi una
fiesta para ver el reporte de rentabilidad. El ID YA habia sido enviado.
No decir que nunca aviso: el toast existe. Lo incorrecto es el estado persistente.

Distinguir sin-ID de error de carga con ID. Conservar la orientacion amigable
cuando no se eligio fiesta y no sustituirla por jerga. Para error de carga,
mostrar motivo comprensible y recuperacion en la misma fiesta. No calcular
ceros ni otro evento para rellenar datos. No toca las formulas de arriba.

Sonda `docs/evidencias/130-reporte-evento-error.test.tsx`,2PASS2FAIL:
sin-ID y reporte0legitimo pasan; error devuelto y red fallan en el estado.
Datos130-reporte-evento-observado.json, resultado130-reporte-evento-jest.json.

## Aceptacion

63casos finales diferentes:49PASS14FAIL, tres defectos y una friccion.
Los14fallos son variantes, NO catorce bugs. No sumar diagnosticos de ingresos,
primer fixture invalido ni las4819pruebas historicas como casos nuevos.
No se cambiaron fuentes de app ni se compilo por Codex.

Preservar evidencias originales; migrar sondas finales a regresiones del
proyecto sin bajar esperados. Contrastar fuente nueva y ejecutar focalizadas,
despues una validacion amplia congelada por Claude. Completar viajes nativos
con artefacto QA actual segun114; no crear otra orden equivalente. Sin cuentas,
datos/pagos/mensajes/hardware reales. Cambios de funcionamiento, al dueno.

```comprobar
archivo: src/app/actions/reportes.ts
usa: getProfitAndLossData en src/app/(app)/empresa/contabilidad/reportes/page.tsx
prueba: docs/evidencias/130-costos-precision-reporte.test.ts (EJECUTADA 1PASS2FAIL; arreglo PENDIENTE)
archivo: src/app/(app)/customers/reporte/page.tsx
usa: handleShare en src/app/(app)/customers/reporte/page.tsx
prueba: docs/evidencias/130-reportes-compartir.test.tsx (EJECUTADA 14PASS7FAIL; arreglo PENDIENTE)
archivo: src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx
usa: handleShare en src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx
prueba: docs/evidencias/130-compartir-variantes.test.ts (EJECUTADA 29PASS1FAIL; no volver a encargar9variantes que ya pasan)
archivo: src/app/portal-cliente/[id]/fotos-video/page.tsx
usa: getSocialPosts en src/app/portal-cliente/[id]/fotos-video/page.tsx
prueba: docs/evidencias/130-portal-material-lecturas.test.tsx (EJECUTADA 3PASS2FAIL; arreglo PENDIENTE)
archivo: src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx
usa: getProfitAndLossData en src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx
prueba: docs/evidencias/130-reporte-evento-error.test.tsx (EJECUTADA 2PASS2FAIL; ajuste PENDIENTE)
```
