const U = 0, R = 1, F = 2, D = 3, L = 4, B = 5;
const URF = 0, UFL = 1, ULB = 2, UBR = 3, DFR = 4, DLF = 5, DBL = 6, DRB = 7;
const UR = 0, UF = 1, UL = 2, UB = 3, DR = 4, DF = 5, DL = 6, DB = 7, FR = 8, FL = 9, BL = 10, BR = 11;

const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B', 'E', 'M', 'S', 'x', 'y', 'z'];
const FACE_INDEX = Object.fromEntries(FACE_NAMES.map((n, i) => [n, i]));

const _U = (x) => x - 1;
const _R = (x) => _U(9) + x;
const _F = (x) => _R(9) + x;
const _D = (x) => _F(9) + x;
const _L = (x) => _D(9) + x;
const _B = (x) => _L(9) + x;

const centerFacelet = [4, 13, 22, 31, 40, 49];
const cornerFacelet = [
  [_U(9), _R(1), _F(3)], [_U(7), _F(1), _L(3)],
  [_U(1), _L(1), _B(3)], [_U(3), _B(1), _R(3)],
  [_D(3), _F(9), _R(7)], [_D(1), _L(9), _F(7)],
  [_D(7), _B(9), _L(7)], [_D(9), _R(9), _B(7)],
];
const edgeFacelet = [
  [_U(6), _R(2)], [_U(8), _F(2)], [_U(4), _L(2)], [_U(2), _B(2)],
  [_D(6), _R(8)], [_D(2), _F(8)], [_D(4), _L(8)], [_D(8), _B(8)],
  [_F(6), _R(4)], [_F(4), _L(6)], [_B(6), _L(4)], [_B(4), _R(6)],
];

const centerColor = ['U', 'R', 'F', 'D', 'L', 'B'];
const cornerColor = [
  ['U', 'R', 'F'], ['U', 'F', 'L'], ['U', 'L', 'B'], ['U', 'B', 'R'],
  ['D', 'F', 'R'], ['D', 'L', 'F'], ['D', 'B', 'L'], ['D', 'R', 'B'],
];
const edgeColor = [
  ['U', 'R'], ['U', 'F'], ['U', 'L'], ['U', 'B'], ['D', 'R'], ['D', 'F'],
  ['D', 'L'], ['D', 'B'], ['F', 'R'], ['F', 'L'], ['B', 'L'], ['B', 'R'],
];

