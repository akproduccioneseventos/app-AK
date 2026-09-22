# Calendario, navegacion y limites del cierre

## Base y contraste

Codigo auditado: main 54cd6230d8fd10d91b031c5ae5320125e8d1bd41. PR1209 y PR1210 ya fusionadas. No tomar ESTADO-ACTUAL.md del main como estado vigente: describe la rama del 20/9 antes de esas fusiones.

PR abiertas contrastadas mediante diff de aportes respecto de main:
- 1207: 29943cdd80ed7c14ceabc650544eb2aa304516a2.
- 1206: 129c1988efed26eb1519fa7926274bf14504f0f8.
- 1202: 6622427c604930b02910a2a2778bf20a72683f40.
- 1197: f0ac2027b7e25dc6845e1230fba60b0c9055ddb3.

Ninguna aporta cambios a agenda.ts, calendario/page.tsx, presencia-digital/page.tsx, portal/page.tsx o next.config.js. Las ramas divergen: esto no certifica su comportamiento completo ni un despliegue. Antes de programar, actualizar el contraste si cambiaron los HEAD.

Codex solo audita y documenta. Sin codigo de aplicacion modificado, sin build, sin fusion y sin escritura de datos reales. Por pedido del dueno no se insistio con el ingreso del navegador. Se uso una copia aislada del SHA. Graphify no tiene graph.json en esta copia ni en la ubicacion historica comprobada; la consulta fallo por falta del grafo. Se usaron AST y busquedas puntuales, no se regenero un grafo costoso ni se instalo una dependencia de produccion.

## CAL-01 / P1: mover una reunion cambia la fecha de la fiesta

Fuente: src/app/actions/agenda.ts getCalendarEvents (reuniones con id reunion_*, type Reunion y fiestaId del evento), src/app/(app)/calendario/page.tsx EventChip:115 y handleDragEnd:511-531. La reunion no esta completed, por lo que se permite arrastrarla. El manejador siempre llama updateFiestaDate(fiestaId, fecha), sin distinguir reunion de evento.

Sonda: arrastrar reunion genera una escritura de fecha de fiesta, cuando deberia generar cero escrituras de ese tipo. Control: arrastrar fiesta genera una. La accion updateFiestaDate persiste configuracion.fechaEvento y luego solicita sincronizacion de Google con sendEmails y forceEmail. La sonda usa mocks: NO se envio correo ni se movio una fiesta real.

Consecuencia para el equipo: intenta reprogramar una entrevista y puede reprogramar la celebracion. Gemini: separar identificacion/tipo de elemento y operacion desde la pantalla. Claude: validar destino y persistencia/sincronizacion. No quitar la posibilidad de reprogramar reuniones ni cambiar reglas del negocio sin aprobacion.

Aceptacion pendiente integrada: mover reunion conserva fecha del evento y actualiza solo esa reunion; recargar confirma; mover fiesta conserva reuniones salvo regla aprobada; fallo de guardado revierte la vista y no comunica cambio externo.

## CAL-02 / P2: una fecha corrupta vacia todo el calendario

agenda.ts:42 convierte con toISOString dentro de activeFiestas.map; solo hay catch general que devuelve []. Una fiesta valida junto a otra con fecha not-a-date da cero eventos. Con solo la valida da uno. Las reuniones tienen proteccion individual, las fiestas no.

No se comprobo que exista un registro corrupto real: es un fallo reproducido con fixture. Claude: aislar registro invalido, conservar validos y devolver advertencia comprensible sin fingir calendario vacio. Gemini: presentar advertencia sin ocultar el resto.

Aceptacion pendiente: listado mixto conserva validos, senala el registro a corregir y distingue error de lectura de lista realmente vacia. El historico ya menciona lecturas de agenda; esta sonda precisa el caso de conversion de fecha que sobrevive en este SHA, no pide rehacer arreglos previos.

## CAL-03 / P2: fiesta nocturna aparece al dia siguiente

agenda.ts:42 usa toISOString().split('T')[0]. Fiesta 2026-10-10T23:00:00-03:00 produce date 2026-10-11. El calendario agrupa por ese date. No equivale al dia del evento en Uruguay. getOccupiedDates tiene expresion similar; su consumidor no fue probado en esta tanda, no se afirma un fallo de disponibilidad demostrado.

Claude: normalizar dia civil de negocio y preservar instantes/horas, sin cambiar datos historicos en masa. Gemini: usar el mismo criterio en agrupacion y seleccion. Aceptacion pendiente: fechas sin hora, 00:00 y 23:00 Uruguay, navegador en otra zona, sin correr el dia ni la hora al guardar.

## CAL-04 / P2: fecha imposible se normaliza y se sincroniza

agenda.ts updateFiestaDate:118 usa setFullYear sin validar round-trip. Entrada 2026-02-31 produce 2026-03-03T21:00:00.000Z y success:true, con una solicitud de sincronizacion. El arrastre normal ofrece fechas validas; esto es una prueba del limite servidor, NO un bypass de permisos ni una entrada normal observada en interfaz.

Claude: rechazar fecha imposible antes de guardar/sincronizar. Control aprobado: fallo de saveFiesta devuelve success:false y no sincroniza. Aceptacion pendiente: febrero comun/bisiesto, mes 0/13, cadenas mal formadas y preservacion de hora.

## NAV-01 a NAV-03 / P2: ocho enlaces a tres destinos inexistentes

Barrido AST de 1916 archivos bajo src: inventario de 360 paginas y 412 enlaces literales href/router/redirect. NO prueba 360 pantallas ni analiza exhaustivamente objetos de menu, templates dinamicos, enlaces externos o cada boton.

