# Acá quedó la auditoría

**3 de octubre de 2026.** Fusionadas la 1255 (cobros COB06-09, lista de invitados con sesión,
contador de Codex en Windows) y la 1251 (video resumen de 66 s medidos, voz de Gemini y del
teléfono con dos interruptores, ajustes del asistente sólo para administración). Las dos con la
puerta completa, todas las pruebas de navegador.

Rama `claude/ponte-al-dia-qtrho3`, sin fusionar (sólo documentos, va con la próxima tanda): la
evidencia 66 para Codex, navegador prueba por prueba (`docs/evidencias/66-navegador-completo.*`).

## Espera a Gemini — UNA sola propuesta

- **112, B.1 (AUD01):** el contador de Codex tiene que cubrir las 416 rutas y enterarse de los
  cambios en lo compartido. Está masticado en la orden.
**5 de octubre de 2026.** Codex revisó main `212ba37da9c7540fd044b9de6e0edfe448ddfbe5`,
confirmado por GitHub. No había PR abierta al consultar. Una tanda local/no subida de otras
IA no está contrastada. Documentación en `codex/auditoria-66-20261005`; no es main.

## Evidencia vigente

- Informe `docs/evidencias/66-auditoria-sobre-212ba37-voz-video-comida.md`.
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

- Cobros: COB01-05 confirmados; COB06-09 arreglados (1255), falta que la vuelva a mirar.
- Orden 114: no se le puede abrir un servidor desde la nube; tiene la evidencia 66. Sigue NO
  PROBADO: Firestore/Storage reales, integraciones externas y equipos físicos.

## Cómo se fusiona (error 30)

- La puerta anota el commit aprobado en `.ak-puerta-verde.json`; sin `expectedHeadSha` igual, no.
- `AK_PRUEBAS_TODAS=true AK_REGISTRO_POR_PRUEBA=<archivo>` deja el resultado de cada prueba.
- Después de una fusión con conflicto, `git diff --name-only --diff-filter=U` antes de agregar (error 32).
- Orden 116: Gemini red social/automáticos; Claude personal/permisos y compilación.
- Informe 66: otros pendientes de comida, barra, permisos, video, voz y contador.
  Contrastar con la tanda antes de programar; una orden escrita no significa arreglado.
- Recibos por empleado sí exigen SUELDOS a través del getter interno: caso descartado.
- Falta recorrido interno real aislado de producción y retest de cada arreglo en su SHA.
  Ninguna de las 14 áreas se certifica por conteo global de pruebas.
- Voz real paga sigue pendiente del dueño. La prueba física queda al final.
- La puerta exige el mismo `expectedHeadSha` aprobado; no cambiar rama ni `commit -a`
  durante una verificación. El dueño conserva cambios de funcionamiento y fusión.
