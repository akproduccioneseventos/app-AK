const fs = require('fs');
const path = require('path');

const files = [
  'src/app/page.tsx',
  'src/app/public/blog/page.tsx',
  'src/app/simulador-ak/page.tsx',
  'src/app/simulador-de-presupuesto/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Eliminar espacios en blanco al final de las líneas
    const lines = content.split('\n');
    const cleanedLines = lines.map(line => line.trimEnd());
    const cleanedContent = cleanedLines.join('\n');
    fs.writeFileSync(filePath, cleanedContent, 'utf-8');
    console.log(`Espacios en blanco limpiados en: ${file}`);
  }
});
