import fs from 'fs';
import path from 'path';
import { corregirPromesasDelBlog, textoQuePromete } from '@/lib/blog/sin-promesas';
import type { BlogPost } from '@/types/blog';

describe('Orden 176 - Bloque 4: El blog de bebidas no promete', () => {
  it('detecta promesas con "cálculo exacto"', () => {
    expect(textoQuePromete('cálculo exacto')).not.toBeNull();
    expect(textoQuePromete('Este es un cálculo exacto para la fiesta')).not.toBeNull();
  });

  it('corrige el post de bebidas sin promesas, sin "el doble" y con la aclaración de mayores de 18', () => {
    const jsonPath = path.join(process.cwd(), 'data/blog-posts.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const posts: BlogPost[] = JSON.parse(rawData);

    const postOriginal = posts.find((p) => p.slug === 'como-calcular-bebida-evento-salto');
    expect(postOriginal).toBeDefined();

    const corregidos = corregirPromesasDelBlog([postOriginal!]);
    const post = corregidos[0];

    const textoCompleto = [
      post.title,
      post.excerpt,
      post.takeaway,
      ...(post.checklist || []),
      ...post.sections.flatMap((s) => [s.heading, ...s.body]),
    ].join(' ');

    // 1. No debe contener "exacto"
    expect(textoCompleto.toLowerCase()).not.toContain('exacto');
    expect(textoCompleto.toLowerCase()).not.toContain('cálculo exacto');

    // 2. No debe contener "el doble"
    expect(textoCompleto.toLowerCase()).not.toContain('el doble');

    // 3. Debe incluir la aclaración sobre adultos mayores de 18 y servicio responsable
    expect(textoCompleto).toContain('mayores de 18');
    expect(textoCompleto).toContain('Es una estimación para calcular la compra, no una recomendación de consumo');
    expect(textoCompleto).toContain('servicio responsable');
  });
});
