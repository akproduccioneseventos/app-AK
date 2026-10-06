# Auditoria 71: retest y limites de cierre

Fecha: 6/10/2026. Codex audita y documenta; no programa la app, no compila produccion ni fusiona.

## Version y tanda contrastadas

- Area: plata, contrato, permisos, comida y redes. Commit: `e52c07839563115236652229d73ac5ebf2e4e551`, main con PR1258.
- Tanda abierta: PR1259, `feat/orden-117-video-invitados`, HEAD `f836c128cfad861a55a2352782f18c805b55e13a`. Verificado de nuevo por `gh pr list` y `git ls-remote`.
- Su diff NO modifica las acciones generales de fiesta, compras ni Instagram donde se reproducen los casos siguientes. Por ello tambien estan presentes en esa entrega; no pedir reimplementar lo corregido en 70.
- Graphify se uso como mapa historico. Fuente, simbolos, consumidores y pruebas se verificaron sobre los objetos Git actuales. No se reconstruyo un grafo por cambios solo documentales.

## Resultado ejecutado

Main: **603 suites / 3490 pruebas unitarias aprobadas**, 0 fallidas y 0 pendientes. Corrida 15:44:25-15:52:57 UTC. Cinco suites focalizadas de plata/permisos/fecha: 56 aprobadas, INCLUIDAS en las 3490, no se suman.

Las seis regresiones de 70 pasan sobre el merge 1258: `auditoria-70-contabilidad.test.ts`, `revision-de-plata-quien-toca-que.test.ts`, `el-candado-de-la-plata.test.ts`, `frontera-general-de-fiestas.test.ts`, `el-portal-cuenta-el-dia-en-uruguay.test.ts`. Esto no demuestra que todas las maneras de cambiar plata esten cubiertas: las sondas siguientes prueban entradas distintas.

PR1259: **4 suites / 27 pruebas aprobadas** sobre su HEAD exacto: conversacion de voz, video de invitado, ajustes de estacion y portada del portal. Primer intento fallo por faltar el enlace local a dependencias; segundo paso tras reparar SOLO esa junction. No se atribuye a la app. No es E2E ni prueba de camara/microfono/proveedor.

Originales comprimidos, comandos, fechas, hashes y blobs en `71-resultados/manifest.json`. Las sondas transpilan y ejecutan funciones REALES, con autenticacion y almacenamiento ficticios. No acceden a clientes, fiestas reales, credenciales ni servicios externos.

## Hallazgos reproducidos: cuatro casos, tres causas

1. **CAMPO01, P1: operador asignado marca una cuota como pagada por el guardado general.** `updateFiestaPartial` (`src/app/actions/fiesta/fiesta.actions.ts:227-251`) comprueba pertenencia al equipo, no permiso para cada campo. Sonda: perfil operador, contabilidad rechazada por la politica real; manda `planDePagos` con `montoPagado:1000` y se guarda. La accion especifica `updateCuotaEstado` exige CONTABILIDAD. Consumidor general: `src/app/actions/fiesta-actual.ts:69,79`; plan legitimo: `src/app/(app)/fiestas/nueva/plan-pagos/page.tsx:149,165`. No se denuncia costo como fallo: `updateGestionCostos` admite ORGANIZACION expresamente; cambiar esa politica requeriria decision del dueno.

2. **CAMPO02, P1: cliente con sesion valida de SU portal cambia contrato fisico y cobros.** Misma accion, `allowPortal:true`: solo bloquea `CAMPOS_DEL_EQUIPO`, que no incluye `contratoFirmaInfo`, `estado` ni `planDePagos`. Sonda sin sesion interna: marca contrato fisico firmado, evento Contratada y cuota pagada; contesta exito. Contradice la decision de papel obligatorio y la accion `uploadPhysicalContract`, que exige contabilidad. No es un acceso anonimo ni a fiesta ajena: basta la sesion legitima del cliente. Revisar tambien `saveFiesta`, que elimina solo los campos de equipo de un guardado del portal; no cerrar las operaciones legitimas de invitados, cliente o constancia digital.

