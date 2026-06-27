const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
const catalogoPath = path.join(dataDir, 'catalogo-fotos.json');
const galeriaPath = path.join(dataDir, 'galeria-publica.json');
const connectionsPath = path.join(dataDir, 'social-connections.json');

console.log('--- Verificando Datos de Redes Sociales ---');

if (fs.existsSync(connectionsPath)) {
  const connections = JSON.parse(fs.readFileSync(connectionsPath, 'utf-8'));
  console.log('Conexiones configuradas:');
  connections.forEach(c => {
    console.log(`- Plataforma: ${c.platform}, Conectado: ${c.isConnected}, Username: ${c.username}`);
  });
} else {
  console.log('No existe el archivo social-connections.json');
}

if (fs.existsSync(catalogoPath)) {
  const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf-8'));
  const instagramPhotos = catalogo.filter(p => p.source === 'instagram' || p.id.startsWith('ig_post_'));
  console.log(`\nTotal fotos en catalogo: ${catalogo.length}`);
  console.log(`Fotos traidas de Instagram: ${instagramPhotos.length}`);
  if (instagramPhotos.length > 0) {
    console.log('Detalle de fotos de Instagram:');
    instagramPhotos.forEach(p => {
      console.log(`  - ID: ${p.id}, Categoria: ${p.categoriaServicio || p.category}, Titulo: ${p.titulo}`);
    });
  }
} else {
  console.log('No existe el archivo catalogo-fotos.json');
}

if (fs.existsSync(galeriaPath)) {
  const galeria = JSON.parse(fs.readFileSync(galeriaPath, 'utf-8'));
  const videos = galeria.videos || [];
  const instagramVideos = videos.filter(v => v.youtubeId?.startsWith('ig_post_') || v.id?.startsWith('ig_post_') || v.plataforma === 'instagram' || v.plataforma === 'archivo');
  console.log(`\nTotal videos en galeria: ${videos.length}`);
  console.log(`Videos/Reels traidos de Instagram: ${instagramVideos.length}`);
  if (instagramVideos.length > 0) {
    console.log('Detalle de videos de Instagram:');
    instagramVideos.forEach(v => {
      console.log(`  - ID: ${v.id}, Plataforma: ${v.plataforma}, Titulo: ${v.titulo}, URL: ${v.youtubeUrl}`);
    });
  }
} else {
  console.log('No existe el archivo galeria-publica.json');
}
