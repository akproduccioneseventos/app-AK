# Diagnóstico acotado: web de venta y grilla de caras

**Alcance/evidencia.** QA917 (`.qa-427-source-7GJHez`, rama `claude/app-debug-stabilize-m70e6z`, HEAD observado `917a98e32c63fe2f832f5cdc16db87f4fc722b6c`). `ESTADO-ACTUAL.md` identifica publicada `3e45a4ac6` y candidata 917; los cambios privados posteriores a la observación no quedan contrastados. Ambos specs existen en ese SHA. Auditoría documental únicamente: no se reejecutó nada.

**RECTIFICACION DEL DIRECTOR.** El ayudante confundio el prefijo de instrumentacion
`ak207-` con otros specs y dijo que412/374 no los ejecutaban: INCORRECTO.
374-batch-009-resultados.json SI ejecuta la-grilla-de-caras y termina1FAIL;
374-batch-011-resultados.json SI ejecuta web, timeout;412-batch-006-resultados.json
repite la variante movil deweb, timeout. Los archivos de ejecucion enlazan esos
reportes con sus nombres originales. No borrar esos resultados. El paso causal
requiere leer sus trazas, y ni el timeout ni gtag/Unsplash bloqueados demuestran
por si solos un defecto de la app. El resto de esta nota son propuestas de
instrumentacion NO ejecutadas, no un cierre. La confusion fue del auditor.

**Asserts reales (QA917).** En `tests/e2e/la-web-de-venta-no-se-rompe.spec.ts`: abre nueve rutas separadas (`:23-32`, `:34-70`), exige HTTP <400 (`:55-58`), registra `pageerror` y error minificado React, comprueba cuerpo de al menos 40 caracteres y ausencia de esos errores (`:41-70`). `networkidle` de 15 s se captura y se ignora (`:59`): no es un assert ni fallo por sí mismo. En `tests/e2e/la-grilla-de-caras.spec.ts`: crea tres fiestas ficticias con IDs únicos y estados sin preparar/preparado/apagado (`:104-149`); borra fiestas/posts en teardown (`:151-156`). Posts de prueba referencian Unsplash (`:40-48`), cámara se sustituye por canvas sintético (`:84-102`). Los cinco casos verifican ausencia/presencia de controles, dos caras sin texto, selección/descarga/volver, permiso cancelado y resultado local; el último vigila POST/URL de imagen y exige cero envíos (`:158-284`). No hay cuentas/personas reales.

**Instrumento fiel a proponer (pendiente, no ejecutado).** Ejecutar aislado por spec con contexto nuevo y datos ficticios; interceptar antes de navegar toda salida externa y registrar URL/método, responder de forma determinista solo recursos no esenciales (gtag/telemetría y medios Unsplash), sin ocultar errores de app ni contar fallos de red como asserts funcionales. No esperar `networkidle`: esperar DOM/elementos esperados con timeout acotado y conservar reporte por ruta/paso. Para grilla, mantener los tres fixtures, postdata y cámara sintética; servir imagen placeholder local desde route/intercept, negar red externa, y mantener intactos los asserts de HTTP/UI, textos, conteo/selección, permiso, resultado y ausencia de payload de selfie a **cualquier** host, incluido localhost. Capturar consola y requests para distinguir dependencia bloqueada de fallo del objetivo. No quitar ni debilitar aserciones.

**Fuentes verificadas en QA917:** `tests/e2e/la-web-de-venta-no-se-rompe.spec.ts` (`PANTALLAS`, test principal); `tests/e2e/la-grilla-de-caras.spec.ts` (`armarPostsDePrueba`, fixtures `ID_*`, cinco casos). Propuesta de instrumentación pendiente de implementación y ejecución.
