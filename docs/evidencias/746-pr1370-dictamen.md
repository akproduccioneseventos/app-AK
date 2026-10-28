# Revision terminada PR1370 - NO APTA para fusionar

27/10/2026. Codex739-748. NO appedit/merge/produccion. Claude conserva
dinero/permisos/validacion/compilacion/fusion; Gemini implementa segun reparto.

## Fuente y evidencia

Main/base0abe9199ddb7281a945fd0f000a1a89f25b8fa8e.
PR1370 OPEN:90cc18b5d9a6a19f3e209a7f078017619435de38.
Diff43archivos revisado. QA separado2517fuentes/config/lock contrastados con
blobs antes/despues de cada corrida. Ver739manifest y747contraste.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. No se tocaron ramas ajenas.
Graphify puntual solo orienta; no validaHEAD. Anscombe/gpt-6-luna low reviso
cuatro diffsUI; principal comprobo consumidor y conserva decisiones sensibles.
Primer404 del agente fue slug equivocado deQA; no fallo de acceso/app. Agente cerrado.

| Grupo | Observado | Limite |
| --- | --- | --- |
|740 originales|9suites49PASS0FAIL0omitidos/exit0|Nueve suites nuevas/modificadas, sin alterarlas|
|745 candado|1suite3PASS/exit0|Guardas originales, no frontera completa nueva|
|741 sesiones/fiesta|10criterios4PASS6FAIL|CINCO causas, no seis bugs|
|743 historicos|3criterios1PASS2FAIL|UNA causa adicional|
|743 UI|suite no inicia: RTL no instalado en dependencias reutilizadas|NO appbug|
|744 ReactDOM UI|2inconclusos AggregateError, sin observaciones de negocio|NO dos appbugs ni pantalla aceptada|

Son52originalesPASS/10suites. Sondas:13criterios5PASS8FAIL=SEIS causas.
No homologar las13suites61 que anuncia el cuerpoPR: aqui son los archivos enumerados.
Sin build/TS/lint nuevos ni SDK/HTTP nativo/proveedor/cuentas/datos/cargos/envios reales.
Dependencias reutilizadas; no npmci limpio. Originales/fallos/logs conservados.

## C1/P1 AK-CODEX-741-ACTUALIZAR-FIESTA-RPC-SIN-FRONTERA

src/app/actions/fiesta/fiesta.actions.ts:1695-1704 exporta nueva accion con solo
sesion; acepta opciones internas publicRsvp/soloEquipo. La biblioteca
src/lib/fiesta/actualizar-fiesta.ts mezcla partial y devuelve documento crudo.
Accion y guardas de perfil/equipo REALES, identidad/persistencia controladas:
- Personal no asignado sin opcion: rechaza y conserva cuota1000 (controlPASS).
- Mismo personal con publicRsvp:true: success:true; una cuota cobrada1000 pasa
  a[]; respuesta incluye clave ficticia FAKE-SECRET-739 del portal.
- Operador asignado sin CONTABILIDAD, SIN opcion: tambien vacia cuotas y recibe
  clave. Quitar solo publicRsvp NO basta: falta frontera de campos y recorte.
Ya comentario4394845311; reproducido aqui y extendido al operador, no descubrimiento
independiente. Sin HTTP firmado/ataque real; exposicion RPC inferida de 'use server'.

## C2/P1 AK-CODEX-741-LOGIN-EMITE-VERSION-ANTERIOR

auth.ts:530-539 emite cookie normal sin versionDeSesion; session-token.ts:84
usa1. Usuario guardadoversion2+clave correcta: loginUser success:true,
cookie REAL valida con1, siguiente requireSession rechaza 'Tu sesion se cerro'.
Controlversion1 SI entra. Ya comentario4394845323, reproducido. No bajar versiones.

## C3/P1 AK-CODEX-741-ADMIN-ACEPTA-COOKIE-REVOCADA

auth.ts:1038 adminResetUserPassword usa verifySession, no version/existencia vigente.
Cookie REAL de antiguo dueno ahora personal/version2:
requireSession rechaza; adminResetUserPassword de OTRO usuario success:true,
cambia clave/version del destino de1a2. Prueba espera rechazo y destino intacto.
Cache fue invalidado y guarda efectiva rechazo ANTES de accion. No es TTL60s.
Revisar fronteras de otras mutaciones administrativas; NO afirmar todas ejecutadas.

## C4/P1 AK-CODEX-741-DOS-BAJAS-DEJAN-CERO-DUENOS

