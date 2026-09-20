import min2phase from './min2phase.js';

let ready = false;
let search = null;

export function initSolver() {
  if (ready) return;
  min2phase.initFull();
  search = new min2phase.Search();
  ready = true;
}

function parseSolution(sol) {
  if (!sol || String(sol).startsWith('Error')) {
    throw new Error(sol || 'Solver failed');
  }
  return String(sol).trim().split(/\s+/).filter(Boolean);
}

export function solveCube(cube) {
  if (cube.isSolved()) return [];
  initSolver();
  const facelets = cube.asString();
  // Two-phase (Kociemba). probeMin keeps searching after the first hit
  // so solutions shrink toward the 20-move cap instead of the first path found.
  const sol = search.solution(facelets, 21, 1e9, 8000);
  const moves = parseSolution(sol);
  const check = cube.clone().move(moves.join(' '));
  if (!check.isSolved()) throw new Error('Solver produced an unsolved cube');
  return moves;
}
