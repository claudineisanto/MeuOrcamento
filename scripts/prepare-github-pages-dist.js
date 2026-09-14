const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(process.cwd(), 'dist');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

if (!fs.existsSync(distDir)) {
  throw new Error('Pasta dist não encontrada. Gere o export web antes deste passo.');
}

const htmlFiles = walk(distDir).filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
  const relative = path.relative(distDir, file);
  if (relative === 'index.html' || relative === '404.html') continue;

  const parsed = path.parse(relative);
  const cleanTarget = path.join(distDir, parsed.dir, parsed.name, 'index.html');
  ensureDir(path.dirname(cleanTarget));
  fs.copyFileSync(file, cleanTarget);
}

const rootIndex = path.join(distDir, 'index.html');
const notFound = path.join(distDir, '404.html');
if (fs.existsSync(rootIndex)) {
  fs.copyFileSync(rootIndex, notFound);
}

fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');

console.log('Dist preparado para GitHub Pages com URLs amigáveis e fallback 404.');