auth.ts:952-975 cuenta fuera del update. Control uno solo: rechaza bajarlo.
Intercalado explicito con DOS lecturas que ven ambos duenos antes de escribir:
ambas updateUserModules success:true; quedan CERO duenos.
BD falsa devuelve copias, acciones reales. No SDK/dos servidores certificados.
Un segundo get o mutex por instancia no protege esta invariante.

## C5/P2 AK-CODEX-741-SENA-EXISTENTE-NO-GUARDA

actualizar-fiesta.ts:79-80 rechaza estado final Seña incluso si ya era ese.
Dueno cambia solo musica: success:false/'No se puede mover a Seña.' y no guarda.
Control en Cotizado SI guarda. Ya comentario4394845332, reproducido.
Distinguir transicion indebida de conservar estado y caminos oficiales del cobro.

## C6/P1 AK-CODEX-743-HISTORICOS-FACTURA-DE-OTRA-CARGA

invoices.ts:132 getInvoicesByPresupuestoId acepta HIST-+ultimos5 aunque
sourcePresupuestoId indique OTRO presupuesto.
Dos processHistoricRecord REALES, intentos distintos carga-A-abcde/carga-B-abcde,
clienteA1000 yB2000: ambos success:true, dos presupuestos, SOLO una facturaA1000;
fiestaB enlazada a mismo invoiceIdA. Control sufijos11111/22222 deja dos facturas.
Tercer criterio helper confirma factura ajena con sourcePresupuestoId diferente.
Persistencia controlada/copias/archivos bloqueados; no documentos/cobros reales.
No deduplicar nombre/telefono/fecha: son DOS cargas deliberadas legitimas.

## Incumplimientos de entrega comprobados por consumidor, no bugs ejecutados extra

D1/247bloque4: admin/usuarios conserva ocho casillas editables; handler249 ignora
editModules si habia modulos. InfoPerfilPermisos existe91, pero NUNCA se renderiza.
Ayudante senalo riesgo, principal verifico formulario/handler/orden completos.
Es lectura de codigo/consumidor, NO aceptacionUI:743/744 inconclusas.
Orden ya aprobada: perfil/resumen, sin inventar otro sistema de permisos.

D2/247bloque6: apagarEnlacePresupuesto existe621 pero no tiene consumidorUI, solo
definicion/test. archive incrementa version; guardarPresupuestoSinTurno no incrementa
por transicion a Rechazado. Boton/rechazo PENDIENTES de orden existente.
Un helper y su test no demuestran funcion enganchada en pantalla.

D3: ninguno de43archivos es YA-RESUELTO/ESTADO. Comentario4394845342 ya advertia.
Esta devolucion se registra en ramaCodex; Gemini/Claude deben integrar registro
junto con correcciones, no fusionar documentos solos.

## Avances conservados y limites de cierre

- CSV/Texto de gastos60.30/120.60, signo/escape/formato: PASS del helper en740.
  NO toda contabilidad aceptada. No deshacer politica de ingresos/cuotas enteros.
- Dos fixtures antes incompletos agregan readDataConDetalle y originales pasan.
- Pantalla marcada, mismo intento historico, helper de enlace versionado, perfiles
  invalidos: originalesPASS en sus escenarios, no estas variantes nuevas.
- Borrado factura: transaccion condicional PRESENTE y originalesPASS. No cerrar
 726C1 como SDK/dos servidores: el doble no implementa conflictos/reintentos reales.
  Revisar rollback/unlink y modoJSON sin volver a pedir crear transaccion existente.
- Maestros tienen segundo control FUERA del delete: minimo permitido por249derivada
  si no cabe atomizar, NO prueba de exclusion entre asignar y borrar. Sin sonda nueva.
- changePassword sigue sin subir versionDeSesion: alcance incompleto de247 para
  Claude; NO otra causa ejecutada. Mantener politica de respaldo ante caida.
- Orden250trescausas y251FAQ NO se cierran por1370; no duplicar sus IDs.
- 743UI carece de RTL;744ReactDOM AggregateError no alcanza negocio: no instalar
  dependencia productiva para ocultarlo ni acusar app. Raw intacto.
- No compilar de nuevo por docs ni sumar pasadas entreSHA. Fuente app intacta;
  nuevas pruebas archivadas en docs/evidencias, no en suites productivas.
- Dictamen termina ESTA revision, NO certifica todaapp/cadarol/cadaboton/0errores.
  SinHosting/OAuth/modelo/voz/proveedor real acreditados.

Orden252 devuelve todo a la tanda activa. Retest SOLOdelta de nuevoSHA.
Claude compila/valida/fusiona. Codex no afirma que otrasIA ya leyeron o iniciaron.

