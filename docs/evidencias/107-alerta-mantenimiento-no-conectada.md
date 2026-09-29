# Auditoría — alerta de mantenimiento sin consumidor conectado, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Estado: PR abierta; no probado en producción. Hallazgo por trazado estático del camino real.

## P1 — La alerta de mantenimiento preventivo nunca se evalúa con los activos

El motor nuevo `src/lib/automatizaciones-engine.ts:evaluarReglasParaFiesta` requiere recibir el tercer argumento `activos` para evaluar `mantenimiento_vencido`; si viene ausente/vacío devuelve `false`. Sin embargo, los consumidores reales en `src/app/actions/alertas.actions.ts` hacen:
- `getAlertasGlobales` → `evaluarReglasParaTodasLasFiestas(activas)`, sin cargar ni pasar activos.
- `getAlertasPorFiesta` → `evaluarReglasParaFiesta(fiesta)`, también sin activos.

`evaluarReglasParaTodasLasFiestas` evalúa cada fiesta con solo `fiesta` y `reglas`; no tiene argumento para activos. El test nuevo `el-mantenimiento-avisa-antes-de-la-fiesta.test.ts` llama el evaluador directamente con `[equipoVencido]`, así que cubre una ruta artificial que la bandeja no invoca.

Impacto: la configuración del mantenimiento y la regla pueden pasar pruebas unitarias, pero el aviso “antes de la fiesta” no aparece en alertas reales. Es una promesa sin conexión al consumidor.

Recomendación para Claude: conectar activos al cálculo de alertas de forma eficiente (una lectura por lote, no una por fiesta), preservando filtros de sesión y no llamando a red desde cliente. Agregar una prueba a nivel de `getAlertasGlobales`/`getAlertasPorFiesta` con fiesta y equipo vencido asignado, y un control que asegure que equipo sin mantenimiento configurado no dispara.

## Verificación y límites

Revisados el motor, la acción que abastece la bandeja y el test de unidad. No se ejecutó test, no se consultó Firestore, no se creó ni se envió alerta; el defecto se deduce de los argumentos efectivamente pasados por todos los consumidores inspeccionados.
