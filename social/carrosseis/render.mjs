/* Able Development — render dos carrosséis Instagram.
   Uso:  node render.mjs [nome-do-post ...]   (sem args = todos os posts/)
   Saída: saida/<post>/slide-N.png a 2160×2700 (1080×1350 @2x). */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(DIR, 'posts');
const SAIDA = path.join(DIR, 'saida');

const filtro = process.argv.slice(2);
const arquivos = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.json'))
  .filter(f => !filtro.length || filtro.some(x => f.includes(x)))
  .sort();
if (!arquivos.length) {
  console.error('Nenhum post encontrado em posts/ para', filtro);
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 2,
});
page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
page.on('pageerror', e => { console.error('[pageerror]', e); process.exitCode = 1; });

await page.goto('file://' + path.join(DIR, 'template.html'));

for (const arq of arquivos) {
  const post = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, arq), 'utf8'));
  const destino = path.join(SAIDA, post.post);
  fs.mkdirSync(destino, { recursive: true });

  for (const [pendencia] of (post.pendencias || []).map(p => [p])) {
    console.warn(`  ⚠ pendência (${post.post}): ${pendencia}`);
  }

  for (let i = 0; i < post.slides.length; i++) {
    const slide = post.slides[i];
    await page.evaluate(
      ([s, meta]) => window.renderSlide(s, meta),
      [slide, { serie: post.serie, indice: i + 1, total: post.slides.length }]
    );
    // estouro de conteúdo é erro, não corte silencioso
    const estouro = await page.evaluate(() => {
      const s = document.querySelector('.slide');
      return s.scrollHeight > s.clientHeight || s.scrollWidth > s.clientWidth;
    });
    if (estouro) {
      console.error(`  ✗ ${post.post}/slide-${i + 1}: conteúdo estourou o canvas 1080×1350`);
      process.exitCode = 1;
    }
    const arquivo = path.join(destino, `slide-${i + 1}.png`);
    await page.screenshot({ path: arquivo });
    console.log(`  ✓ ${path.relative(DIR, arquivo)} (${slide.layout})`);
  }
}

await browser.close();
console.log(process.exitCode ? 'Concluído com erros.' : 'Concluído sem erros.');
