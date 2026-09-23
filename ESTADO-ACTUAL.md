# Acá quedé

**23 de septiembre de 2026.** **Todo lo mío está fusionado** (1217, 1214, 1218 y la de la comida).

## Lo que entró hoy

- **Barra, fotos, salones y pagos de salones** aguantan varios servidores a la vez (1217).
- **De Gemini (1214):** secretario manos libres, salón 3D en el portal del cliente (con y sin
  clave) y escena armada sola. Se le sacó una línea que mandaba la clave del portal al navegador.
- **La verificación prueba lo nuevo, no toda la app** (orden del dueño): corre sólo las pruebas
  de navegador que el cambio alcanza, repite sólo lo que falló y compila una vez. Si el cambio
  toca algo general, corre todo.

## La parte de Claude de la orden 81: hecha (esta rama)

- **Plata:** cobros, facturas, recibos de sueldo, gastos y cupones ya no se pierden con dos
  operaciones a la vez ni entre servidores. Una lista vieja no pisa cobros ni borra.
- **Noche:** un voto por invitado, operadores sólo en su fiesta, trago sólo con su enlace.

## Pendiente, y es mío

Nada. Insumos y menús también quedaron protegidos (rama `fix/comida-entre-servidores`).

## Memoria del servidor

Subida a 1024 MB con el "sí" del dueño, después de medirla. Propuesta 1207 cerrada: traía
además un tope de tiempo a los guardados que no se quiere.

## Espera a Gemini

- **Orden 82:** FUSIONADA (propuesta 1221). Prospectos, clientes, agenda y mensajes protegidos entre servidores.
- **Orden 81 (Gemini):** HECHA en `feat/orden-81-gemini-recorridos-offline-equipo`. Fotocabina offline, colas aisladas, comprobación previa AK-100 y barra tecnológica con sus 4 pruebas E2E.
- Devoluciones viejas: todas al día en verde.

## Lo que ningún control cubre

Falta **un ensayo real** por rol, con fotocabina, 360, barra y conexiones de afuera.

## Trampas: mirar cuántas pruebas va a correr antes de esperar; `npm run limpiar:corrida`; no tocar código con la verificación andando.
