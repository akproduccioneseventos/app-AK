# Orden252 - Devolucion PR1370: seis causas, no fusionar aun

27/10/2026. Completa revision de247/249, no repetir su implementacion.
HEAD90cc18b5d9a6a19f3e209a7f078017619435de38; base/main0abe9199.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. ComprobarHEAD antes de tocar.
Claude conserva dinero/permisos/seguridad/compilacion/fusion; Gemini UI/resto segun
reparto. Codex audita/prueba/documenta: NO appedit/merge. Una sola entrega conjunta.

Evidencia docs/evidencias/746-pr1370-dictamen.md:52originalesPASS/10suites;
sondas13criterios5PASS8FAIL=SEIS causas. UI743/744 inconclusa, no nuevos appbugs.
Conservar recibos y aserciones. Comentarios previos se completan, no se reencargan.

## Para Gemini (decisión de Claude, 28/10/2026): TODO esto lo programa Gemini en la misma propuesta 1370; Claude revisa

**Además, en la misma propuesta 1370 falta la orden 251 entera** (`docs/ordenes/251-gemini-un-solo-numero-de-plata.md`):
la entrega no toca `reportes.ts`, la pregunta frecuente ni `ganancia-evento.ts`. Va junto con esto.

## Corregir sobre la tanda activa (antes decía "Claude")

1. P1/AK-CODEX-741-ACTUALIZAR-FIESTA-RPC-SIN-FRONTERA.
   fiesta.actions.ts:actualizarFiesta expone publicRsvp y devuelve documento crudo.
   Personal no asignado CON flag y operador asignado SIN flag vacian cobros y leen
   clave de portal. Eliminar opciones/callbacks internos de fronteraRPC; validar
   campos/estado/permiso efectivo en servidor y recortar respuesta por perfil.
   Mantener helper INTERNO para RSVP y acciones protegidas legitimas.
   Quitar solo flag NO resuelve operador. Preservar cuotas/contrato sin permiso.
   Comentario4394845311 ya existe; incorporar variante, no otra solucion paralela.

2. P1/AK-CODEX-741-LOGIN-EMITE-VERSION-ANTERIOR.
   auth.ts:loginUser emiteversion1 aunque baseversion2. Pasar version guardada
   en emisores correspondientes. Conservar bootstrap sinversion=1 y rescate/
   clave maestra aprobados. No bajar version en base para ocultarlo.
   Clave correcta/version2 ->login success y siguiente requireSession aceptada.
   Comentario4394845323 ya existe.

3. P1/AK-CODEX-741-ADMIN-ACEPTA-COOKIE-REVOCADA.
   adminResetUserPassword acepta cookie que requireSession acaba de rechazar:
   antiguo dueno personal/version2 cambia clave AJENA. Usar guarda efectiva de
   existencia/version/perfil en mutaciones administrativas, no solo firma.
   Revisar deleteUser/updateUserModules y cambios/recuperacion de clave por247;
   changePassword aun no versiona. No afirmar todos ejecutados porCodex.
   No cambiar TTL60s ni politica de respaldo ante basecaida sin autorizacion.
   Test cookie rechazada ->reset rechaza y destino no cambia.

4. P1/AK-CODEX-741-DOS-BAJAS-DEJAN-CERO-DUENOS.
   updateUserModules lee cuenta fuera de update. Dos bajas simultaneas dan
   success ambas, quedan0. Preservar invariante>=1 atomicamente entre procesos
   en bajas/borrados; segundo get o mutex de instancia NO alcanza.
   Controles: ultimo dueno no baja, nadie se borra a si mismo, concurrencia
   conserva>=1, rechazo no deja escritura parcial.

5. P2/AK-CODEX-741-SENA-EXISTENTE-NO-GUARDA.
   actualizar-fiesta.ts rechaza estado FINAL Seña sin transicion.
   Permitir musica/otros cambios autorizados si YA era Seña. Conservar rechazo
   de transicion indebida desde tablero y caminos oficiales de cobro/contrato.
   No quitar proteccion global a ciegas. Comentario4394845332 existente.
   Control Cotizado ySeña guardan musica sin tocar cuota; transicion indebida no.

