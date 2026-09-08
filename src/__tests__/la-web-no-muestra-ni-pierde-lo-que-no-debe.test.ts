/**
 * MATAFUEGO de dos defectos de la web de venta, encontrados por Codex el 8 de
 * septiembre de 2026 y comprobados uno por uno.
 *
 * 1. La galeria de la portada mostraba **borradores y publicaciones programadas**.
 * 2. El prospecto que llegaba de un anuncio pago se guardaba como si hubiera
 *    llegado solo: se perdia que anuncio lo trajo.
 */
import { seMuestraEnPublico } from '@/lib/instagram/public-feed';
import { canalDelProspecto, commercialAttributionFromSearchParams } from '@/lib/commercial/acquisition';

function comoSiFueraLaDireccion(valores: Record<string, string>) {
  return { get: (clave: string) => valores[clave] ?? null };
}

describe('La galeria publica solo muestra lo publicado', () => {
  it('lo publicado y lo importado de Instagram si se muestra', () => {
    expect(seMuestraEnPublico('Publicado')).toBe(true);
    expect(seMuestraEnPublico('Importado de IG')).toBe(true);
    expect(seMuestraEnPublico('Importado historial')).toBe(true);
  });

  it('un borrador NO sale en la web', () => {
    expect(seMuestraEnPublico('Borrador')).toBe(false);
  });

  it('una publicacion programada para mas adelante NO se adelanta sola', () => {
    expect(seMuestraEnPublico('Programado')).toBe(false);
  });

  it('lo que fallo al publicarse NO sale', () => {
    expect(seMuestraEnPublico('Falló')).toBe(false);
    expect(seMuestraEnPublico('Error')).toBe(false);
  });

  it('ante un estado desconocido o vacio, NO se muestra', () => {
    expect(seMuestraEnPublico('Estado que alguien invente manana')).toBe(false);
    expect(seMuestraEnPublico('')).toBe(false);
    expect(seMuestraEnPublico(undefined)).toBe(false);
  });
});

describe('No se pierde de donde vino el prospecto', () => {
  it('las etiquetas de los anuncios se leen', () => {
    const a = commercialAttributionFromSearchParams(
      comoSiFueraLaDireccion({ utm_source: 'facebook', utm_campaign: 'quince-septiembre' }),
    );
    expect(a.source).toBe('facebook');
    expect(a.campaign).toBe('quince-septiembre');
  });

  it('los enlaces viejos siguen andando igual', () => {
    const a = commercialAttributionFromSearchParams(
      comoSiFueraLaDireccion({ source: 'instagram', campaign: 'bodas' }),
    );
    expect(a.source).toBe('instagram');
    expect(a.campaign).toBe('bodas');
  });

  it('si no hay ninguna etiqueta, queda como directo: no se inventa un canal', () => {
    expect(commercialAttributionFromSearchParams(comoSiFueraLaDireccion({})).source).toBe('direct');
  });

  it('la landing NO pisa el anuncio que lo trajo', () => {
    // Llego de un anuncio de Facebook y aterrizo en la landing de bodas.
    expect(canalDelProspecto('facebook', 'landing_bodas')).toBe('facebook');
    expect(canalDelProspecto('instagram', 'landing_xv')).toBe('instagram');
    expect(canalDelProspecto('campaign', 'landing_eventos')).toBe('campaign');
  });

  it('si no se sabe de donde vino, manda la pagina donde aterrizo', () => {
    expect(canalDelProspecto(undefined, 'landing_bodas')).toBe('landing_bodas');
    expect(canalDelProspecto('direct', 'landing_xv')).toBe('landing_xv');
  });
});
