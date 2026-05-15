export type PremiumTemplateSurface =
  | 'venta'
  | 'portal_cliente'
  | 'portal_invitado'
  | 'muro_social'
  | 'pantalla_led'
  | 'barra'
  | 'post_fiesta';

export type PremiumTemplate = {
  id: string;
  surface: PremiumTemplateSurface;
  name: string;
  goal: string;
  visualStyle: string;
  mustHave: string[];
  href: string;
};

export const PREMIUM_EXPERIENCE_TEMPLATES: PremiumTemplate[] = [
  {
    id: 'venta-xv-impacto',
    surface: 'venta',
    name: 'Venta XV impacto',
    goal: 'Mostrar en pocos minutos que AK vende una experiencia tecnologica completa.',
    visualStyle: 'Blanco, rojo, negro suave, fotos grandes, mockups y movimiento moderado.',
    mustHave: ['Mapa de tecnologia', 'Portal cliente', 'Muro social', 'Barra tactil', 'Post-fiesta'],
    href: '/experiencia-ak',
  },
  {
    id: 'cliente-simple-vip',
    surface: 'portal_cliente',
    name: 'Cliente simple VIP',
    goal: 'Que una persona con solo celular vea lo importante sin confundirse.',
    visualStyle: 'Botones grandes, bloques desplegables, portada personalizada y resumen arriba.',
    mustHave: ['Saldo', 'Contrato', 'Invitados', 'Reuniones', 'Mensaje unico a AK'],
    href: '/fiestas/nueva/portal-cliente',
  },
  {
    id: 'invitado-celular-claro',
    surface: 'portal_invitado',
    name: 'Invitado celular claro',
    goal: 'Confirmar asistencia, ver ubicacion y participar sin necesitar explicacion.',
    visualStyle: 'Primero movil, QR visible, textos cortos y acciones de una mano.',
    mustHave: ['RSVP', 'Ubicacion', 'Mesa', 'Musica', 'Subir foto'],
    href: '/fiestas/nueva/modulo-invitado',
  },
  {
    id: 'muro-fiesta-viva',
    surface: 'muro_social',
    name: 'Muro fiesta viva',
    goal: 'Que la pantalla de la fiesta se vea activa, moderna y controlada por AK.',
    visualStyle: 'Fondo oscuro elegante, fotos grandes, ticker AK, audiorritmico y moderacion.',
    mustHave: ['Fotos', 'Mensajes', 'Hashtag', 'Aprobacion', 'Modo pantalla'],
    href: '/fiestas/nueva/muro-social',
  },
  {
    id: 'led-venta-gigante',
    surface: 'pantalla_led',
    name: 'LED venta gigante',
    goal: 'Presentar la propuesta en TV/proyector sin verse como una pagina chica.',
    visualStyle: 'Tipografia grande, muy poco texto, imagenes protagonistas y transiciones simples.',
    mustHave: ['Portada', 'Servicios', 'Tecnologia', 'Galeria', 'Cierre comercial'],
    href: '/presentacion-led/portafolio',
  },
  {
    id: 'barra-social-touch',
    surface: 'barra',
    name: 'Barra social touch',
    goal: 'Convertir la barra en una experiencia de tragos, fotos y redes.',
    visualStyle: 'Tarjetas grandes, filtros, ficha del trago, video/descripcion y paso de redes.',
    mustHave: ['Carta', 'Pantalla barman', 'Foto social', 'Hashtag', 'Muro'],
    href: '/fiestas/nueva/barra-tecnologica',
  },
  {
    id: 'post-fiesta-recuerdos',
    surface: 'post_fiesta',
    name: 'Post-fiesta recuerdos',
    goal: 'Cerrar la fiesta con galeria, feedback y contenido reutilizable para marketing.',
    visualStyle: 'Galeria curada, resumen emotivo, mejores momentos y pedido de testimonio.',
    mustHave: ['Galeria', 'NPS', 'Testimonio', 'Referidos', 'Material redes'],
    href: '/fiestas/nueva/post-evento',
  },
];

export function getTemplatesBySurface(surface: PremiumTemplateSurface) {
  return PREMIUM_EXPERIENCE_TEMPLATES.filter((template) => template.surface === surface);
}
