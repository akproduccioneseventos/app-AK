# Estado vigente: PR1205 y cuatro correcciones del metodo

2026-09-09. Codex revisa; no programa la app, compila ni fusiona.
PR #1205: `feat/ordenes-51-52-53-completas`, SHA
`1b65b7c585c26fe14ac4f8c8d7bc7738e408dcac`.
Main observado: `d65526d117646edcd94f12fd63046cf90e593a7d`.
#1204 se fusiono durante esta revision: sus pendientes ya son HISTORICOS.
Revisar HEAD antes de implementar; no extrapolar resultados a otro commit.

## 1. Entrega real, no main antiguo

Se leyeron diff y registros nuevos de Claude. La primera ejecucion tenia contratos
viejos: updateFiestaData, Arco3D y mapProgramaParaElCliente faltaban en el contexto
aislado. NO eran errores de la app. Se adapto solo el instrumental, manteniendo
assertions: funciones reales por AST, helper nuevo y guardado parcial simulado.

Resultado valido: **19 comprobaciones: 15 PASS, 4 FAIL**, sin errores del harness.
Control de compatibilidad del instrumental: al repetirlo contra #1204 devuelve
los mismos 7 PASS/12 FAIL anteriores. No se debilitaron assertions para dar verde.

| Casos | Resultado | Decision |
| --- | --- | --- |
| PLAN-01 a PLAN-06 | 6 PASS | Conservar, no reimplementar |
| DECO-03/05/06/07 | 4 PASS | Guardado de imagen, arco, rotacion y escala: conservar |
| PORTAL-01a/01b/02a/02b y PRESERVE | 5 PASS | Conservar privacidad y propagacion del error |
| DECO-01/02/04/08 | 4 FAIL | Pendientes acotados debajo |

IO/React simulados. PLAN-03 simula merge de campos, no certifica Firebase ni
concurrencia sobre un mismo campo. Sin build, GPU, E2E con sesion, IA paga ni
despliegue. No se certifican toda la app, permisos o todos los modulos.

## 2. Rutas y consumidores

Bloques archivo/usa de ordenes49-54: **18 rutas existen y 12 entradas usa tienen
llamada o montaje JSX**, no solo import/mencion, en este SHA. Los E2E propuestos
siguen pendientes. La ruta especifica objetada por Claude sigue sin identificarse;
no inventar una errata. Orden52 agrega mapa completo para evitar abreviaturas.

## 3. Responsables

Se corrige el cuerpo de las ordenes, no solo cabeceras: Claude lleva contabilidad,
cobros, comida y permisos; Gemini el resto; Claude compila. Privacidad del portal:
Claude. Diagnostico visual de login: Gemini; sesion/autorizacion: Claude.
No pedir otra vez casos corregidos ni afirmar que subir una orden inicia otra IA.

## 4. Servicios de venta

#1204 tenia estaciones dentro de details sin open. En #1205 **ya estan fuera**:
control AST de InteractiveTechShowcase/TechnologyExperienceSection sin ancestro
details cerrado. Claude corrigio tambien
`src/__tests__/50-la-app-de-tu-fiesta-recorrido.test.ts`. NO reimplementar.
Falta visibilidad real PC/movil: AST no detecta todo ocultamiento por CSS ni prueba
conversion. Fotocabina/360/espejo deben seguir visibles sin expandir.

## Pendientes de orden52

1. DECO-08: `src/app/(app)/fiestas/nueva/invitados/layout/page.tsx:365` espera
   updateDecoracionFiestaActual pero devuelve success:true aunque falle. Gemini:
   propagar resultado a useAutoSave, mostrar error y permitir reintento. Revisar
   tambien captura. Aceptacion: fallo no anuncia guardado; reintento persiste/recarga.
2. DECO-01/02: generarVisualizacionSalonAi en
   `src/app/actions/fiesta/decoracion.actions.ts` ignora salonFotoUrl y usa
   colorPalette viejo al editar paletaColores. Gemini corrige contrato/paleta;
   Claude revisa acceso y resolucion segura de URLs.
3. DECO-04: dos solicitudes con un cupo llaman dos veces al generador simulado.
   Claude: reserva/idempotencia para proteger gasto y persistencia. No aumentar
   cupo ni hacer llamadas pagas. Gemini conecta UI despues de esas protecciones.

La accion IA **no tiene consumidor TSX** en este SHA: es deuda antes de conectarla,
no gasto real comprobado ni un flujo ya accesible al cliente. Estos cuatro FAIL no
cubren toda orden52: exportacion PNG, paleta en portal, fotos reales y experiencia
visual siguen pendientes de sus comprobaciones. No declararlas resueltas.

## Repeticion

```powershell
node docs/evidencias/contrastar-sondas.cjs C:/Users/Usuario/Documents/Codex/ak-contraste-1205-1b65b7c C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript
```

Node v24.19.0. SHA256 de sondas usadas:
- 51: 3cf2f6c3bf624443a64e941572e12b2a98a44b7a1fe847ddbb50cfbd457fe493
- 52: 3a659974548316691027158fad64c4bd9c90bf8038cee7473e30d6072c5f79cc
- 54: 0a6e372880ad78e31b09664639b4c92e2c4fb990c5373051cf5ab93e71a03009

Documentacion/instrumental viajan con la tanda; no PR documental independiente.
