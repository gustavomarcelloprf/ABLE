#!/usr/bin/env node
// Construção geométrica da marca Able Development — v3 Apple-minimal.
// Regra da marca: geometria calculada, não estimada — mesma disciplina do
// contraste (scripts/contraste.mjs). Este script é a fonte de verdade de
// símbolo, ícone de plataforma e logo:
//   assets/simbolo.svg — O SÍMBOLO da marca, "Abertura" (aprovado pelo
//       fundador como definitivo): silhueta única, sem container, sem letra,
//       sem vértice nem aresta reta. Uma lâmina de pontas redondas sobre
//       centerline em espiral de Arquimedes, repetida por rotação calculada
//       de 120°. Ângulo, raio e unidade-base são fórmula; a interpolação
//       entre pontos é curva amostrada (erro de corda < 0,05).
//   assets/icone-app.svg — símbolo sobre squircle: container de PLATAFORMA
//       (tile de app/favicon), não faz parte da marca.
//   assets/logo.svg / logo-invertido.svg — lockup real (símbolo à esquerda,
//       nome à direita, baseline calculada), wordmark com contornos reais
//       da Switzer via scripts/wordmark.py.
// Rode: node scripts/geometria.mjs
//
// Histórico registrado: 1ª construção = monograma "A" sobre squircle
// (descartado: sem tipografia). 2ª = símbolos negativos no squircle
// (descartados: a marca não é badge). 3ª = silhuetas angulares A/B/C
// (C descartada por completo). 4ª = A e B orgânicas (sem vértice, sem
// aresta reta). Decisão final do fundador: A — "Abertura". B ("Ciclo",
// segmentos sobre superelipse) descartada; sobrevive só no histórico de
// relatório, não nos assets.
// Cores: somente pares já aferidos (papel/tinta 15,48:1 · papel/grafite
// 13,21:1 — ver scripts/contraste.mjs); nenhum par novo introduzido.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const f = (v) => +v.toFixed(2);
const RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// Base (caixa do símbolo 120×120, y cresce para baixo)
// ---------------------------------------------------------------------------
const LADO = 120;         // caixa do símbolo
const CENTRO = LADO / 2;  // 60
const TRACO = 12;         // régua de traço do sistema (10% do lado)
const R_MAX = 56;         // extensão máxima do símbolo a partir do centro

const PAPEL = '#F5F4F1', TINTA = '#1D1C1A';

// polilinha amostrada → path (a curva real; erro de corda < 0,05 unidade)
const linha = (pts) => `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' L')}`;

function squirclePts(a, n, passos) {
  const pts = [];
  for (let i = 0; i <= passos; i++) {
    const t = (i / passos) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    pts.push([
      CENTRO + Math.sign(ct) * Math.abs(ct) ** (2 / n) * a,
      CENTRO + Math.sign(st) * Math.abs(st) ** (2 / n) * a,
    ]);
  }
  return pts;
}
const squirclePath = (lado, n) =>
  linha(squirclePts(lado / 2, n, 120).slice(0, 120).map(([x, y]) => [x - CENTRO + lado / 2, y - CENTRO + lado / 2])) + ' Z';

// ---------------------------------------------------------------------------
// "Abertura" — o símbolo. Uma lâmina CURVA repetida em giro de 120°.
// Centerline: espiral de Arquimedes (r cresce linearmente com o ângulo);
// o traço de pontas redondas dá a lâmina do diafragma — sem vértice, sem
// aresta reta. O vazio circular no centro é o que fica nítido.
// ---------------------------------------------------------------------------
const A_R0 = 18;      // raio inicial da centerline
const A_R1 = 42;      // raio final da centerline
const A_W = 16;       // espessura do traço (pontas redondas)
const A_SWEEP = 100;  // varredura angular de cada lâmina, em graus
const A_AMOSTRAS = 48;
function lamina(thetaInicial) {
  const pts = [];
  for (let i = 0; i <= A_AMOSTRAS; i++) {
    const t = i / A_AMOSTRAS;
    const th = (thetaInicial + A_SWEEP * t) * RAD;
    const r = A_R0 + (A_R1 - A_R0) * t;
    pts.push([CENTRO + r * Math.cos(th), CENTRO + r * Math.sin(th)]);
  }
  return pts;
}
const SIMBOLO = {
  nome: 'Abertura',
  just: 'Uma lâmina curva repetida em giro de 120° forma o diafragma: espiral de Arquimedes com pontas redondas, sem um vértice sequer. O vazio circular no centro é o que fica nítido.',
  tracoLargura: A_W,
  paths: [0, 120, 240].map((g) => ({ d: linha(lamina(-90 + g)), traco: A_W })),
  menorDetalhe: 2 * (A_R0 - A_W / 2), detalheNome: `vazio central (ø${2 * (A_R0 - A_W / 2)})`,
  constru: [
    ['fórmula', `espiral r(t) = ${A_R0} + ${A_R1 - A_R0}·t · θ(t) = θ₀ + ${A_SWEEP}°·t · lâmina × rot(120°) × rot(240°) — ordem 3`],
    ['lâmina', `traço ${A_W}, pontas redondas (sem vértice) · ${A_AMOSTRAS + 1} amostras por lâmina`],
    ['vazio central', `círculo ø${2 * (A_R0 - A_W / 2)} = 2×(R0 − traço/2) — o diafragma`],
    ['extensão', `${A_R1 + A_W / 2} do centro (R1 + traço/2) ≤ ${R_MAX}`],
  ],
};

