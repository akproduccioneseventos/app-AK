# Codex117 - Guardado del configurador y contraste de pendientes

Fuente app1656ac2e, HEAD de entrega479408f2, PR1293 ABIERTA. QA aislada;
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE. Main4c5ef2f9 no cambio.
Sin codigo app cambiado, sin nuevo build/Jest amplio. Se reutiliza116 SOLO para
su alcance original; esta sonda agrega evidencia, no modifica su aceptacion.

## Hallazgo nuevo y controles

- P1: perder ACK despues de guardar y reintentar duplica presupuesto:2->3 en PC
  y Pixel7, esperado2. Ambos resultados NOT_ACCEPTED, exit1 intencional de test.
  Se retiro respuesta HTTP tras route.fetch/body, no se bloqueo escritura.
- PASS: cortar antes del envio y reintentar guarda uno, total850, destino ID real;
  probado PC/movil con boton Generar Presupuesto Formal y SDK.
- P2 FRICCION ya152: indicador desktop cubre centro/lado derecho del boton
  inferior; foco teclado disponible. Movil3/3puntos libres. No se probo un click
  forzado a traves de overlay ni se declaro bloqueado el boton superior.
- La fila raw PASS de hitbox indica que se midio la observacion; NO acredita
  fullyUncovered:true.117-contraste clasifica desktop FRICCION sin ocultarla.
- El boton inferior sigue habilitado tras guardar. Por si solo no es un defecto:
  el dueno pide varias cotizaciones del mismo prospecto. La correccion debe
  distinguir nueva cotizacion deliberada de reintento incierto, no eliminarla.

Orden161 deja el contrato de arreglo y test real. Escribirse/subirse no inicia
Claude ni acredita correccion. No se fusiono ni publico.

## Reutilizacion para no repetir

155 firmador/exports ya corregidos por Claude en main: consumer real
/api/storage/signed-url usa permiso CONTABILIDAD, y looker-export lo exige sin
token de servicio. Suite los-documentos-de-plata-piden-permiso.test.ts tiene51
casos PASS en116-jest sobre1656 (incluye roles del firmador y operador/personal
403 en export). Son unidades con mocks de filesystem/proveedor, NO firma remota
Storage, token externo ni despliegue. Actualizar el pendiente con esta distincion.

Ayudante gpt-6-luna low, lectura acotada109/YA: no pudo derivar seis pendientes
actuales de inventario estructural antiguo. Su candidato backup/ZIP fue descartado
por director:116 ya lo verifica. Un agente no reemplaza contraste ni evidencia.
Agente cerrado. No se reaudito lo delegado ni se abrio otro solo para rellenar.

## Incidentes y limpieza

117-configurador-inicial conserva espera5s que vencio en PC. Server log confirma
guardado; repetido con60s paso. No fue un defecto de persistencia ni se borro el
fracaso inicial. Los dos fallos ACK quedan sin alterar el esperado2.
SDK propio vacio al cerrar app, puertos3301/8085 sin listeners, bytes locales
restaurados por fixtureGuard. Procesos propios detenidos; exit1 del wrapper por
Stop-Process es intencional, distinto de los2errores del test.

No imagenes/clientes reales: arrays de la copia QA vaciados temporalmente y
restaurados byte exacto; HTTPS bloqueado en navegador, proveedor WhatsApp sin
credenciales/SDK demo. Los19originales siguen sin certificado; no cargos/mails.

No porcentaje de cobertura funcional de109, no0errores globales. Quedan161,
friccion152, conciliacion funcional de109, avisos de dependencias no parcheados,
proveedores reales/Hosting/hardware y decisiones del dueno.
