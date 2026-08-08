# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión, así que si crece más de 40 líneas deja de servir. Lo histórico va a
`ESTADO-AUDITORIA.md`, que no se lee salvo que haga falta.

Quien cierre una sesión reescribe este archivo. No se acumulan tandas: se pisa.

---

**Última actualización:** 8 de agosto de 2026
**Rama:** todo fusionado en `main`. No hay propuestas abiertas.
**Estado:** compila, 1295 pruebas en verde, 92 de navegador, sin acentos rotos.

## Cómo se trabaja

Claude audita con los ayudantes económicos y **verifica cada hallazgo leyendo el
código** antes de escribirlo. Deja la orden en `docs/ordenes/`. Gemini programa y
sube. Claude verifica y fusiona; si viene rota vuelve a Gemini, salvo que sea un
renglón. Plata, cobros, comida y permisos los escribe Claude.

Dos reglas del dueño: **un módulo se termina, no se deja a medias**, y **no
alcanza con arreglar** — cada trabajo se mira con tres preguntas: qué está roto,
qué es incómodo de usar y qué se ve mal.

## Entretenimiento: TERMINADO

Los cuatro bloques de `docs/ordenes/entretenimiento-02.md`, fusionados y probados
en navegador.

## Organización: EMPEZADO

Ya fusionado (#879), lo que era de Claude por tocar comida, plata y privacidad:

- Celíacos y el reporte al catering contaban **filas** en vez de **personas**: una
  familia de cinco celíacos era un solo plato.
- En la lista de carga, el **precio** de un activo se cargaba como **cantidad**.
- El PDF del itinerario mostraba las notas internas del organizador y no filtraba
  los momentos marcados como no visibles. Ese PDF lo ven proveedores.
- La referencia de maquetación llevaba seis días en rojo por un cambio global del
  3 de agosto: regenerada.

## Lo que falta: `docs/ordenes/organizacion-01.md`

Cuatro bloques para Gemini. El **A** es el urgente: las bebidas nunca llegan a la
lista de compras, el autoguardado del diseño de decoración falla en silencio, los
recibos se pierden al recargar, y el aviso al equipo puede no salir nunca.

**Ojo:** `npm run build` ya es control obligatorio. Estuvo roto seis días porque
el revisor de tipos pasaba y el build no.
