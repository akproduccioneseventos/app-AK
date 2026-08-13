export const DEFAULT_CATALOGO_PRESENTACION_TEXT = [
  'En AK Producciones somos especialistas en transformar momentos especiales en recuerdos eternos.',
  'Nos encargamos de todo: decoración, catering, sonido, fotografía y coordinación general.',
].join(' ');

export const DEFAULT_CATALOGO_POR_QUE_TEXT = 'Un solo equipo para coordinar todo, con experiencia, calidad y seguimiento personalizado.';

/**
 * Los logos que se muestran mientras el dueño no cargue los suyos.
 *
 * **Son las imágenes que ya se venían mostrando**, alojadas en el sitio de Canva de
 * la empresa. Van sin nombre a propósito: en el catálogo impreso hay doce empresas y
 * acá hay once imágenes, y **no se sabe con certeza cuál corresponde a cuál**.
 * Ponerle "Antel" al logo equivocado es peor que no ponerle nada: es mostrarle al
 * cliente que confundimos a nuestros propios clientes.
 *
 * Una entrega anterior resolvió esto dibujando doce rectángulos de color con el
 * nombre escrito en una tipografía cualquiera. Eso no son los logos de esas
 * empresas: se ve barato y usa la marca de un tercero mal. Se descartó.
 *
 * **Lo que corresponde:** el dueño sube los doce logos de verdad desde
 * Ajustes → Contenido público, cada uno con su nombre, y ahí sí los nombres se
 * muestran en pantalla. Hasta entonces esto queda como estaba, sin inventar nada.
 */
export const DEFAULT_PARTNER_LOGOS = [
  { id: '1', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/fe2d7dfa46dc7147960c514af9542afa.png', name: '' },
  { id: '2', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/2ba335a8ad19794ec5917c23651f8786.jpg', name: '' },
  { id: '3', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/e104d91117bfcf4df0383ac04a53edea.jpg', name: '' },
  { id: '4', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/d81497c5c60f3fa14562a52efce1c1f0.jpg', name: '' },
  { id: '5', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/d9557e28cec3eb2dd748424d592e5eae.png', name: '' },
  { id: '6', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/5e07e7a5f80d64c01109ad4913af5b12.jpg', name: '' },
  { id: '7', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/1e9e70f06c8719b1d3ab987c7f7ab669.jpg', name: '' },
  { id: '8', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/ce9d2b2cdf34375322cc16f6722c35b2.png', name: '' },
  { id: '9', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/4b905537b49f745ed0d75cd51a0bb475.png', name: '' },
  { id: '10', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/dc47158bc14da0d9b32edec66286291e.png', name: '' },
  { id: '11', url: 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web/_assets/media/8dae09f60c3d5a787eec748695141348.jpg', name: '' },
];

/** Las doce empresas del catálogo impreso, para la ayuda de la pantalla de Ajustes. */
export const EMPRESAS_DEL_CATALOGO = [
  'Correo Uruguayo', 'Salto Hotel & Casino', 'Plus Medical', 'A.S.DE.M. y A.',
  'Woslen', 'APC Salto', 'INC', 'Antel', 'ABRA', 'INAU',
  'Intendencia de Salto', 'Club Uruguay',
];
