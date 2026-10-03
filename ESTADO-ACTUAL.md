# Acá quedé

**3 de octubre de 2026.** Fusionadas la 1255 (cobros COB06-09, lista de invitados con sesión,
contador de Codex en Windows) y la 1251 (video resumen de 66 s medidos, voz de Gemini y del
teléfono con dos interruptores, ajustes del asistente sólo para administración). Las dos con la
puerta completa, todas las pruebas de navegador.

Rama `claude/ponte-al-dia-qtrho3`, sin fusionar (sólo documentos, va con la próxima tanda): la
evidencia 66 para Codex, navegador prueba por prueba (`docs/evidencias/66-navegador-completo.*`).

## Espera a Gemini — UNA sola propuesta

- **112, B.1 (AUD01):** el contador de Codex tiene que cubrir las 416 rutas y enterarse de los
  cambios en lo compartido. Está masticado en la orden.

## Codex

- Cobros: COB01-05 confirmados; COB06-09 arreglados (1255), falta que la vuelva a mirar.
- Orden 114: no se le puede abrir un servidor desde la nube; tiene la evidencia 66. Sigue NO
  PROBADO: Firestore/Storage reales, integraciones externas y equipos físicos.

## Cómo se fusiona (error 30)

- La puerta anota el commit aprobado en `.ak-puerta-verde.json`; sin `expectedHeadSha` igual, no.
- `AK_PRUEBAS_TODAS=true AK_REGISTRO_POR_PRUEBA=<archivo>` deja el resultado de cada prueba.
- Después de una fusión con conflicto, `git diff --name-only --diff-filter=U` antes de agregar (error 32).
