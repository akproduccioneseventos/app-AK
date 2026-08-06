# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 6 de agosto de 2026
**Ramas vivas:** `claude/repo-work-guidelines-l4u1tf` (entorno y reglas),
`fix/858-rescate-acentos` (rescate a medio hacer, NO fusionar)

## Qué quedó terminado

- Entorno: hoja de traspaso que se muestra sola al arrancar, tres ayudantes
  económicos configurados, navegador de pruebas ubicado solo, permisos
  preaprobados, comandos `/sano` y `/aca-quede`, habilidad `revisar-pr`.
- Detector de acentos rotos (`npm run check:acentos`), ya integrado al `/sano`.
- Reglas nuevas del dueño, guardadas: delegar siempre en los ayudantes
  económicos; fusionar directo cuando la propuesta pasa los controles; y decidir
  por cuenta propia entre reparar una propuesta rota, rehacerla o avisar.
- Se aclaró qué vale en Windows y qué vale en las sesiones web.
- **Propuesta 859 (portal del cliente) fusionada.** Verificada antes: tipos en
  cero, 1279 pruebas en verde, sin acentos rotos, sin choques.

## Qué quedó a medias

**Propuesta 858 ("Limpieza CRM", auditoría de Gemini): NO fusionar.** Traía 902
acentos rotos y no compilaba. En `fix/858-rescate-acentos` están reparados los
acentos (947 líneas) y cuatro errores de sintaxis, pero al compilar aparecen 12
errores nuevos: es trabajo sin terminar, no sólo dañado.

## Lo próximo, si nadie dice otra cosa

Rehacer limpio lo que valga de 858 en una rama nueva, y cerrar la vieja.
