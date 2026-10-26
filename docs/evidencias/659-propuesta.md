## Descripción del Cambio

Complemento **apilado sobre PR1362**, base `gemini/ordenes-228-229` en2b17bebf.
No duplica toda la entrega de Gemini ni modifica su rama. NO CONTRASTADO con
cambios privados no publicados. Fuente de app validada: `d4c69f2b2395ad3abcaee4fb166bcefbdc1457e0`.

- `requirePermiso` rechaza perfil explicito invalido aunque conserve roleadmin.
  Respeta cuentas legacy sin perfil; no amplia permisos para pasar pruebas.
- Importacion conserva audio y devuelve error recuperable si falla WebAudio.
- Captura vacia/indecodificable no se presenta como lista; cuenta unica yreintento.
- Tema oscuro local del buzon: titulos, campos, texto escrito, botones, pie yerror
  coherentes, sin cambiar el tema global ni formulas/precios/reglas de negocio.
- Prueba antigua positiva usa el perfil real dueno y mantiene rechazo deperfil inventado.

## Tipo de Cambio
- [x] Corrección de errores (bug fix)
- [ ] Nueva funcionalidad (feature)
- [ ] Refactorización / Optimización
- [x] Actualización de documentación / Configuración

## Lista de Verificación (Checklist) antes de solicitar revisión
- [x] Build680 con TypeScript ylint integrados PASS (no se afirman comandos separados).
- [x] Canonica681: **869suites,5278PASS,0FAIL,0omitidas** sobre la misma fuenteD4.
- [x] Navegador682: **22PASS**, incluyendo audio RMS, codec real/synthetic input,
  subida/grabacion/reintento, contraste de simulador, selfie uniforme ytokens delbuzon.
- [x] Archivo oficial `tests/e2e/buzon-titulo-legible.spec.ts` ejecutado SIN modificar:
  **6PASS** (trescriterios PC/Pixel7), dentro de los22 anteriores, no seisextras.
- [x] Graphify sin LLM tras nuevoshelpers; cache anteriora83, no se reconstruyo porCSS/docs.
- [x] Acentos PASS, QA restaurada/diff0; agentes/servicios propios cerrados.
- [ ] Nueva verificacion de proveedores/emuladores reales: NO se afirma; navegador usaJSON
  aislado yunitarias sus mocks. No cuentas/cobros/mensajes/fotoshumanas enviados.

## Impacto en Firebase
- [ ] Afecta reglas de Firestore / Seguridad.
- [ ] Modifica Cloud Functions (requiere despliegue de funciones).
- [x] Modifica frontend yguardia de autorizacion del servidor.
- [ ] Requiere variables de entorno adicionales (`.env`).

No nuevas dependencias productivas. Runtime de deps reutilizado: estree1.0.8 vslock1.0.9;
no se afirma npm-ci limpio. Build/lint mantienen avisos existentes, sin errores fatales.

## Evidencia y Alcance

Informe: `docs/evidencias/685-cierre-comprobado.md`; recibos680/681/682/683/684;
manifest686 conserva SHA256 originales yversiones comprimidas de archivos grandes.
QA anteriores se conservan sin convertir errores de arnes en bugs de app.
678/679 eran prototipos DOM; **la aceptacion final682/683 usa el codigo real, sin inyecciones**.

La matriz probada queda aprobada. No equivale a certificar cada boton/rol/contexto,
Hosting uOAuth/modelo/voz externos ni ausencia absoluta de errores.

**No fusionada ni desplegada por Codex. Claude/el dueno conserva revision yfusion.**
Integrar con1362 yvalidar el SHA integrado si se mezcla con otras entregas.
