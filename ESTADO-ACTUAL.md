# Cierre de la tanda de auditoría

**5 de octubre de 2026.** Codex revisó main `212ba37da9c7540fd044b9de6e0edfe448ddfbe5`,
confirmado por GitHub nuevamente al cerrar. No había PR abierta. Tanda local/no subida de
otras IA no contrastada. Documentación en `codex/auditoria-66-20261005`; no es main.
**Resultado: NO APROBADA para publicar; cierre del informe, no de la app completa.**

## Evidencia vigente
- Informe `docs/evidencias/66-auditoria-sobre-212ba37-voz-video-comida.md`.
- Cierre y matriz de 14 áreas: `docs/evidencias/67-cierre-de-tanda-no-aprobada.md`.
- 589 suites / 3.383 pruebas Jest aprobaron sobre el código base en entorno aislado.
  No sumar subconjuntos; no prueban proveedores reales ni todas las pantallas.
- Recorrido publicado parcial: portada, galería, Club Uruguay, blog, inicio del simulador.
  SHA publicado no confirmado durante ese recorrido; no atribuirlo al SHA local.
- E2E invitado inconcluso: no sirve como evidencia de cierre.
- Graphify local: 11.763 nodos / 39.183 relaciones / 654 comunidades. Dos documentos
  omitidos, 25 archivos con advertencias del parser. Ignorado por Git; cada copia lo genera.

## Hallazgos nuevos reproducidos
- SOCIAL01: dos canciones/dedicatorias se pisan, incluso entre fiestas distintas.
- AUTO01: dos instancias toman el candado; el dueño viejo puede liberar al nuevo.
- AUTO02: métricas/recordatorios fallidos registrados como corridas correctas.
- PERS01: enlace vencido devuelve portal y cambia asistencia/llegada.
- PERS02: NaN/Infinity superan el control de ubicación y registran llegada.
- Tres sondas `docs/evidencias/66-sonda-*.cjs`: fuente real con servicios simulados.
  Su salida reproduce defectos; no son aceptación de arreglos.

## Qué sigue

- Orden 116: Gemini red social/automáticos; Claude personal/permisos y compilación.
- Informe 66: otros pendientes de comida, barra, permisos, video, voz y contador.
  El cierre consolida 5 fallos reproducidos y 13 observaciones de código, no explotaciones
  verificadas en producción. Contrastar con la tanda antes de programar.
- Recibos por empleado sí exigen SUELDOS a través del getter interno: caso descartado.
- Falta recorrido interno real aislado de producción y retest de cada arreglo en su SHA.
  Faltan embudo/PDF/CRM completo, integraciones reales y cotejo de los 19 importados.
  Ninguna de las 14 áreas se certifica por conteo global de pruebas; sigue 0/14.
- Voz real paga sigue pendiente del dueño. La prueba física queda al final.
- La puerta exige el mismo `expectedHeadSha` aprobado; no cambiar rama ni `commit -a`
  durante una verificación. El dueño conserva cambios de funcionamiento y fusión.
