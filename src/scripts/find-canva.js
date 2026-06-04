const fs = require('fs');
const path = require('path');

const targetFile = path.join('C:', 'Users', 'Usuario', '.gemini', 'antigravity', 'scratch', 'app-AK', 'src', 'app', 'portal-cliente', '[id]', 'page.tsx');
try {
  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('canva')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
} catch (e) {
  console.error(e);
}