// ---------------------------------------------------------------------------
// Tamanhos mínimos, derivados do menor detalhe (o vazio central)
// ---------------------------------------------------------------------------
const MIN_TELA_BRUTO = f((1.25 * LADO) / SIMBOLO.menorDetalhe);
const MIN_TELA = Math.max(16, Math.ceil(MIN_TELA_BRUTO));
const MIN_IMP_BRUTO = f((0.6 * LADO) / SIMBOLO.menorDetalhe);
const MIN_IMP = Math.max(8, Math.ceil(MIN_IMP_BRUTO));

// ---------------------------------------------------------------------------
// Wordmark: contornos reais da Switzer Semibold (scripts/wordmark.py)
// ---------------------------------------------------------------------------
const wm = JSON.parse(readFileSync(join(RAIZ, 'scripts/wordmark-dados.json'), 'utf8'));
const CAP_ALVO = 48;                         // cap do texto = 0,4× a caixa do símbolo
const ESCALA_WM = CAP_ALVO / wm.capHeight;
const VAO = 48;                              // vão símbolo–texto = 0,4× a caixa
const BASELINE_LOGO = CENTRO + CAP_ALVO / 2; // centro da cap = centro do símbolo → 84
const WM_X = LADO + VAO;                     // 168
const WM_LARG = f(wm.largura * ESCALA_WM);
const LOGO_LARG = f(WM_X + WM_LARG);

const MIN_FS_TELA = 10, MIN_FS_IMP = 6;
const capPx = (fs) => fs * (wm.capHeight / wm.unitsPerEm);
const ladoSimboloMin = (fs) => capPx(fs) / (CAP_ALVO / LADO);
const LOCKUP_MIN_TELA = f(ladoSimboloMin(MIN_FS_TELA) * (LOGO_LARG / LADO));
const LOCKUP_MIN_IMP_MM = f(ladoSimboloMin(MIN_FS_IMP) * (LOGO_LARG / LADO) * 25.4 / 72);

// ---------------------------------------------------------------------------
// Emissão dos assets — símbolo como traço de pontas redondas (sem vértice)
// ---------------------------------------------------------------------------
const pathsSimbolo = (cor) => SIMBOLO.paths
  .map((p) => `<path d="${p.d}" fill="none" stroke="${cor}" stroke-width="${p.traco}" stroke-linecap="round" stroke-linejoin="round"/>`)
  .join('\n  ');

const svgSimbolo = (cor) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}">
  <!-- Gerado por scripts/geometria.mjs — não editar à mão.
       "${SIMBOLO.nome}", o símbolo da Able Development (decisão final do
       fundador): silhueta única, sem container, sem letra, sem vértice nem
       aresta reta. Construção: node scripts/geometria.mjs -->
  ${pathsSimbolo(cor)}
</svg>
`;

const svgIconeApp = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}">
  <!-- Gerado por scripts/geometria.mjs — não editar à mão.
       CONTAINER DE PLATAFORMA (tile de app/favicon) — o squircle não faz
       parte da marca; a marca é o símbolo (assets/simbolo.svg). -->
  <path d="${squirclePath(LADO, 5)}" fill="${TINTA}"/>
  <g transform="translate(${CENTRO} ${CENTRO}) scale(0.78) translate(${-CENTRO} ${-CENTRO})">
    ${pathsSimbolo(PAPEL)}
  </g>
</svg>
`;

