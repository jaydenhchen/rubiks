import { Cube, randomScramble } from './cube.js';
import { initSolver, solveCube } from './solver.js';

function checkIdentities() {
  const cases = {
    R4: 'R R R R',
    Rp: "R R'",
    U4: 'U U U U',
    F4: 'F F F F',
    D4: 'D D D D',
    L4: 'L L L L',
    B4: 'B B B B',
    x2x2: 'x2 x2',
    y4: 'y y y y',
    z4: 'z z z z',
    sexy6: "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' R U R' U'",
  };
  for (const [name, alg] of Object.entries(cases)) {
    const ok = new Cube().move(alg).isIdentity();
    if (!ok) throw new Error(`identity failed: ${name}`);
  }
}

function randomTest(n, length) {
  let ok = 0;
  let totalMoves = 0;
  let worst = 0;
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const scramble = randomScramble(length);
    const cube = new Cube().move(scramble.join(' '));
    try {
      const sol = solveCube(cube);
      cube.move(sol.join(' '));
      if (cube.isSolved() && cube.isIdentity()) {
        ok++;
        totalMoves += sol.length;
        if (sol.length > worst) worst = sol.length;
      } else {
        console.log('unsolved', scramble.join(' '), cube.asString(), cube.center);
      }
    } catch (e) {
      console.log('error', scramble.join(' '), e.message);
    }
  }
  const avg = ok ? (totalMoves / ok).toFixed(2) : 'n/a';
  console.log(`ok ${ok}/${n} in ${Date.now() - t0}ms  avg ${avg} moves  max ${worst}`);
  if (ok !== n) process.exitCode = 1;
}

checkIdentities();
initSolver();
const known = "R U R' U' F2";
const cube = new Cube().move(known);
const sol = solveCube(cube);
cube.move(sol.join(' '));
if (!cube.isIdentity()) throw new Error('known scramble failed');
console.log('known ok', sol.length, 'moves', sol.join(' '));
randomTest(40, 25);
