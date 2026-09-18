# Logistica: equipos y carga operativa - 2026-09-18

## Alcance y evidencia
Revision de funciones reales extraidas por AST, con almacenamiento y sesion simulados.
PR 1209, HEAD e43260f068a751b5c6e2cc519db84e595c14c89f. No es una prueba en produccion ni una auditoria completa de stock.
Graphify local no disponible: copia original del repositorio ausente; navegacion remota dirigida.
Se consultaron ESTADO-ACTUAL.md y YA-RESUELTO.md; no se encontro cierre previo de estos dos casos.
No se programa la app ni se compila. Gemini implementa logistica; Claude valida datos sensibles y compila.
No se afirma que otras IA hayan recibido o ejecutado este documento.

## LOG01 - P1 - La disponibilidad no suma renglones del mismo activo
En src/app/actions/fiesta/carga-operativa.actions.ts, checkAssetConflicts compara cada renglon por separado y excluye la fiesta actual de las otras reservas.
Sonda: catalogo con 10 unidades, dos renglones del mismo origenId con cantidades 6 y 6. Resultado: ambos hasConflict=false, aunque hacen falta 12.
Controles: un renglon de 6 no avisa; uno de 11 si avisa.
Consumidor real: src/app/(app)/fiestas/nueva/carga-operativa/page.tsx llama por categoria y, al agregar desde catalogo, con un solo item (lineas 226 y 537 del SHA indicado).
Orientacion para corregir: calcular demanda total por origenId en toda la lista candidata, incluidas categorias distintas, mas otras fiestas. No resolver solo sumando el argumento parcial. Conservar la politica actual de avisos; no agregar bloqueos de negocio sin autorizacion.
Aceptacion pendiente: 6+6 contra 10 debe avisar tanto en una categoria como en dos; cambiar/quitar una cantidad debe actualizar el aviso. Dos operadores y reservas simultaneas requieren prueba separada.

## LOG02 - P1 - Se puede borrar un equipo asignado despues de renombrarlo
En src/app/actions/activos-fijos.ts, deleteActivoFijo busca item.id, activoId o nombre, pero no origenId, que es la referencia creada por generateCargaFromActivos y por el selector real.
Sonda: item id=gen_asset, origenId=asset y nombre original. Si el catalogo conserva el nombre, borrar se rechaza; si el catalogo fue renombrado, la funcion llama al borrado y devuelve success=true.
Consumidor real: src/app/(app)/empresa/activos-fijos/page.tsx, deleteActivoFijo en linea 90.
Orientacion: proteger por identificador estable origenId, manteniendo compatibilidad con referencias historicas. No usar coincidencia de nombre como unica proteccion. Validar tambien la carrera entre asignacion y borrado.
Aceptacion pendiente: renombrar un activo asignado no debe habilitar su eliminacion; activo realmente libre si puede borrarse.

## Resultado y limites
Sonda docs/evidencias/logistica-sonda.cjs: 5 casos, 3 PASS y 2 FAIL (fallos reproducidos, no arreglados).
Ejecutar con TypeScript disponible: node docs/evidencias/logistica-sonda.cjs DIRECTORIO_SNAPSHOT.
El snapshot debe contener load.ts = src/app/actions/fiesta/carga-operativa.actions.ts y assets.ts = src/app/actions/activos-fijos.ts del SHA indicado.
No se probaron navegador autenticado, Firestore real, concurrencia distribuida, devoluciones parciales, roturas, historico de movimientos, consumibles ni carga fisica. No marcar el modulo completo aprobado.
No se tocaron datos de las 19 fiestas. No se creo PR ni se fusiono nada.