const svgLogo = (cor) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_LARG} ${LADO}">
  <!-- Gerado por scripts/geometria.mjs — não editar à mão.
       Lockup: símbolo à esquerda, nome à direita.
       Wordmark: contornos reais de ${wm.fonte} (${wm.peso}, tracking ${wm.tracking_em} em),
       via scripts/wordmark.py com kerning HarfBuzz.
       cap ${CAP_ALVO} (0,4×caixa) · vão ${VAO} (0,4×caixa) · baseline y ${BASELINE_LOGO}
       (centro da cap = centro do símbolo). Fundo transparente: aplicar
       sobre campo único de papel, grafite ou tinta (pares aferidos). -->
  ${pathsSimbolo(cor)}
  <g transform="translate(${WM_X} ${BASELINE_LOGO}) scale(${ESCALA_WM.toFixed(6)})">
    <path d="${wm.path}" fill="${cor}"/>
  </g>
</svg>
`;

mkdirSync(join(RAIZ, 'assets'), { recursive: true });
// fases anteriores substituídas: badge (icone*.svg), proposta C e — após a
// decisão final do fundador — as propostas A/B como arquivos separados
for (const velho of ['icone.svg', 'icone-invertido.svg', 'simbolo-a.svg', 'simbolo-b.svg', 'simbolo-c.svg']) {
  rmSync(join(RAIZ, 'assets', velho), { force: true });
}
writeFileSync(join(RAIZ, 'assets/simbolo.svg'), svgSimbolo(TINTA));
writeFileSync(join(RAIZ, 'assets/icone-app.svg'), svgIconeApp());
writeFileSync(join(RAIZ, 'assets/logo.svg'), svgLogo(TINTA));
writeFileSync(join(RAIZ, 'assets/logo-invertido.svg'), svgLogo(PAPEL));

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------
console.log(`base: caixa 120 · régua ${TRACO} · extensão máx ${R_MAX} · silhueta única · sem vértice, sem aresta reta`);
console.log('='.repeat(76));
console.log(`símbolo — "${SIMBOLO.nome}"  [DEFINITIVO — decisão do fundador]`);
for (const [k, v] of SIMBOLO.constru) console.log('  ' + k.padEnd(12) + v);
console.log('  menor detalhe'.padEnd(14) + SIMBOLO.detalheNome);
console.log('  mín. tela'.padEnd(14) + `${MIN_TELA} px (bruto ${MIN_TELA_BRUTO} px, piso favicon 16)`);
console.log('  mín. impresso'.padEnd(14) + `${MIN_IMP} mm (bruto ${MIN_IMP_BRUTO} mm, piso 8)`);
console.log('-'.repeat(76));
console.log('logo (lockup) — símbolo à esquerda, nome à direita');
console.log('  fonte'.padEnd(14) + `${wm.fonte} · ${wm.peso} · upm ${wm.unitsPerEm} · cap ${wm.capHeight} (${(wm.capHeight / wm.unitsPerEm).toFixed(3)} em, medida)`);
console.log('  cap do texto'.padEnd(14) + `${CAP_ALVO} = 0,4×caixa · escala ${ESCALA_WM.toFixed(6)}`);
console.log('  vão'.padEnd(14) + `${VAO} = 0,4×caixa · texto em x ${WM_X} · baseline y ${BASELINE_LOGO}`);
console.log('  largura'.padEnd(14) + `wordmark ${WM_LARG} · logo ${LOGO_LARG}×120 · proporção ${f(LOGO_LARG / LADO)}:1`);
console.log('  mín. tela'.padEnd(14) + `texto ≥ ${MIN_FS_TELA} px → símbolo ${f(ladoSimboloMin(MIN_FS_TELA))} px → lockup ${LOCKUP_MIN_TELA} px`);
console.log('  mín. impresso'.padEnd(14) + `texto ≥ ${MIN_FS_IMP} pt → lockup ${LOCKUP_MIN_IMP_MM} mm`);
console.log('  respiro'.padEnd(14) + '0,25× a caixa do símbolo, em volta de todo o conjunto');
console.log('='.repeat(76));
console.log('assets: simbolo.svg, icone-app.svg, logo.svg, logo-invertido.svg (simbolo-a/b/c.svg removidos)');
