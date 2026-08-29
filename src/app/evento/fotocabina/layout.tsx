import { Metadata } from 'next';

/**
 * La fotocabina se instala como programa aparte, y se declara acá.
 *
 * Primero se intentó cambiar el renglón del manifiesto desde el navegador, y no
 * servía: **ese renglón lo maneja el sistema de la app y lo vuelve a poner**, así
 * que la máquina seguía ofreciendo instalar la app entera. Declarándolo acá, el
 * navegador ve directamente el manifiesto de la estación.
 *
 * El ícono queda "Fotocabina AK" y **no está atado a ninguna fiesta**: se instala
 * una vez y al abrirlo se elige de qué fiesta es. Palabras del dueño: *"que quede
 * instalado; cuando entro pongo la fiesta que es y ta, así no hay que instalar a
 * cada rato."*
 */
export const metadata: Metadata = {
  title: 'Fotocabina | AK Producciones',
  description: 'Sacate fotos con marcos interactivos y subilas al muro.',
  manifest: '/api/manifest-estacion?estacion=fotocabina',
};

export default function FotocabinaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
