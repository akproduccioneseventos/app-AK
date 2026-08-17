# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 17 de agosto de 2026, cierre.
**Estado de la app:** sana. Verificada sobre `main` **después** de fusionar:
acentos limpios, tipos en cero, 1717 pruebas, compila, 20 de seguridad de la base.
**Propuestas abiertas:** ninguna. **Órdenes pendientes:** ninguna.

## Está todo hecho

**Las diecisiete mejoras que eligió el dueño.** La última era el recuerdo de cada
invitado, y quedó terminada: abre su enlace al día siguiente, ve **sus** fotos
primero completadas con las más queridas de la noche, se lo puede bajar como video
vertical para las historias —armado en su propio celular, sin gastar— y se manda
el enlace a sí mismo por WhatsApp. La app no le escribe a nadie.

## Lo que hay que saber de esa última tanda

- **De quién es cada foto se guarda con candado.** Sólo si la persona probó tener
  su enlace personal, en el muro y en las estaciones. Un identificador suelto no
  se guarda nunca: sin eso, cualquiera mandaba el de otro y esas fotos le
  aparecían a esa persona como suyas. **Sirve de acá en adelante**: las fiestas
  viejas no tienen el dato y no se puede recuperar.
- **No se inventan teléfonos.** La invitada que no deja contacto se guarda sin
  teléfono y la ficha lo aclara. El simulador **sigue exigiendo** celular.

## Lo que costó y no hay que repetir

- **Escribir una ficha del CRM a mano en el archivo.** Una entrega lo hizo para
  saltear una validación: quedaba sin etapa del embudo ni historial y **en
  producción ni llegaba a la base**. Siempre por la función del CRM.
- **Guardar de quién es algo sin comprobar el permiso.** Pasó en tres lugares en
  una misma entrega. Si el dato identifica a una persona, se comprueba.
- **Código contra funciones y campos que no existen.** Lo agarra `npx tsc
  --noEmit` en un minuto, y las pruebas NO lo agarran.
- **Sacar un campo "que no se usa" sin buscar quién lo lee.**
- **Dos builds a la vez en la misma carpeta** se pisan y dan una falla inventada.

## Decisiones del dueño

Descartó el precio variable por fecha, alquilar la app a otros salones y el
"ensayo de la fiesta". `TriviaAdminPanel` queda sin enchufar a propósito.
