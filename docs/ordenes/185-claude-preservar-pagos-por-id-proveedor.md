#185 - Preservar pagos por identidad de proveedor, no por nombre coincidente

Actualizacion18/10, Codex148: correccion PRESENTE enPR1333 fuente03cd87d59
y suite REAL del helper4/4PASS. Causa del helper validada; no accion completa
ni persistencia real. Ver148-cierre-proveedor.md. No reencargar esta causa.

ID: AK-CODEX-147-PROVEEDOR-ID. ResponsableClaude. P2 reproducido en helper
financiero; accion completa/impacto real pendientes. Codex no programa app.
Fuentes contrastadas: PR1329b8491bda3f25aadc71f36f42d5878a47261bb1bf y
PR1330c7f9e3e6f960add2f970676819ec87b65b1af7c8.
Tambien se vio la nuevaPR1331f9fe10632e8137c15920cecf51ed35b28a14d92a dePWA:
no contiene este archivo helper; no es una correccion de este consumidor ni
se le atribuye el defecto por esa ausencia. No se audito esaPR entera.
NO CONTRASTADO CON LA TANDA PRIVADA ACTUAL DE CLAUDE: si ya esta corregido,
no duplicar; comprobar HEAD y ejecutar regresion antes de programar.

## Reproduccion concreta

src/lib/fiesta/reponer-la-plata.ts, reponerLaPlata, reposicion deestadosCompra:
find usa (o.proveedorId && o.proveedorId===e.proveedorId) || o.proveedor===e.proveedor.
Cuando el primerID no coincide, el nombre igual todavia gana la busqueda.

Guardado: A={proveedorId:'a',proveedor:'Proveedor QA',montoPagado:60.30};
B={proveedorId:'b',proveedor:'Proveedor QA',montoPagado:200}.
Entrada sincontabilidad: estadosCompra soloB con suID/nombre, sin montos.
Esperado preservarB200; observado60.30deA. Entrada conIDnuevo/nombreigual
tambien hereda60.30, cuando no deberia heredar un pago de otroID.

Dos controlesPASS: nombres distintos conIDs; legado sinID con nombres
distintos. Datos originales no mutados.2PASS/2FAIL por rama, UNA causa.
Script ejecutado: docs/evidencias/147-proveedores-identidad.mjs; resultadosJSON.

Consumidores verificados en src/app/actions/fiesta/fiesta.actions.ts:
saveFiesta llama actualizarFiesta con reponerLaPlata(datos,actual,authInfo);
sinLaPlata/updateFiestaPartial tambien lo usan. No se persistio dinero ni
ejecuto sesion/accion completa. No afirmar pagos reales corrompidos ni que
se haya probado el altaUI de proveedores con nombres repetidos.

## Criterio de correccion

UnID explicito no puede emparejarse con otroID solo por nombre. Conservar
compatibilidad de filas antiguas sinID con un criterio no ambiguo. Confirmar
reglas de datos antes de elegir fallback, sin impedir nombres repetidos por
una nueva regla de negocio ni cambiar permisos/importes/centavos.
Agregar regresion del helper y de saveFiesta/updateFiestaPartial autorizado
con datos ficticios. Mantener atomicidad y no tocar datos/cobros reales.
No copiar una rama entera ni aplicar el mismo cambio dos veces al integrar.

```comprobar
archivo: src/lib/fiesta/reponer-la-plata.ts
usa: reponerLaPlata en src/app/actions/fiesta/fiesta.actions.ts
prueba: src/__tests__/reponer-plata-identidad-proveedor.test.ts
prueba: PENDIENTE src/__tests__/guardar-fiesta-preserva-identidad-proveedor.test.ts
```
