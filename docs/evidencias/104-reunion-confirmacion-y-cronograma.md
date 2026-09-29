# Auditoría — persistencia de la reunión de organización, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Estado: PR abierta. Inspección estática del nuevo módulo, no probada en producción. Codex no ejecutó E2E.

## Hallazgos

### P1 — La reunión puede anunciar guardado/cierre aunque `saveFiesta` responda fallo

En `src/app/(app)/fiestas/nueva/reunion-organizacion/page.tsx`, los símbolos `guardarCambiosDirectos` y `handleCerrarReunion` hacen `await saveFiesta(...)` pero no inspeccionan el resultado. La acción real `src/app/actions/fiesta/fiesta.actions.ts:saveFiesta` devuelve un objeto `{success:false,error}` ante fallo de escritura o una validación de asignaciones, sin lanzar excepción. Por ello, el formulario actualiza su estado local y muestra “Cambios guardados” o “¡Reunión cerrada con éxito!” aun si la acción informa que no guardó. En el cierre, también se ignora el resultado del segundo guardado que incorpora la reunión al historial.

Impacto: el organizador puede cerrar la reunión y creer que el historial/acuerdos están guardados; al volver a abrir la fiesta, los cambios pueden faltar.

Prueba requerida: mockear `saveFiesta` para retornar `{success:false,error:'...'}` en el guardado normal y en el segundo guardado del cierre. No mostrar toast de éxito ni cambiar el estado local a confirmado; conservar entradas y comunicar el error. Comprobar recarga persistente en caso de éxito.

### P2 — “Momentos clave del cronograma” se puede editar, pero nunca se incluye en el guardado

El textarea `cronogramaNotas` se llena desde `fiesta.programa` y se presenta como editable en “Momentos Clave del Cronograma”. Sin embargo, `guardarCambiosDirectos` crea el objeto actualizado con música, decoración, catering, configuración y `reunionOrganizacion.respuestasExtra`, pero nunca lee `cronogramaNotas` ni modifica `programa`. El cierre genera acuerdos con otros campos, tampoco con esas notas. El texto ingresado se descarta al navegar o recargar.

Impacto: se pierden acuerdos operativos de horario que el encargado cree haber anotado.

Recomendación: definir si ese control edita el itinerario real o es solo un apunte de reunión. Si edita itinerario, escribirlo en `programa` con estructura compatible y evitar sobreescribir hitos existentes; si es nota, guardarlo en un campo de reunión que luego se muestre. Añadir prueba de editar, guardar, recargar y leer en el módulo que lo consume.

## Verificación

Comprobados el nuevo consumidor de reunión y el contrato real de retorno de `saveFiesta`. No se ejecutaron pruebas ni se modificó la app. El bloque de calendario/alergias/música no fue recorrido en navegador.