3. **COMPRA01, P1: pantalla vieja de compras deshace un pago registrado en el medio.** `updateShoppingListStatus` (`src/app/actions/fiesta/catering.actions.ts:31-43,56-99`) decide si necesita contabilidad/insumos ANTES de `actualizarFiesta`. Dentro de la operacion vuelve a leer, pero reemplaza `estadosCompra` con el array viejo. Sonda: operador ve `pagado:false`; contabilidad registra `true` antes de la mutacion; operador guarda el snapshot y devuelve `false`, con exito. Consumidor: `src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx:370,394`. Se simula la intercalacion del almacenamiento, no una carrera de Firestore real. Distinto de PLAN01, ya arreglado.

4. **RED03, P2: dos importaciones concurrentes pueden perder un video de la galeria.** `syncInstagramPosts` lee el objeto `galeria-publica.json` y lo reemplaza al terminar. Sonda: ambas llamadas leyeron la galeria vacia; feeds A/B diferentes; ambas dan exito; solo queda `ig_B`. Se ejecuta tambien el adaptador generico REAL (`syncGenericJsonFile`/`readGenericJsonFile`) con `.set/.get` de Firestore simulados. Consumidor: `runMarketingAutomation` en `src/lib/marketing-automation.ts:159`. No se generaliza a fotos/planificador: las colecciones tienen control de marcas/transacciones. No reabrir la correccion previa de IDs estables ni pedir una simple deduplicacion: el problema es fusionar cambios concurrentes del objeto.

Reproduccion: `node docs/evidencias/71-sonda-campos-y-compras.cjs` y `node docs/evidencias/71-auto-probe.cjs`. Estas sondas pasan porque reproducen el defecto; NO son pruebas de aceptacion. Crear regresiones que fallen con esta version y pasen con la correccion.

## Alertas descartadas y observaciones

- Ayudante: supuesto corte del video del totem a 12 segundos. DESCARTADO en `f836c128`: el timer esta en el `else` SIN video; el video termina por `onEnded`. No generar trabajo para Gemini por esto.
- Se retiro la generalizacion de perdida concurrente de fotos/planificador: el mock inicial ignoraba las marcas de colecciones. Solo RED03 del objeto generico se sostiene.
- AUTO03: publicador devuelve un item fallido y el despachador anota que corrio. Es una observacion de significado del indicador, NO prueba de que se perdio el reintento. El post conserva su error y puede volver al proximo ciclo. Propuesta separada: distinguir cola procesada de entregas exitosas, sin cambiar cadencia ni mensajes automaticos del negocio.
- No se investigan controles de GitHub bloqueados por facturacion, conforme al dueno.

## Lo que NO se pudo cerrar

La matriz de las **14 areas** en `71-matriz-integral.md` enumera el flujo pendiente de cada una; no se marca ninguna limpia solo por el total de unitarias. Las areas sin defecto nuevo confirmado tampoco equivalen a revisadas boton por boton.

- Recorridos actuales completos de organizador, cliente, prospecto e invitado, descarga/compartir PDF desde el navegador, respuestas visibles a fallos y sincronizacion entre pantallas.
- Entorno compilado del mismo SHA con backend de prueba: orden 114 sigue necesaria; no se encontro servidor local escuchando ni artefacto `BUILD_ID`. No se lanzo otra tanda de E2E sobre el dev inestable ni se compilo por cuenta de Claude.
- Navegador: Chrome se abrio; al pedir estado, Computer Use se detuvo: **"could not determine the current browser URL on Windows with enough confidence to enforce policy"**. No hubo navegacion ni captura usable; no es error de AK ni falta de permiso del dueno. No se intento eludir el bloqueo.
- Firebase real, Meta/Gmail/WhatsApp/MP y otras conexiones con sus credenciales; 19 presupuestos importados contra sus documentos originales; fotos/menus reales frente al catalogo; prueba fisica de fotocabina/360/barra. Se conservan los limites de 69/70, no se convierten en defectos nuevos.
- Build, despliegue y SHA publicado actuales: no verificados por Codex. Claude compila y aporta esos resultados.

## Entrega

Orden unica 122: Claude toma CAMPO01/02 y COMPRA01; Gemini RED03; Claude compila el conjunto. Codex revisa despues SOLO los casos corregidos y los recorridos pendientes habilitados. No fusionar esta documentacion sola: incorporarla a la siguiente propuesta de codigo. No se emitio certificado ni se afirmo cero errores.
