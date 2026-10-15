## Descripcion del Cambio

SOLO auditoria, sondas ficticias y orden167. No corrige codigo de la app.
Gemini programa y Claude valida/fusiona. Mantener borrador y unir los arreglos
antes de publicar; no fusionar documentos solos ni duplicar165/166 en curso.

Tres defectos nuevos y una friccion reproducidos:
- Costos60.30 guardados/releidos por acciones reales llegan60 al reporte.
- Compartir sin canShare falla en7paginasReact y1handler financiero.
- Portal de material disfraza fallos de fotos/audios de vacio/sin seccion.
- Reporte con fiesta elegida muestra toastError, pero el cuerpo manda elegirla.

Fuente appce1ac07d, maina97d33f0 equivalente en app/deps/config.
PR1310c49a231d de Gemini165 contrastada en12fuentes/consumidores directos sin
cambios; NO aprobacion de1310 ni equivalencia de dependencias transitivas.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE/GEMINI, HEAD desconocido.

## Tipo de Cambio

- [ ] Correccion de errores (bug fix)
- [ ] Nueva funcionalidad (feature)
- [ ] Refactorizacion / Optimizacion
- [x] Actualizacion de documentacion / Configuracion: auditoria y orden167

## Lista de Verificacion (Checklist) antes de solicitar revision

- [ ] Typecheck nuevo: Codex no compila; no cambia app/config/dependencias.
- [ ] Lint nuevo: no ejecutado; no se certifica un parche futuro.
- [ ] Graphify:update: sin cambio estructural; consultas puntuales realizadas.
- [ ] Emulador/Next nativo: pendiente de artefactoQA actual, requisito114.
- [x] Gastos: tres acciones reales conectadas,1controlPASS/2FAIL.
- [x] Compartir:7paginasReact,14PASS7FAIL;10handlers AST29PASS1FAIL.
- [x] Portal material:3PASS2FAIL; reporte evento2PASS2FAIL.
- [x] Total63casos finales diferentes49PASS14FAIL, no14defectos.
- [x] Registro de preguntas3PASS; bytes ajenos preservados, agente cerrado.
- [x] Politica de ingresos enteros preservada; diagnosticos iniciales archivados,
      no ordenes de cambiarla ni resultados ocultados/convertidos a PASS.
- [x] Nueve variantes de documentos mantienen alternativa; falso positivo por
      grep descartado mediante ejecucion, no se vuelven a encargar.
- [x] Amplia128769suites4819tests historicas se reutilizo, no se repitio.

Los FAIL son evidencia del codigo anterior, NO una entrega aprobada. La tanda
requiere los arreglos de Gemini, su SHA nuevo y validacion final de Claude.

## Impacto en Firebase

- [ ] Afecta reglas de Firestore / Seguridad.
- [ ] Modifica Cloud Functions.
- [ ] Modifica Hosting / Frontend.
- [ ] Requiere variables de entorno adicionales.

Sin acciones en datos/cuentas/pagos/mensajes/hardware reales. No app/build/merge
por Codex. No certificado global de0errores ni14areas limpias.
