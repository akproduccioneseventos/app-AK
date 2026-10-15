## Descripcion del Cambio

Auditoria documental, NO correcciones de la app. Cinco P2 reproducidos con
acciones/componentes reales y dobles ficticios. Orden166 lista para quienes
programan, con consumidores existentes y evidencia por caso. No fusionar
documentacion sola: juntar con las correcciones y la validacion de Claude.

1. Compras: desmarcar Pagado total deja completado el recordatorio de pagar.
2. Compras: A cuenta=-500 se guarda y devuelve success:true.
3. Revision inteligente: lectura fallida de fiestas aparece como revision completa vacia.
4. Revision inteligente: aviso que no se pudo guardar se presenta como Detectado, sin advertencia.
5. Personal: reintento tras respuesta perdida muestra20:05, servidor guardo20:00; recarga muestra20:00.

Fuente appce1ac07d; main1a717203 contrastado sin delta app/deps/configuracion.
PR1306 ya integrada via1307; nueva rama desde main, no se subio a rama cerrada.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE (HEAD desconocido).
Orden165 sigue aparte; no se duplica ni se afirma arreglada por estar en main.

## Tipo de Cambio

- [ ] Correccion de errores (bug fix)
- [ ] Nueva funcionalidad (feature)
- [ ] Refactorizacion / Optimizacion
- [x] Actualizacion de documentacion / Configuracion: auditoria, sondas y orden de trabajo

## Lista de Verificacion (Checklist) antes de solicitar revision

- [ ] Typecheck nuevo: no ejecutado, Codex no compila; no cambia app/config/dependencias.
- [ ] Lint nuevo: no ejecutado; esta propuesta NO valida un parche futuro.
- [ ] Graphify:update: no corresponde reconstruir por documentacion; consultas puntuales realizadas.
- [ ] Emuladores/E2E Next actual: no ejecutados; artefacto QA actual pendiente segun114.
- [x] Compras:5casos,3PASS/2FAIL (defectos documentados, no arreglados).
- [x] Automatizaciones:7casos,4PASS/3FAIL (dos causas; lote parcial no duplica hallazgo).
- [x] Personal:2casos,1PASS/1FAIL; vista/accion/pagina reales y datos ficticios.
- [x] Registro de preguntas:3PASS, sin omitidos. git diff --check sin errores.
- [x] Datos ajenos conservados byte a byte, agentes/servicios propios cerrados.
- [x] Amplia128769suites4819tests PASS reutilizada para el mismo codigo, NO cubria estos14casos nuevos.

Los resultados fallidos se conservan a proposito: son reproducciones, no una
entrega funcional aprobada. No llamar a esta PR arreglo ni lanzamiento listo.

## Impacto en Firebase

- [ ] Afecta reglas de Firestore / Seguridad.
- [ ] Modifica Cloud Functions.
- [ ] Modifica Hosting / Frontend.
- [ ] Requiere variables de entorno adicionales.

Ningun cambio de produccion, cuenta/cobro/mensaje/upload real, ni hardware.
Claude/Gemini programan. Claude valida y fusiona; Codex no fusiona.
