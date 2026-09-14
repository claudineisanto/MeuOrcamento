const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectDir = path.resolve(__dirname, '..');
const resDir = path.join(projectDir, 'android', 'app', 'src', 'main', 'res');
const srcIcon = path.join(projectDir, 'assets', 'images', 'svg', 'icon1.png');

if (!fs.existsSync(srcIcon)) {
  console.error('[ERRO] icon1.png nao existe:', srcIcon);
  process.exit(1);
}

console.log('');
console.log('SOBRESCREVENDO SPLASHSCREEN_LOGO e limpando arquivos .debug ...');
console.log('');

// Dimensoes oficiais drawable-* (mdpi base = 1x)
const densities = [
  { dpi: 'mdpi',    size: 48  }, // 1x
  { dpi: 'hdpi',    size: 72  }, // 1.5x
  { dpi: 'xhdpi',   size: 96  }, // 2x
  { dpi: 'xxhdpi',  size: 144 }, // 3x
  { dpi: 'xxxhdpi', size: 192 }, // 4x
];

(async () => {
  for (const d of densities) {
    const dir = path.join(resDir, 'drawable-' + d.dpi);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'splashscreen_logo.png');
    try {
      await sharp(srcIcon).resize(d.size, d.size, { fit: 'fill' })
        .png({ quality: 95, compressionLevel: 9, force: true }).toFile(out);
      const sz = (fs.statSync(out).size/1024).toFixed(1);
      console.log('  OK  drawable-' + d.dpi.padEnd(10) + '/splashscreen_logo.png  ' + sz.padStart(7) + ' KB  ' + d.size + 'x' + d.size);
    } catch (e) {
      console.log('  FALHA splashscreen_logo ' + d.dpi + ': ' + e.message);
    }
  }

  // Limpar arquivos .debug.png que o script anterior gerou por engano em mipmap-*
  console.log('');
  console.log('Limpando .debug.png desnecessarios em mipmap-* ...');
  let rem = 0;
  for (const d of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']) {
    const dir = path.join(resDir, 'mipmap-' + d);
    const fp = path.join(dir, 'ic_launcher_foreground.webp.debug.png');
    try { if (fs.existsSync(fp)) { fs.unlinkSync(fp); console.log('  removido: mipmap-' + d + '/ic_launcher_foreground.webp.debug.png'); rem++; } } catch(_){}
  }
  if (rem === 0) console.log('  nenhum arquivo .debug encontrado');

  console.log('');
  console.log('Concluido. Splashscreen logo = SEU icon1.png');
  console.log('Agora execute C:\\MeuOrsamento\\corrigir-icone-e-instalar.cmd');
  console.log('');
})();