Doce candidatos; se descartan cuatro ocurrencias validas: sitemap.xml tiene src/app/sitemap.ts; dos enlaces de backup y uno de Google tienen route.ts. next.config.js no redirige ni reescribe los tres destinos restantes; middleware solo aplica acceso. Hallazgos de codigo, no navegacion autenticada ejecutada:

- NAV-01: src/app/portal/page.tsx:470, Cotizar mi fiesta apunta a /presupuesto sin pagina. Se muestra ante error o ausencia de fiesta. El simulador real existe en /simulador-de-presupuesto. El CTA de rescate del cliente/prospecto no debe llevar a otra via muerta.
- NAV-02: src/app/(app)/empresa/presencia-digital/page.tsx:50 apunta a /ajustes/redes-sociales, inexistente. Existe /settings/social-connections; verificar que el destino final corresponda a la accion prometida, no solamente cambiar a cualquier pantalla de ajustes.
- NAV-03: /fiestas no tiene pagina ni redirect. Se enlaza en contabilidad/crm/atraccion-fiestas/page.tsx:216 y cinco salidas de impresos bajo fiestas/nueva: carga-operativa/pdf:181, gestion-costos-rentabilidad/reporte:95, itinerario/pdf:109, musica/pdf:112, resumen-imprimible:180. El barrido no reaudita esos impresos ni sus calculos: solo agrega el enlace de retorno.

Gemini: elegir rutas reales segun contexto y reutilizar mapa existente; preservar fiestaId cuando se vuelve a la fiesta, no perderla ni redirigir al listado por comodidad. Aceptacion pendiente: activar los ocho enlaces en el entorno de pruebas, con y sin fiesta seleccionada, volver y recargar. Mantener proteccion de acceso.

## Evidencias y reproduccion

- docs/evidencias/agenda-sonda.cjs: extrae funciones reales por AST, sustituye almacenamiento, sesion y sincronizacion. 8 casos, 4 PASS y 4 FAIL. No E2E ni Firestore.
- docs/evidencias/agenda-resultados-2026-09-22.json.
- docs/evidencias/enlaces-sonda.cjs: inventario/candidatos mecanicos; nunca etiqueta por si solo un candidato como fallo.
- docs/evidencias/enlaces-resultados-2026-09-22.json.

Con Node y TypeScript disponibles: AUDIT_TYPESCRIPT puede apuntar a la instalacion existente; ejecutar node docs/evidencias/agenda-sonda.cjs RUTA_REPO y node docs/evidencias/enlaces-sonda.cjs RUTA_REPO. La sonda devuelve JSON, su exit0 significa que pudo ejecutarse, NO que todos los casos aprobaron. Los resultados corresponden al SHA arriba, no a futuros HEAD.

## Reconciliacion de las pruebas anteriores

Un agente economico hizo solo lectura de estado/evidencia y fue cerrado. PR1210 declara 2748 tests y build aprobados; el handoff viejo dice 2762 y Touchpix fallando. No convertir ninguna cifra en certificado del main actual. El test tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts existe, la PR declara ejecucion y hay correccion de sesiones. No se vuelve a pedir esa correccion como si faltara; la ejecucion E2E del SHA actual queda por corroborar.

El registro mantiene importacion movil (orden76) pendiente y el test tests/e2e/la-vidriera-de-la-tecnologia.spec.ts tiene test.fixme. Verificar estos pendientes contra la siguiente tanda antes de implementar. Un skip condicional no demuestra bug; si no se ejecuta, tampoco demuestra cobertura. No reabrir decisiones aprobadas por el dueno.

## Diagnostico de cierre global: NO CERTIFICADO

La evidencia acumulada es parcial y por SHA. El inventario de 360 paginas NO permite declarar toda la app revisada. No se repitieron en esta tanda los casos anteriores de contabilidad, proveedores, mesas, logistica o entretenimiento. Sus informes conservan estado historico hasta contrastar correcciones, como pidio el dueno.

Para completar la auditoria profunda faltan resultados de comportamiento identificables, no otra lista de archivos:

| Familia | Evidencia minima de cierre que aun debe reconciliarse/obtenerse |
|---|---|
| Prospecto, web y simuladores | movil/PC, menu real, cambio paquete/extras, varios presupuestos por telefono, CRM, PDF abierto y compartido, imagenes y texto correctos |
| Cliente | acceso a su fiesta, documentos/pagos visibles correctos, guardado y recarga, sin acceso a otra fiesta ni administracion |
| Invitado y red social | invitacion, RSVP/acompanantes, moderacion, mural en segunda pantalla, aislamiento entre eventos |
| Entretenimiento y barra | captura/360/IA con equipo real, cola y doble pedido, subida demorada, reconexion, entrega del recuerdo, operacion y proyeccion |
| Organizacion | calendario y reuniones de esta tanda, tareas/personas/horarios, persistencia y concurrencia en dos dispositivos |
| Contabilidad y comida | resultados previos vinculados al codigo integrado; ingresos confirmados, saldo, duplicados, unidades y conciliacion sin tocar datos reales |
| Integraciones | cuenta autorizada de prueba y resultado externo observable en Google/Meta/WhatsApp/MercadoPago, rechazo/reintento sin duplicados |
| Publicacion | Claude compila conjunto congelado y registra SHA, entorno, comandos/resultados y pruebas omitidas; verificar SHA desplegado |

Esto no dice que todas esas familias esten rotas o nunca se hayan revisado. Dice que este trabajo no dispone de una matriz cerrada que demuestre cada recorrido sobre la entrega vigente. No se inventan porcentajes, fechas de cierre ni cero errores. No se pide al usuario repetir login ahora. La via de codigo permite seguir encontrando fallos, pero no sustituye hardware, permisos externos y uso real.

