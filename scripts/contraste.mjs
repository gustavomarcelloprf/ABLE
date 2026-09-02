#!/usr/bin/env node
// Aferição de contraste WCAG 2.x para a paleta neutra da Able Development.
// Regra da marca: nenhum par cor/fundo entra no sistema sem contraste
// calculado (não estimado). Rode: node scripts/contraste.mjs
// Sai com código 1 se qualquer par ficar abaixo do alvo declarado.

const CORES = {
  papel:                  '#F5F4F1',
  'papel-hover':          '#EBEAE6',
  'borda-sutil':          '#DEDCD6',
  'borda-controle':       '#8A867F',
  'texto-secundario':     '#5F5C56',
  tinta:                  '#1D1C1A',
  grafite:                '#2A2927',
  'grafite-hover':        '#353431',
  'grafite-borda':        '#8F8C85',
  'grafite-texto-secundario': '#A9A59D',
  // Acento único — decisão do fundador (revisão registrada da regra
  // "paleta 100% neutra" da v3). Teto de uso: 2–3% de qualquer superfície;
  // nunca fundo, nunca no símbolo; texto só sobre tinta. Ver tokens/able-tokens.css.
  tangelo:                '#FB4D00',
};

// [primeiro plano, fundo, alvo, critério]
const PARES = [
  ['tinta', 'papel', 7.0, 'texto — AAA (1.4.6)'],
  ['tinta', 'papel-hover', 7.0, 'texto — AAA (1.4.6)'],
  ['texto-secundario', 'papel', 4.5, 'texto — AA (1.4.3)'],
  ['texto-secundario', 'papel-hover', 4.5, 'texto — AA (1.4.3)'],
  ['borda-controle', 'papel', 3.0, 'não-texto — AA (1.4.11)'],
  ['papel', 'grafite', 7.0, 'texto — AAA (1.4.6)'],
  ['papel', 'grafite-hover', 7.0, 'texto — AAA (1.4.6)'],
  ['grafite-texto-secundario', 'grafite', 4.5, 'texto — AA (1.4.3)'],
  ['grafite-texto-secundario', 'grafite-hover', 4.5, 'texto — AA (1.4.3)'],
  ['grafite-borda', 'grafite', 3.0, 'não-texto — AA (1.4.11)'],
  // Acento tangelo: só não-texto sobre papel/grafite; como texto, só sobre tinta.
  ['tangelo', 'papel', 3.0, 'não-texto — AA (1.4.11) · acento, só não-texto'],
  ['tangelo', 'grafite', 3.0, 'não-texto — AA (1.4.11) · acento, só não-texto'],
  ['tangelo', 'tinta', 4.5, 'texto — AA (1.4.3) · único par de texto do acento'],
  // Bordas sutis são decorativas (separadores dentro de superfície contínua);
  // documentadas aqui por transparência, sem alvo normativo.
  ['borda-sutil', 'papel', 0, 'decorativa — sem exigência WCAG'],
];

function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  const canal = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * canal((n >> 16) & 255) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * canal(n & 255)
  );
}

function razao(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

let falhou = false;
console.log('par'.padEnd(46) + 'razão'.padEnd(9) + 'alvo'.padEnd(7) + 'critério');
console.log('-'.repeat(92));
for (const [fg, bg, alvo, criterio] of PARES) {
  const r = razao(CORES[fg], CORES[bg]);
  const ok = r >= alvo;
  if (!ok) falhou = true;
  const nome = `${fg} (${CORES[fg]}) / ${bg} (${CORES[bg]})`;
  console.log(
    nome.padEnd(46) +
    `${r.toFixed(2)}:1`.padEnd(9) +
    (alvo ? `${alvo}:1` : '—').padEnd(7) +
    `${criterio}  ${alvo ? (ok ? 'PASSA' : 'FALHA') : ''}`
  );
}
process.exit(falhou ? 1 : 0);
