# Orden151 - Propagar el fallo real, no la lista vacia inventada

Claude: lector compartido, permisos y verificacion. Gemini: interfaz SOLO si
el contrato correcto exige ajuste; Claude compila. UNA entrega con los dos
consumidores; no cambiar permisos ni sumar pantallas. Codex revisa.

Fuente EJECUTADA/contrastada main ca5b714d75635b633bf4618529938ed37fd40f73.
NO CONTRASTADO CON LA TANDA CORRECTIVA LOCAL NO SUBIDA. Verificar su HEAD
antes de programar. 1288 es QA, no arreglo. No duplicar147/149/150 ni reabrir
Video de Vida148 aceptado98: este residuo usa otro lector y otros consumidores.

## Dos efectos reproducidos, una causa

Informe docs/evidencias/100-portal-calendario-lectura-real.md con PNG, HTTP,
SDK y cortes controlados en computadora/movil.
- LEC100-PORTAL P2: una fiesta existente con enlace habilitado, ante corte
  de lectura, muestra Portal no encontrado/pedir nueva clave. No Reintentar.
  Quitar corte y recargar abre la misma fiesta intacta.
- LEC100-FECHAS P2: con fiesta de fecha2027-08-08 en base, corte real de
  lectura de fiestas retorna Next Action200/[] al formulario. NO muestra su
  advertencia de revisar calendario. No guardar presupuesto durante la sonda.

El lector listCollectionFromFirestore en src/lib/firebase-sync.ts:553 traga
errores y devuelve[]. leerColeccion de src/lib/fiesta/leer-fiestas.ts no puede
propagar un error ya borrado; su propio catch puede caer a JSON. El arreglo
del catch superior existe, pero no recibe el fallo. No basta modificar texto
o repetir el test que simula leerFiestasCrudas/getFiestas lanzando.

## Correccion acotada y contratos que conservar

Separar coleccion genuinamente vacia, modo local/build/sin cliente intencional
y lectura Firestore que fallo. Propagar ese ultimo estado a los consumidores
que deben informar incertidumbre, sin convertir build o modo local en error.
No establecer un throw global sin revisar consumidores y el fallback intermedio.
Una copia local vieja no demuestra que el enlace expire ni que una fecha este libre.
Elegir el mecanismo minimo compatible con el repositorio (resultado tipado o
lector estricto acotado); documentar cuando es valido usar fallback local.

Portal: getFiestaByAccessKey debe llevar fallo real hasta PortalError;
notFound queda para clave inexistente/deshabilitada. Comprobar que el boton
Reintentar realmente vuelva a leer y recupere la misma fiesta al volver la base;
reset escrito no es prueba. No generar otra clave ni alterar los datos.
Calendario: getOcupiedDates debe distinguir incertidumbre de []; mantener
la advertencia existente y la decision aprobada de permitir seguir revisando
calendario. No cambiar el negocio a bloquear todas las fechas sin aprobacion.

Consumidores relacionados de leerFiestasCrudas: fiesta.actions, portal.actions,
decoracion.actions, simulador-v2, poner-al-dia, notifications, crm, parte-manana
y cron recordatorio-a-los-invitados. Inventario de riesgo, NO defectos probados
en todos ellos. Validar solo cambios de contrato, no reauditar toda la app.
Conservar sesiones/permisos, modos de compilacion y ausencias genuinas.

## Aceptacion sobre el SHA corregido

Usar sonda100 con base ficticia y SIN JSON de la fiesta. Cortar Query.get en
la coleccion fiestas, sin reemplazar lector crudo/acciones/UI por mocks.
1. Portal valido: aviso honesto con Reintentar PC/movil; no falso expirado.
2. Quitar corte, tocar Reintentar: misma fiesta, datos intactos, sin reload de
   rescate en la prueba positiva. Clave realmente ausente conserva notFound.
3. Presupuesto: aviso de fechas ante fallo real; no [] silencioso como lectura
   satisfactoria. Coleccion realmente vacia conserva comportamiento normal.
4. Verificar ambos consumidores en el conjunto y consumidores afectados por
   cualquier cambio compartido. Claude registra build, SHA y entorno.

Prueba permanente adicional propuesta PENDIENTE de crear/ejecutar:
tests/e2e/portal-y-fechas-error-lectura-real.spec.ts. Las sondas documentales
existen y sus negativos NO certifican que el arreglo ya este hecho.

```comprobar
archivo: src/lib/firebase-sync.ts
usa: listCollectionFromFirestore en src/lib/fiesta/leer-fiestas.ts
usa: leerFiestasCrudas en src/app/actions/fiesta/portal.actions.ts
usa: getFiestaByAccessKey en src/app/portal/c/[accessKey]/page.tsx
usa: PortalError en src/app/portal/c/[accessKey]/error.tsx
usa: getOcupiedDates en src/app/(app)/presupuestos/nuevo/crear/page.tsx
prueba: docs/evidencias/100-portal-reader.spec.ts
prueba: docs/evidencias/100-calendario-reader.spec.ts
```