const BASIC_MOVES = [
  {
    center: [0, 1, 2, 3, 4, 5],
    cp: [UBR, URF, UFL, ULB, DFR, DLF, DBL, DRB],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UB, UR, UF, UL, DR, DF, DL, DB, FR, FL, BL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    center: [0, 1, 2, 3, 4, 5],
    cp: [DFR, UFL, ULB, URF, DRB, DLF, DBL, UBR],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [FR, UF, UL, UB, BR, DF, DL, DB, DR, FL, BL, UR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    center: [0, 1, 2, 3, 4, 5],
    cp: [UFL, DLF, ULB, UBR, URF, DFR, DBL, DRB],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [UR, FL, UL, UB, DR, FR, DL, DB, UF, DF, BL, BR],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  {
    center: [0, 1, 2, 3, 4, 5],
    cp: [URF, UFL, ULB, UBR, DLF, DBL, DRB, DFR],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UR, UF, UL, UB, DF, DL, DB, DR, FR, FL, BL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    center: [0, 1, 2, 3, 4, 5],
    cp: [URF, ULB, DBL, UBR, DFR, UFL, DLF, DRB],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [UR, UF, BL, UB, DR, DF, FL, DB, FR, UL, DL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    center: [0, 1, 2, 3, 4, 5],
    cp: [URF, UFL, UBR, DRB, DFR, DLF, ULB, DBL],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [UR, UF, UL, BR, DR, DF, DL, BL, FR, FL, UB, DB],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
  {
    center: [U, F, L, D, B, R],
    cp: [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UR, UF, UL, UB, DR, DF, DL, DB, FL, BL, BR, FR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
  },
  {
    center: [B, R, U, F, L, D],
    cp: [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UR, UB, UL, DB, DR, UF, DL, DF, FR, FL, BL, BR],
    eo: [0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0],
  },
  {
    center: [L, U, F, R, D, B],
    cp: [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UL, UF, DL, UB, UR, DF, DR, DB, FR, FL, BL, BR],
    eo: [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  },
];

function parseAlg(arg) {
  if (typeof arg !== 'string') return arg;
  const out = [];
  for (const part of arg.trim().split(/\s+/)) {
    if (!part) continue;
    const face = FACE_INDEX[part[0]];
    if (face === undefined) throw new Error(`Invalid move: ${part}`);
    let power = 0;
    if (part.length === 2) {
      if (part[1] === '2') power = 1;
      else if (part[1] === "'") power = 2;
      else throw new Error(`Invalid move: ${part}`);
    } else if (part.length !== 1) {
      throw new Error(`Invalid move: ${part}`);
    }
    out.push(face * 3 + power);
  }
  return out;
}

export function stringifyMoves(moves) {
  return moves.map((m) => {
    const face = FACE_NAMES[Math.floor(m / 3)];
    const power = m % 3;
    return face + (power === 1 ? '2' : power === 2 ? "'" : '');
  });
}

export function compactMoves(tokens) {
  const faceOf = (t) => t.replace(/[2']/g, '');
  const powerOf = (t) => (t.endsWith('2') ? 2 : t.endsWith("'") ? 3 : 1);
  const token = (face, p) => {
    const n = ((p % 4) + 4) % 4;
    if (n === 0) return null;
    return face + (n === 2 ? '2' : n === 3 ? "'" : '');
  };
  const stack = [];
  for (const raw of tokens) {
    const face = faceOf(raw);
    let p = powerOf(raw);
    while (stack.length && faceOf(stack[stack.length - 1]) === face) {
      p += powerOf(stack.pop());
    }
    const next = token(face, p);
    if (next) stack.push(next);
  }
  return stack;
}

export class Cube {
  constructor(other) {
    if (other) this.init(other);
    else this.identity();
    this.newCenter = new Array(6);
    this.newCp = new Array(8);
    this.newCo = new Array(8);
    this.newEp = new Array(12);
    this.newEo = new Array(12);
  }

  init(state) {
    this.center = state.center.slice();
    this.cp = state.cp.slice();
    this.co = state.co.slice();
    this.ep = state.ep.slice();
    this.eo = state.eo.slice();
    this._str = null;
    return this;
  }

  identity() {
    this.center = [0, 1, 2, 3, 4, 5];
    this.cp = [0, 1, 2, 3, 4, 5, 6, 7];
    this.co = [0, 0, 0, 0, 0, 0, 0, 0];
    this.ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    this.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._str = null;
    return this;
  }

  clone() {
    return new Cube(this);
  }

  toJSON() {
    return {
      center: this.center.slice(),
      cp: this.cp.slice(),
      co: this.co.slice(),
      ep: this.ep.slice(),
      eo: this.eo.slice(),
    };
  }

  asString() {
    if (this._str) return this._str;
    const result = new Array(54);
    for (let i = 0; i < 6; i++) result[9 * i + 4] = centerColor[this.center[i]];
    for (let i = 0; i < 8; i++) {
      const corner = this.cp[i];
      const ori = this.co[i];
      for (let n = 0; n < 3; n++) {
        result[cornerFacelet[i][(n + ori) % 3]] = cornerColor[corner][n];
      }
    }
    for (let i = 0; i < 12; i++) {
      const edge = this.ep[i];
      const ori = this.eo[i];
      for (let n = 0; n < 2; n++) {
        result[edgeFacelet[i][(n + ori) % 2]] = edgeColor[edge][n];
      }
    }
    this._str = result.join('');
    return this._str;
  }

  facelet(face, i) {
    return this.asString()[face * 9 + i];
  }

  centerName(face) {
    return centerColor[this.center[face]];
  }

  centerMultiply(other) {
    for (let to = 0; to < 6; to++) this.newCenter[to] = this.center[other.center[to]];
    const tmp = this.center;
    this.center = this.newCenter;
    this.newCenter = tmp;
    return this;
  }

  cornerMultiply(other) {
    for (let to = 0; to < 8; to++) {
      const from = other.cp[to];
      this.newCp[to] = this.cp[from];
      this.newCo[to] = (this.co[from] + other.co[to]) % 3;
    }
    let tmp = this.cp; this.cp = this.newCp; this.newCp = tmp;
    tmp = this.co; this.co = this.newCo; this.newCo = tmp;
    return this;
  }

  edgeMultiply(other) {
    for (let to = 0; to < 12; to++) {
      const from = other.ep[to];
      this.newEp[to] = this.ep[from];
      this.newEo[to] = (this.eo[from] + other.eo[to]) % 2;
    }
    let tmp = this.ep; this.ep = this.newEp; this.newEp = tmp;
    tmp = this.eo; this.eo = this.newEo; this.newEo = tmp;
    return this;
  }
  multiply(other) {
    this._str = null;
    this.centerMultiply(other);
    this.cornerMultiply(other);
    this.edgeMultiply(other);
    return this;
  }

  move(arg) {
    this._str = null;
    for (const mv of parseAlg(arg)) {
      const face = (mv / 3) | 0;
      const power = mv % 3;
      for (let i = 0; i <= power; i++) this.multiply(Cube.moves[face]);
    }
    return this;
  }
  isSolved() {
    const s = this.asString();
    for (let f = 0; f < 6; f++) {
      const c = s[f * 9 + 4];
      for (let i = 0; i < 9; i++) if (s[f * 9 + i] !== c) return false;
    }
    return true;
  }

  isIdentity() {
    for (let i = 0; i < 6; i++) if (this.center[i] !== i) return false;
    for (let i = 0; i < 8; i++) if (this.cp[i] !== i || this.co[i] !== 0) return false;
    for (let i = 0; i < 12; i++) if (this.ep[i] !== i || this.eo[i] !== 0) return false;
    return true;
  }
}

Cube.moves = BASIC_MOVES.map((m) => new Cube(m));
Cube.moves.push(new Cube().move("R M' L'"));
Cube.moves.push(new Cube().move("U E' D'"));
Cube.moves.push(new Cube().move('F S B\''));

export function parseMove(token) {
  const face = token[0];
  const suffix = token.slice(1);
  const power = suffix === '2' ? 2 : suffix === "'" ? 3 : 1;
  return { face, power, token };
}

export function randomScramble(length = 24) {
  const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
  const axisOf = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
  const modifiers = ['', "'", '2'];
  const moves = [];
  let prev = -1;
  let prevAxis = -1;
  for (let i = 0; i < length; i++) {
    let idx;
    do {
      idx = (Math.random() * 6) | 0;
    } while (idx === prev || axisOf[faces[idx]] === prevAxis && prev !== -1 && axisOf[faces[prev]] === prevAxis);
    prevAxis = axisOf[faces[idx]];
    prev = idx;
    moves.push(faces[idx] + modifiers[(Math.random() * 3) | 0]);
  }
  return moves;
}

export {
  U, R, F, D, L, B,
  URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB,
  UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR,
  cornerColor, edgeColor, centerColor,
  cornerFacelet, edgeFacelet,
};
