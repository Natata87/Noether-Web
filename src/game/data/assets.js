// Asset registry for the web client.
// NOTE: the original v0.4.1 prototype still stores its raster art inside the local build archive.
// These lightweight SVG fallbacks keep the repository runnable while the raster assets are migrated
// to public/assets/ as normal files. Replace each entry with a /assets/... URL during that migration.

function svgAsset(label, bg = '#111827', fg = '#d4ad66', accent = '#7567d8') {
  const safe = String(label).replace(/[&<>]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420"><defs><radialGradient id="g"><stop stop-color="${accent}" stop-opacity=".38"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient></defs><rect width="420" height="420" fill="${bg}"/><circle cx="210" cy="205" r="150" fill="url(#g)"/><circle cx="210" cy="205" r="118" fill="none" stroke="${fg}" stroke-opacity=".35"/><path d="M210 84l30 70 74 8-56 49 17 73-65-38-65 38 17-73-56-49 74-8z" fill="none" stroke="${fg}" stroke-width="4" stroke-opacity=".65"/><text x="210" y="350" fill="${fg}" font-family="serif" font-size="22" text-anchor="middle">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function landscapeAsset(label) {
  const safe = String(label).replace(/[&<>]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#07101d"/><stop offset="1" stop-color="#03060a"/></linearGradient><radialGradient id="m"><stop stop-color="#4f4a8d" stop-opacity=".35"/><stop offset="1" stop-color="#07101d" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#b)"/><circle cx="1180" cy="180" r="220" fill="url(#m)"/><path d="M0 820L210 520 330 760 510 420 660 750 850 500 1010 760 1210 390 1410 720 1600 520V900H0Z" fill="#071019"/><g stroke="#727b8d" stroke-opacity=".22"><path d="M180 900V180M420 900V110M720 900V230M1060 900V90M1380 900V170" stroke-width="28"/></g><text x="800" y="120" fill="#d4ad66" font-family="serif" font-size="44" text-anchor="middle">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const ASSETS = {
  ENEMY_LOBO: svgAsset('Lobo Sombrio', '#0b1118', '#c9d0db', '#263b68'),
  ENEMY_CAVALEIRO: svgAsset('Cavaleiro', '#0b1118', '#c8aa68', '#433a55'),
  ENEMY_DIABO: svgAsset('Diabo da Tasmânia', '#160c11', '#cf9b75', '#7e263c'),

  AVATAR_MAGO_M: svgAsset('Mago', '#080d18', '#d4ad66', '#6551bd'),
  AVATAR_MAGO_F: svgAsset('Maga', '#080d18', '#d4ad66', '#6551bd'),
  AVATAR_GUERREIRO_M: svgAsset('Guerreiro', '#0c1118', '#d4ad66', '#344e77'),
  AVATAR_GUERREIRO_F: svgAsset('Guerreira', '#0c1118', '#d4ad66', '#344e77'),
  AVATAR_ASSASSINO_M: svgAsset('Assassino', '#100a12', '#cfa873', '#6d334f'),
  AVATAR_ASSASSINO_F: svgAsset('Assassina', '#100a12', '#cfa873', '#6d334f'),
  AVATAR_ARQUEIRO_M: svgAsset('Arqueiro', '#091018', '#d4ad66', '#315269'),
  AVATAR_ARQUEIRO_F: svgAsset('Arqueira', '#091018', '#d4ad66', '#315269'),

  MAT_FERRO: svgAsset('Ferro', '#12151b', '#b9bec7', '#454d59'),
  MAT_MADEIRA: svgAsset('Madeira', '#17100c', '#c89a66', '#6d4126'),
  MAT_ERVA: svgAsset('Erva Vital', '#0d1411', '#c7b77d', '#415748'),
  MAT_AGUA: svgAsset('Água Pura', '#09131b', '#b9d7ec', '#365f8d'),
  MAT_FRASCO: svgAsset('Frasco', '#11101b', '#cab6ec', '#685797'),
  DROP_OLHO: svgAsset('Olho', '#160d13', '#d5a56e', '#7c3148'),
  DROP_GARRA: svgAsset('Garra', '#121217', '#c9c2b4', '#5a4b44'),
  DROP_CHIFRE: svgAsset('Chifre', '#121217', '#c9c2b4', '#5a4b44'),

  FAM_CONJUS: svgAsset('Conjus', '#090d18', '#d2c7ef', '#6152b9'),
  FAM_GLIGO: svgAsset('Gligo', '#160d09', '#e3b56f', '#a4492c'),

  BG_FLORESTA: landscapeAsset('FLORESTA SOMBRIA'),
};
