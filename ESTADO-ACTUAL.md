# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 18 de agosto de 2026.
**Estado de la app:** sana. Compila, 1787 pruebas en verde, sin acentos rotos.
**Propuestas abiertas:** ninguna. **Orden vigente:** ninguna.

## Lo que se cerró en esta tanda

**El centro de presencia digital quedó completo y verificado.** Entró la entrega
de Gemini con los cuatro bloques —publicación programada, textos sugeridos con
inteligencia artificial, reporte de qué red trajo cada cliente y aviso de
inactividad— más las correcciones que necesitaba para poder fusionarse.

**Las diecisiete mejoras que eligió el dueño están terminadas**, cada una anotada
en `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que había que corregir de esa entrega, y por qué importa

- **Publicar en las redes de la empresa estaba abierto al público.** El ejecutor
  que manda el posteo no pide permiso a propósito (la tarea programada no tiene
  sesión), pero estaba exportado desde un archivo de acciones. Ahora vive en
  `src/lib/presencia-digital/publicador.ts`. **No moverlo de vuelta.**
- **Tres campos escritos contra nombres que no existen.** Uno de ellos hacía que
  el monto atribuido a cada red diera siempre cero.
- **Las pruebas nuevas medían otra cosa:** no reemplazaban las funciones que la
  pantalla usa de verdad, así que nunca hubieran avisado de una rotura.

## Regla nueva, ya escrita en `CLAUDE.md`

Cuando algo se traba, **se para y se pregunta en dos líneas**. El modelo principal
no corre compilaciones ni pruebas: van a los ayudantes desde el primer minuto. Una
entrega que no compila se devuelve, no se repara.

## Lo que sigue

Lo que pida el dueño, o lo que muestre una fiesta de verdad. **La app está
terminada: no se lanzan auditorías generales.**
