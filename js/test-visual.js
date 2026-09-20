import { Cube, parseMove, randomScramble } from './cube.js';
import { solveCube } from './solver.js';

const OUTWARD = {
  U: [0, 1, 0], D: [0, -1, 0],
  R: [1, 0, 0], L: [-1, 0, 0],
  F: [0, 0, 1], B: [0, 0, -1],
  x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1],
  M: [-1, 0, 0], E: [0, -1, 0], S: [0, 0, 1],
};

const SIGN = {
  U: -1, R: -1, F: -1, D: -1, L: -1, B: -1,
  x: -1, y: -1, z: -1,
  M: -1, E: -1, S: -1,
};

function round(n) { return Math.round(n); }

function applyAxisAngle(v, axis, angle) {
  const [x, y, z] = v;
  const [ux, uy, uz] = axis;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const d = (1 - c) * (ux * x + uy * y + uz * z);
  return [
    x * c + d * ux + (uy * z - uz * y) * s,
    y * c + d * uy + (uz * x - ux * z) * s,
    z * c + d * uz + (ux * y - uy * x) * s,
  ];
}

function select(cubies, face) {
  return cubies.filter((c) => {
    switch (face) {
      case 'U': return c.y === 1;
      case 'D': return c.y === -1;
      case 'R': return c.x === 1;
      case 'L': return c.x === -1;
      case 'F': return c.z === 1;
      case 'B': return c.z === -1;
      case 'M': return c.x === 0;
      case 'E': return c.y === 0;
      case 'S': return c.z === 0;
      case 'x':
      case 'y':
      case 'z':
        return true;
      default:
        return false;
    }
  });
}

function makeVisual() {
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const stickers = [];
        if (y === 1) stickers.push({ color: 'U', n: [0, 1, 0] });
        if (y === -1) stickers.push({ color: 'D', n: [0, -1, 0] });
        if (x === 1) stickers.push({ color: 'R', n: [1, 0, 0] });
        if (x === -1) stickers.push({ color: 'L', n: [-1, 0, 0] });
        if (z === 1) stickers.push({ color: 'F', n: [0, 0, 1] });
        if (z === -1) stickers.push({ color: 'B', n: [0, 0, -1] });
        cubies.push({ x, y, z, stickers });
      }
    }
  }
  return cubies;
}

function visualMove(cubies, token, signTable = SIGN) {
  const { face, power } = parseMove(token);
  const axis = OUTWARD[face];
  if (!axis) throw new Error(token);
  const turns = power === 2 ? 2 : 1;
  const sign = signTable[face] ?? 1;
  const dir = power === 3 ? -sign : sign;
  const angle = dir * (Math.PI / 2) * turns;
  for (const c of select(cubies, face)) {
    const p = applyAxisAngle([c.x, c.y, c.z], axis, angle);
    c.x = round(p[0]);
    c.y = round(p[1]);
    c.z = round(p[2]);
    for (const s of c.stickers) s.n = applyAxisAngle(s.n, axis, angle).map(round);
  }
}

function stickerToward(cubie, dir) {
  let best = null;
  let bestDot = -2;
  for (const s of cubie.stickers) {
    const d = s.n[0] * dir[0] + s.n[1] * dir[1] + s.n[2] * dir[2];
    if (d > bestDot) {
      bestDot = d;
      best = s.color;
    }
  }
  return best;
}

function visualAsString(cubies) {
  const faces = [
    { dir: [0, 1, 0], at: (col, row) => [col - 1, 1, row - 1] },
    { dir: [1, 0, 0], at: (col, row) => [1, 1 - row, 1 - col] },
    { dir: [0, 0, 1], at: (col, row) => [col - 1, 1 - row, 1] },
    { dir: [0, -1, 0], at: (col, row) => [col - 1, -1, 1 - row] },
    { dir: [-1, 0, 0], at: (col, row) => [-1, 1 - row, col - 1] },
    { dir: [0, 0, -1], at: (col, row) => [1 - col, 1 - row, -1] },
  ];
  let out = '';
  for (const face of faces) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const [x, y, z] = face.at(col, row);
        const c = cubies.find((q) => q.x === x && q.y === y && q.z === z);
        out += c ? stickerToward(c, face.dir) : '?';
      }
    }
  }
  return out;
}

function applyAlg(cubies, alg, signs) {
  const toks = Array.isArray(alg) ? alg : alg.trim().split(/\s+/).filter(Boolean);
  for (const tok of toks) visualMove(cubies, tok, signs);
}

function cmp(alg, signs = SIGN) {
  const vis = makeVisual();
  applyAlg(vis, alg, signs);
  const v = visualAsString(vis);
  const l = new Cube().move(Array.isArray(alg) ? alg.join(' ') : alg).asString();
  return { alg, match: v === l, v, l };
}

let failed = 0;
const algs = [
  'U', 'R', 'F', 'D', 'L', 'B',
  "U'", "R'", "F'", "D'", "L'", "B'",
  'U2', 'R2', 'F2',
  'x', 'y', 'z', 'x2', "x'",
  'M', 'E', 'S',
  "R U R' U'",
  'F R U',
  "B' D' R' F' D F'",
];
for (const a of algs) {
  const r = cmp(a);
  if (!r.match) {
    failed++;
    console.log('NO', a);
    console.log('  vis', r.v);
    console.log('  log', r.l);
  }
}

const vis = makeVisual();
const scramble = randomScramble(24);
applyAlg(vis, scramble);
const cube = new Cube().move(scramble.join(' '));
if (visualAsString(vis) !== cube.asString()) {
  failed++;
  console.log('NO scramble match', scramble.join(' '));
} else {
  const sol = solveCube(cube.clone());
  applyAlg(vis, sol);
  cube.move(sol.join(' '));
  const vs = visualAsString(vis);
  if (vs !== cube.asString() || vs !== 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB') {
    failed++;
    console.log('NO scramble+solve', vs, cube.asString());
  } else {
    console.log('scramble+solve ok', scramble.join(' '), 'len', sol.length);
  }
}

if (failed) {
  console.log('failed', failed);
  process.exitCode = 1;
} else {
  console.log('all visual matches ok');
}
