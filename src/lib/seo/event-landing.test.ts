import { createEventLandingMetadata } from './event-landing';

describe('createEventLandingMetadata', () => {
  it('builds canonical and Open Graph metadata for a prospect landing', () => {
    const metadata = createEventLandingMetadata({
      slug: 'bodas',
      title: 'Bodas | AK Producciones',
      description: 'Produccion integral de bodas en Uruguay.',
      image: '/media/catalogo-servicios/boda_persuasiva.png',
      imageAlt: 'Boda producida por AK Producciones',
    });

    expect(metadata.alternates).toEqual({ canonical: '/landing/bodas' });
    expect(metadata.openGraph).toMatchObject({
      title: 'Bodas | AK Producciones',
      url: 'https://akproducciones.uy/landing/bodas',
      images: [{ url: '/media/catalogo-servicios/boda_persuasiva.png' }],
    });
  });
});
