# Auditoria 78: cuatro fallos pendientes, no app lista

7/10/2026. Codex audita; Claude/Gemini corrigen; Claude compila. No fusionar sin el dueno.

## Versiones

- UI aislada: `f790a002`, BUILD_ID `iZL-zBn4z4fNZ_IXFyUCN`.
- Main de contraste y pruebas puntuales: `09051f80`.
- PR 1266 (`8f4f6895`): solo traspaso documental; no trae estas correcciones.
- Evidencia nueva: rama `codex/auditoria-78-20261007`, NO main.

## Siguiente tanda: orden 128

- P1 SIM78-VIRTUAL: menus con buffet ofrecidos y rechazados al guardar.
- P1 PDF78-PUBLICO: enlace del PDF sin sesion llama lector privado y no carga.
- P2 PORTAL78-PERSONAS: raiz cliente cuenta filas, no acompanantes.
- P2 CRM78-CITA: fecha de fiesta se convierte en cita no reservada.
- Claude: comida/catalogo/precios y permisos; Gemini: consumidores/UI/portal/CRM.

## No repetir

- PR 1265: imagen buffet corregida y retesteada en consumidor; falta foto REAL.
- PR 1263: contador Instagram retesteado con mutador real e intento repetido.
- 19 pruebas / 4 suites pasan en `09051f80`; no son integracion real.
- PDF control: dos paginas A4 numeradas sin cortes; su enlace publico falla.
- Mesa sincronizada cliente/invitado; centro equipo rechaza sesion cliente.

## Limites y registro

- Mural sin proveedor y barra sin insumos no completaron sus recorridos.
- Integraciones/hardware y matriz global sin aceptacion final; no cero errores.
- Reporte: `docs/evidencias/78-recorridos-reales-y-retest.md`; orden 128; YA-RESUELTO.
- Evidencias 75-77 en `codex/auditoria-75-20261007` (`f70da8c3`).
- Compilar aislado fue excepcion autorizada; no se programo/publico la app.
- Contrastar nueva tanda/SHA y volver a probar solo lo cambiado.