6. P1/AK-CODEX-743-HISTORICOS-FACTURA-DE-OTRA-CARGA.
   getInvoicesByPresupuestoId fallback HIST+ultimos5 aun con sourcePresupuestoId
   explicito AJENO. Acciones completas A1000/B2000, intentos diferentes mismo
   sufijoabcde ->dos success pero facturaA1000 compartida porfiestaB.
   Vincular identidad COMPLETA, nunca aceptar origenajeno por numeroHIST.
   Compatibilidad sin vinculo exige resolucion inequivoca o aviso, no primera
   coincidencia. Preservar reintento/reanudacion y dos cargas legitimas.
   NUNCA deduplicar por nombre/telefono/fecha.743 controles y helper incluidos.

## Gemini: completar lo YA pedido y el registro

- 247bloque4: retirar casillas sin efecto; renderizar InfoPerfilPermisos para
  perfil elegido. Modules antiguo se conserva enBD. No inventar permisos pormodules.
  Hoy formulario editable ignora edits con modules anterior y resumen no se usa.
- 247bloque6: conectar Apagar enlace a pantalla REAL y revocar al rechazar
  por camino autorizado; archive ya incrementa. Helper hoy sin consumidor UI.
  Claude valida autorizacion, version monotona/atomicidad y pantalla vieja
  que no resucite token. No romper enlaces mandados antes de apagarlos.
- Incluir YA-RESUELTO y ESTADO-ACTUAL con SHA/resultados/limites en esta entrega.
  Sus43archivos no los contienen. No fusionar documentos solos.
- Textos nuevos due?o: corregir puntual, no reescritura masiva de codificacion.
- Maestros: declarar limite del recheck fuera del delete, no prometer atomicidad.

## Validacion y entrega

Promover sondas de docs/evidencias a regresiones. Pruebas NUEVAS nombradas abajo
son PROPUESTAS/PENDIENTES hasta existir y correr; archivos originales si corrieron,
pero no cubren estas variantes. Fallar con90cc, pasar conarreglo.
Primero focales: loginversion2, cookie revocada administrativa, dos duenos,
personal/operador/dueno, Seña existente y sufijo repetido de historicos.
SDK aislado para duenos y factura/cobro con intercalado verificable/dos instancias.
No certificar SDK con doble local sin conflictos/reintentos.
UI: Permisos muestra perfil/resumen sin casillas; Apagar enlace presente,
confirmado, token viejo rechazado y reintento sin resucitarlo.
Conservar CSV60.30/120.60 y fixtures originales yaPASS.
Congelar fuente antes de validacion conjunta final porClaude. Sin datos/cuentas/
cargos/mensajes reales. Orden250/251 siguen con sus IDs; no duplicarlas.
Codex no fusiona, no appedit ni afirma que escribir esta orden inicia otrasIA.

```comprobar
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: actualizarFiesta en src/app/admin/ventas/page.tsx
archivo: src/lib/fiesta/actualizar-fiesta.ts
usa: actualizarFiesta en src/app/actions/fiesta-actual.ts
archivo: src/app/actions/auth.ts
usa: loginUser en src/app/login/page.tsx
usa: adminResetUserPassword en src/app/(app)/admin/usuarios/page.tsx
archivo: src/app/actions/invoices.ts
usa: getInvoicesByPresupuestoId en src/app/actions/historicos.ts
archivo: src/app/(app)/admin/usuarios/page.tsx
usa: InfoPerfilPermisos en src/app/(app)/admin/usuarios/page.tsx
archivo: src/app/actions/presupuestos.ts
usa: apagarEnlacePresupuesto en src/app/(app)/presupuestos/[id]/ver/page.tsx
prueba: src/__tests__/una-sesion-vieja-se-corta.test.ts
prueba: src/__tests__/una-pantalla-vieja-del-duenio-no-pisa-cuotas.test.ts
prueba: src/__tests__/la-carga-historica-no-duplica.test.ts
prueba: src/__tests__/el-candado-de-la-plata.test.ts
prueba: src/__tests__/admin-no-acepta-cookie-revocada.test.ts
prueba: src/__tests__/dos-bajas-conservan-un-dueno.test.ts
```

