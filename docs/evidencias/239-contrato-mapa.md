# 239 - Mapa de entrada y firma de contrato

Alcance: contrato del portal de cliente; no cancelacion/reprogramacion. Sin pruebas ejecutadas.

## Fuentes exactas
- main: `9d1a07f99b8d6972995ff8c2b9f1a5a1ac4a81de`.
- candidato: `b91bdbeff7d3db7489fabdadd599776376c0577a` (1353; fuente resoluble verificada por el principal).
- En ambos arboles, la pagina y la accion descritas abajo coinciden; no se observo delta en esas rutas.

## Ruta y consumidor
- `src/app/portal/[fiestaId]/contrato/page.tsx` - `ClientContractPage`, `loadData` obtiene `getContractSigningSummary` y datos via `getFiestaForPortalSession`; `handleSign` invoca `signContractDigitally(fiestaId, signerFullName.trim(), acceptedPlanPagos)`. Mismo contenido relevante en ambos SHA.
- Entrada directa verificada por arbol: `/portal/[fiestaId]/contrato`. No atribuyo un enlace desde una pantalla anterior: el consumidor navegacional no queda probado por esta lectura.
- `src/app/actions/fiesta-actual.ts` - exporta/reexpone `signContractDigitally` y `getContractSigningSummary` desde `DocumentosModule`; mismo en ambos SHA.
- `src/app/actions/fiesta/documentos.actions.ts` - `signContractDigitally`: exige `verifyPortalSession(fiestaId)`, carga fiesta y texto, evita duplicado, verifica aceptacion del plan si aplica, arma `firmaDigitalConstancia` (`signedAt`, `signedBy`, huella SHA-256 del texto y aceptacion; IP si disponible) y delega guardado.
- `src/app/actions/fiesta/fiesta.actions.ts` - consumidor de escritura `updateFiestaPartial(fiestaId, { firmaDigitalConstancia }, { allowPortal: true })`. La opcion requiere `requireFiestaWriteAccess`; para cliente no equipo rechaza campos internos de equipo. La firma digital de constancia no equivale al registro de contrato fisico/fiesta contratada.
- `src/lib/security/portal-session.ts` - `verifyPortalSession`: valida cookie firmada, vencimiento, fiesta, portal habilitado y huella de la clave vigente. Cadena invocada desde la accion; sin autenticacion de cliente la accion retorna no autorizada.

## Persistencia y diferencias
- Persistencia observada en codigo: `updateFiestaPartial` delega a la ruta de actualizacion de fiesta; la accion considera guardado solo si `guardado.success`. No se inspecciono Firebase ni se hizo escritura/runtime.
- Entre main y candidato, estas rutas/simbolos de firma son iguales. La evidencia 218/223 queda expresamente excluida: no prueba este endpoint ni la firma real.
- Hasta tres pruebas existentes (no ejecutadas): `src/__tests__/la-firma-digital-no-da-nada-por-aceptado.test.ts` (Mocks; constancia vs reserva); `src/__tests__/el-contrato-de-la-app-es-el-revisado.test.ts` (contrato/contenido); `src/__tests__/contrato-fecha-portal-dia-civil.test.tsx` (fecha en portal).

## Hueco de evidencia
- No hay aqui recorrido UI ejecutado desde el portal principal hasta esta ruta, invocacion real de la server action, escritura persistida confirmada ni relectura tras recarga. Los tests listados son evidencia existente, no corridas verificadas en esta tarea; un test mockeado no valida permisos/persistencia runtime.

### Comprobar
- archivo: `src/app/portal/[fiestaId]/contrato/page.tsx`; usa: `ClientContractPage` -> `handleSign` -> `signContractDigitally`; prueba: no ejecutada, recorrido real de cliente pendiente.
- archivo: `src/app/actions/fiesta/documentos.actions.ts`; usa: `signContractDigitally`; prueba: `src/__tests__/la-firma-digital-no-da-nada-por-aceptado.test.ts` existente, no ejecutada; no acredita endpoint/persistencia real.
