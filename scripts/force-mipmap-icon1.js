const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectDir = path.resolve(__dirname, '..');
const resDir = path.join(projectDir, 'android', 'app', 'src', 'main', 'res');
const srcIcon = path.join(projectDir, 'assets', 'images', 'svg', 'icon1.png');

if (!fs.existsSync(srcIcon)) {
  console.error('[ERRO] icon1.png nao existe em:', srcIcon);
  process.exit(1);
}
if (!fs.existsSync(resDir)) {
  console.error('[ERRO] Pasta android/res nao existe. Rode primeiro expo prebuild.');
  process.exit(2);
}

console.log('');
console.log('SOBRESCREVENDO TODOS OS ICONE DO MIPMAP ANDROID DIRETAMENTE:');
console.log('  Fonte: ' + srcIcon);
console.log('  Destino: ' + resDir);
console.log('');

// Densidades padrão Android (dimensões oficiais em pixels para launcher icons)
// Referencia: https://developer.android.com/training/multiscreen/screendensities
const densities = [
  { dpi: 'mdpi',    size: 48   }, // 1x
  { dpi: 'hdpi',    size: 72   }, // 1.5x
  { dpi: 'xhdpi',   size: 96   }, // 2x
  { dpi: 'xxhdpi',  size: 144  }, // 3x
  { dpi: 'xxxhdpi', size: 192  }, // 4x
];

const paletteBg = { r: 76, g: 175, b: 80 }; // #4CAF50 cor primaria do app

async function convertWebp(outPath, size, options) {
  let pipeline = sharp(srcIcon, { failOnError: false }).resize(size, size, { fit: 'fill' });
  if (options && options.round) {
    // Mascara circular
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#ffffff"/></svg>`);
    pipeline = pipeline.composite([{ input: mask, blend: 'dest-in' }]);
  }
  if (options && options.monochrome) {
    pipeline = pipeline.greyscale().threshold(128).negate().ensureAlpha();
    // Manter apenas silhueta preta + canal alpha
    pipeline = pipeline.ensureAlpha();
  }
  await pipeline.webp({ quality: 95, alphaQuality: 100, effort: 6, lossless: false }).toFile(outPath);
}

async function convertPngLike(outPath, size) {
  // Para foreground adaptive icon: usamos icone completo (transparente no alpha)
  await sharp(srcIcon).resize(size, size, { fit: 'fill' }).png({ quality: 95, compressionLevel: 9, force: true }).toFile(outPath + '.debug.png');
  await sharp(srcIcon).resize(size, size, { fit: 'fill' }).webp({ quality: 95, alphaQuality: 100, effort: 6 }).toFile(outPath);
}

async function solidWebp(outPath, size, rgb) {
  await sharp({ create: { width: size, height: size, channels: 3, background: rgb } })
    .webp({ quality: 90, effort: 6 })
    .toFile(outPath);
}

(async () => {
  let ok = 0, total = 0;
  for (const d of densities) {
    const dir = path.join(resDir, 'mipmap-' + d.dpi);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

    // 1) ic_launcher.webp (ícone completo quadrado)
    total++;
    try {
      await convertWebp(path.join(dir, 'ic_launcher.webp'), d.size, {});
      const sz = (fs.statSync(path.join(dir, 'ic_launcher.webp')).size/1024).toFixed(1);
      console.log('  OK  mipmap-' + d.dpi.padEnd(10) + '/ic_launcher.webp'.padEnd(36) + sz.padStart(8) + ' KB  ' + d.size + 'x' + d.size);
      ok++;
    } catch (e) { console.log('  FALHA ic_launcher ' + d.dpi + ': ' + e.message); }

    // 2) ic_launcher_round.webp (versao circular do launcher)
    total++;
    try {
      await convertWebp(path.join(dir, 'ic_launcher_round.webp'), d.size, { round: true });
      const sz = (fs.statSync(path.join(dir, 'ic_launcher_round.webp')).size/1024).toFixed(1);
      console.log('  OK  mipmap-' + d.dpi.padEnd(10) + '/ic_launcher_round.webp'.padEnd(36) + sz.padStart(8) + ' KB  round');
      ok++;
    } catch (e) { console.log('  FALHA ic_launcher_round ' + d.dpi + ': ' + e.message); }

    // 3) ic_launcher_foreground.webp (adaptive-icon foreground: icone completo size maior)
    //    Foreground adaptive-icon: tamanho 108dp → maior que o launcher
    const fgSize = Math.round(d.size * 1.5); // foreground é desenhado dentro de area mascarada 72dp de 108dp
    total++;
    try {
      await convertPngLike(path.join(dir, 'ic_launcher_foreground.webp'), fgSize);
      const sz = (fs.statSync(path.join(dir, 'ic_launcher_foreground.webp')).size/1024).toFixed(1);
      console.log('  OK  mipmap-' + d.dpi.padEnd(10) + '/ic_launcher_foreground.webp'.padEnd(36) + sz.padStart(8) + ' KB  ' + fgSize + 'x' + fgSize);
      ok++;
    } catch (e) { console.log('  FALHA foreground ' + d.dpi + ': ' + e.message); }

    // 4) ic_launcher_background.webp (solido cor primaria verde)
    total++;
    try {
      await solidWebp(path.join(dir, 'ic_launcher_background.webp'), Math.round(d.size*1.5), paletteBg);
      const sz = (fs.statSync(path.join(dir, 'ic_launcher_background.webp')).size/1024).toFixed(1);
      console.log('  OK  mipmap-' + d.dpi.padEnd(10) + '/ic_launcher_background.webp'.padEnd(36) + sz.padStart(8) + ' KB  solido #4CAF50');
      ok++;
    } catch (e) { console.log('  FALHA background ' + d.dpi + ': ' + e.message); }

    // 5) ic_launcher_monochrome.webp (preto silhueta)
    total++;
    try {
      await convertWebp(path.join(dir, 'ic_launcher_monochrome.webp'), d.size, { monochrome: true });
      const sz = (fs.statSync(path.join(dir, 'ic_launcher_monochrome.webp')).size/1024).toFixed(1);
      console.log('  OK  mipmap-' + d.dpi.padEnd(10) + '/ic_launcher_monochrome.webp'.padEnd(36) + sz.padStart(8) + ' KB  monocromatico');
      ok++;
    } catch (e) { console.log('  FALHA monochrome ' + d.dpi + ': ' + e.message); }
  }

  console.log('');
  console.log('Resultado: ' + ok + '/' + total + ' arquivos gerados.');
  if (ok === total) {
    console.log('');
    console.log('SUCESSO! TODOS os mipmap agora usam DIRETAMENTE o seu icon1.png.');
    console.log('Nao dependemos mais do resultado do Expo prebuild para os icones.');
    console.log('');
    console.log('Proximo passo: gerar APK novamente e instalar.');
    console.log('  Rode:  C:\\MeuOrsamento\\gerar-build-apk.cmd');
    console.log('  Ou:    cd C:\\MeuOrsamento\\MeuOrcamento && npx expo run:android');
    console.log('');
  } else {
    console.log('Houve falhas.');
  }
})();
