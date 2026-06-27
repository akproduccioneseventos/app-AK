const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'app', 'simulador-ak', 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf-8');

// Reemplazos de color rojo a indigo en simulador-ak/page.tsx
content = content.replace(/selection:bg-red-500\/30/g, 'selection:bg-indigo-500/30');
content = content.replace(/text-red-400/g, 'text-indigo-400');
content = content.replace(/bg-red-500\/10/g, 'bg-indigo-500/10');
content = content.replace(/border-red-500\/20/g, 'border-indigo-500/20');
content = content.replace(/bg-red-700/g, 'bg-indigo-700');
content = content.replace(/hover:bg-red-600/g, 'hover:bg-indigo-600');
content = content.replace(/shadow-red-950\/30/g, 'shadow-indigo-950/30');
content = content.replace(/border-red-500\/35/g, 'border-indigo-500/35');
content = content.replace(/bg-red-600\/20/g, 'bg-indigo-600/20');
content = content.replace(/bg-red-600\/35/g, 'bg-indigo-600/35');
content = content.replace(/text-red-100/g, 'text-indigo-100');

fs.writeFileSync(targetFile, content, 'utf-8');
console.log('Reemplazos de colores completados en simulador-ak/page.tsx');
