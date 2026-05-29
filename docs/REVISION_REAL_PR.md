# Revisión real de correcciones

Esta PR no toca seguridad ni login.

Incluye correcciones concretas:

1. Multiagente contextual
- Los botones flotantes ya no muestran siempre todos los agentes.
- Cambian según la zona de la app.
- En contabilidad aparecen primero agentes contables/comerciales.
- En fiestas aparecen fiesta, supervisor, secretaria y contable.
- En marketing aparece marketing/comercial/general.
- Se corrigen textos visibles sin tildes.
- Se reduce el riesgo de tapar la pantalla en móvil.

2. Auditoría interna más honesta
- Se elimina el diagnóstico que declaraba módulos como completos sin prueba real.
- La auditoría ya no devuelve siempre listas vacías de errores.
- La IA de auditoría ahora debe ser prudente y no decir que la app está 100% lista sin verificación.

3. Criterio de prueba posterior
Después de fusionar hay que probar:
- Inicio.
- Multiagente en Inicio, Fiestas, Presupuestos, Contabilidad y Marketing.
- Que los agentes visibles cambien por pantalla.
- Que el panel abra y responda.
- Que la auditoría no diga falsamente que todo está completo.
