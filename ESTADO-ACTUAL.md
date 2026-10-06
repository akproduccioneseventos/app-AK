# Auditoria 70: simuladores y contabilidad, cierre NO aprobado

6/10/2026. Base main `6a2143ffe6c257ca94e9761dd7cfacfafafe8e35`, PR1257 fusionada.
Rama documental `codex/auditoria-simulador-contable-20261006`. Sin PR abiertas
al iniciar. No se programo app, compilo ni fusiono.

## Comprobado

- 599 suites / 3445 pruebas verdes; seis sondas nuevas reproducen defectos.
- PDF sintetico largo: cuatro paginas renderizadas y vistas sin recortes visibles.
- Informe `docs/evidencias/70-simuladores-y-contabilidad.md`, originales y hashes
  en `docs/evidencias/70-resultados/`. No equivale a auditoria integral aprobada.

## Una orden para Claude

- 120: COB10 (personal cambia cobros), GAS01 (permisos gastos), GAS02 (duplicacion),
  GAS03 (NaN/Infinity), PLAN01 (plan viejo deshace pago), LEDGER01 (saldo sin ajuste).
- Persistencia sintetica, sin datos reales. Claude corrige/compila; Codex contrasta
  comportamiento sobre SHA de entrega. No declarar corregido por existir codigo.
- Siguen limites de orden 114: navegador integrado, permisos HTTP, descarga/CRM;
  catalogo real, 19 importados y Mercado Pago sandbox pendientes de comprobar.
- No tocar ni duplicar tandas Gemini 117 y 112 B.1.

## Entrega

- Sin fusion automatica. Documentos viajan con proxima tanda de correccion.
- No subir archivos runtime de notificaciones escritos por las pruebas.
