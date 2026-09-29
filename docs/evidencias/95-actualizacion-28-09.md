# Actualización de auditoría AK — 2026-09-28

## Evidencia recibida del dueño/equipo (no ejecución Codex)
No se adjuntó SHA, salida del runner ni artefactos; asociar los resultados a la tanda exacta antes de reutilizarlos como aprobación de otro commit o producción.

- 129 pruebas informadas como aprobadas para prospectos, clientes, agenda y planificación: concurrencia de escrituras, fechas/noches y asignación de empleados.
- 15 pruebas informadas como aprobadas para alertas de salón y control de equipos. Alertas de salón: próximas fiestas dentro de 30 días. La carga avisa si no alcanza equipo disponible en una fecha; no asumir que bloquea reservas.
- Mural: 14 pruebas informadas como aprobadas (offline/señal, permisos de invitado y moderación), más recorrido de navegador para configurarlo como estación y subir una foto como invitado.
- Tres pruebas del mural fueron omitidas intencionalmente: una requiere cámara, desactivada en ese entorno; dos son solo desktop y no se ejecutaron en móvil. No contarlas como fallidas.
- Decisión del dueño: un proveedor puede atender varios eventos por día; no agregar bloqueo/alerta de conflicto de proveedores.
- Evitar repetir esos casos si coincide SHA y configuración. Las pruebas/recorridos fueron informados por el equipo, no ejecutados por Codex.

## Hallazgos de Codex en web pública (extracción textual; falta navegador visual)
- Portada: la extracción pública muestra métricas `+0` eventos, `+0` años, `0%` clientes satisfechos y `0/7` soporte; también “cero fallas”, “Seguridad Absoluta”, reserva garantizada y promoción 360 “durante esta semana” sin condiciones en el texto extraído. Riesgo P2 de confianza/copy, pendiente confirmar tras hidratar JS y contrastar términos con AK. No modificar condiciones/precios sin aprobación.
- Club Uruguay: la página pública declara tres imágenes con captions y CTAs de visita, simulador y WhatsApp. No se comprobó carga visual ni clics.
- Simulador público: la URL sin parámetros y `?salon=club` sólo entregaron un icono en la extracción actual; un resultado indexado de hace tres semanas mostró “No pudimos cargar el catálogo”. No concluir falla actual sin navegador interactivo.
- Privacidad: la política pública informa categorías/finalidad general, Analytics/cookies, conservación general y solicitudes de acceso/corrección/borrado; no se probó el comportamiento real. Pendiente verificar canal de derechos, responsable/encargados, conservación y consentimiento para fotos identificables. No es un dictamen de incumplimiento.

Referencias públicas:
- https://akproducciones.uy/
- https://akproducciones.uy/club-uruguay
- https://akproducciones.uy/simulador-de-presupuesto
- https://akproducciones.uy/privacidad
- URCDP: https://www.gub.uy/unidad-reguladora-control-datos-personales/node/654
- URCDP derechos: https://www.gub.uy/unidad-reguladora-control-datos-personales/comunicacion/publicaciones/guia-proteccion-datos-personales-para-empresas-especial-micro-pequenas-1
- URCDP fotos como dato personal: https://www.gub.uy/unidad-reguladora-control-datos-personales/politicas-y-gestion/conoce-tus-derechos

## Límite operativo
- El navegador de Codex no pudo conectar con `127.0.0.1:3300`: `ERR_CONNECTION_REFUSED`. No atribuirlo a la app publicada.
- El Jest focalizado de Codex sobre mural se interrumpió después de más de dos minutos sin resultado; inconcluso, no fallido. El dueño/equipo informó luego que las suites pasaron.
- `git push` local no respondió con salida y se interrumpió; no afirmar subida hasta comprobar la rama remota.
- Reanudar pruebas visuales sólo en entorno habilitado. Contrastar siempre con SHA de tanda/producción y no repetir evidencia vigente.

## Club Uruguay: información comercial útil aún no explícita
La extracción de https://akproducciones.uy/club-uruguay presenta Salto, tres escenas descritas y CTA para cotizar/visitar/simular. No extrae capacidad, dirección/mapa, dimensiones, accesibilidad, parking, límites/horarios o equipamiento incluido. P2 oportunidad: publicar solo datos confirmados por AK. No se comprobó si aparecen en imágenes/controles ni si los CTAs funcionan; no es defecto de navegación confirmado.