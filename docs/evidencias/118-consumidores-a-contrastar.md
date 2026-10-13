# Riesgos a probar despues de161; no fallos reproducidos

ACTUALIZACION119: manual SI reprodujo ACK1->2 en662 y ya esta corregido/probado
en a638c850;119-aceptacion.json,6nativos PC/Pixel7. No repetir esa entrada.
Las entradas IA de abajo siguen RIESGOS NO ejecutados, no fallos confirmados.

ACTUALIZACION120: helper confirmAndSaveAssistantBudget usa Encargado/widget real,
no el RPC antiguo confirmarPresupuestoAsistente. Se corrigieron confirmaciones
falsas/vacios con evidencia120; ACK sigue sin ejecutar. sendAssistantMessage y
executeCrearPresupuesto no tienen consumidor UI encontrado en468: no reencargar
esa ruta como si fuera el chat actual. La ruta real es /api/multiagent/message.

Agente gpt-6-luna low, lectura acotada y cerrado. Fuente06c64eb5.
No repetir configurador, permisos, formulas ni recorridos con prueba vigente.
Contrastar YA-RESUELTO y tanda privada antes de convertir riesgos en orden.

savePresupuesto conserva API legacy; la nueva clave opcional no protege
automaticamente a consumidores que no la envian. Existen estas llamadas:

- src/app/(app)/presupuestos/nuevo/crear/page.tsx:474: guardado manual;
  isSaving/deshabilitado protege doble clic en espera, no acredita ACK perdido.
- src/lib/assistant/tools/executors.ts:259, executeCreateBudget: source
  simulator_assistant sin operationId. Reintento de herramienta aun no probado.
- src/lib/multiagent/assistant-crm-actions.ts:263, confirmAndSaveAssistantBudget:
  confirmacion explicita; doble confirmacion/resultado perdido no probado.
- src/app/actions/assistant.ts:783 create_budget,841 parser de texto,949 import
  imagen/PDF: tres entradas sin operationId. Repetir importacion DELIBERADA puede
  ser legitimo; no deduplicar por telefono ni transformar referencia en FAIL.

Lineas son de06c: verificar simbolo/consumidor nuevamente antes de programar.
No nuevas pruebas ejecutadas, correcciones de esos consumidores ni PASS global.
Prioridad siguiente: herramienta IA/confirmacion, con la misma distincion intento
vs nueva cotizacion, solo despues de reproducir. No exigir otra
PR por variante; juntar correcciones de la tanda y validar fuente final una vez.
