import { Cube, randomScramble } from './cube.js';
import { initSolver, solveCube } from './solver.js';
import { CubeScene } from './scene.js?v=17';

const $ = (id) => document.getElementById(id);

const cube = new Cube();
window.logicCube = cube;
const scene = new CubeScene($('stage'));
const history = [];
let busy = false;
let twoShot = false;
let twoTimer = 0;
let playback = [];
let playbackIndex = -1;
let suppressHistory = false;
let scrambleBoost = false;

const FACE_KEYS = {
  u: 'U', r: 'R', f: 'F', d: 'D', l: 'L', b: 'B',
  x: 'x', y: 'y', z: 'z',
  m: 'M', e: 'E', s: 'S',
};

function setStatus(text) {
  $('status').textContent = text;
}

function renderTape(moves, current = -1) {
  const tape = $('tape');
  tape.innerHTML = '';
  if (!moves.length) {
    tape.innerHTML = '<span class="mv">Idle — turn with keys or scramble</span>';
    return;
  }
  moves.forEach((mv, i) => {
    const el = document.createElement('span');
    el.className = 'mv' + (i < current ? ' done' : i === current ? ' now' : '');
    el.textContent = mv;
    tape.appendChild(el);
  });
  const now = tape.querySelector('.now');
  if (now) now.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function setBusy(on) {
  busy = on;
  $('btn-scramble').disabled = on;
  $('btn-solve').disabled = on;
}

scene.onMoveStart = (token) => {
  cube.move(token);
  if (!suppressHistory) history.push(token);
  suppressHistory = false;
  if (playback.length) {
    if (playback[playbackIndex + 1] === token) playbackIndex += 1;
    else {
      const idx = playback.indexOf(token, playbackIndex + 1);
      playbackIndex = idx < 0 ? playbackIndex + 1 : idx;
    }
    renderTape(playback, playbackIndex);
    $('count').textContent = `${Math.min(playbackIndex + 1, playback.length)} / ${playback.length}`;
  } else {
    renderTape(history, history.length - 1);
    $('count').textContent = `${history.length} moves`;
  }
};

scene.onQueueEmpty = () => {
  const wasScramble = scrambleBoost;
  if (scrambleBoost) {
    scrambleBoost = false;
    scene.setSpeed(Number($('speed').value));
  }
  setBusy(false);
  playback = [];
  playbackIndex = -1;
  setStatus(cube.isSolved() ? 'Solved' : wasScramble ? 'Scrambled' : 'Ready');
  renderTape(history, history.length);
  $('count').textContent = `${history.length} moves`;
};

function play(moves, status) {
  if (!moves.length) return;
  playback = moves.slice();
  playbackIndex = -1;
  renderTape(playback, -1);
  setBusy(true);
  setStatus(status);
  scene.enqueue(moves);
}

function turn(face, { shift, alt }) {
  if (busy) return;
  let token = face;
  if (alt || twoShot) token += '2';
  else if (shift) token += "'";
  twoShot = false;
  play([token], `Turn ${token}`);
}

function scramble() {
  if (busy) return;
  const moves = randomScramble(24);
  scrambleBoost = true;
  scene.setSpeed(Math.max(Number($('speed').value), 2.6));
  play(moves, 'Scrambling');
}

function solve() {
  if (busy) return;
  if (cube.isSolved()) {
    setStatus('Already solved');
    return;
  }
  try {
    const moves = solveCube(cube);
    if (!moves.length) {
      setStatus('Already solved');
      return;
    }
    play(moves, `Solving · ${moves.length} moves`);
  } catch (err) {
    setStatus('Solver failed');
    console.error(err);
  }
}

function reset() {
  twoShot = false;
  clearTimeout(twoTimer);
  scene.clearQueue();
  scene.reset();
  cube.identity();
  history.length = 0;
  playback = [];
  scrambleBoost = false;
  scene.setSpeed(Number($('speed').value));
  setBusy(false);
  setStatus('Ready');
  renderTape([]);
  $('count').textContent = '0 moves';
}

function undo() {
  if (busy || !history.length) return;
  const last = history.pop();
  suppressHistory = true;
  play([invert(last)], `Undo ${last}`);
}

function invert(token) {
  if (token.endsWith('2')) return token;
  if (token.endsWith("'")) return token.slice(0, -1);
  return `${token}'`;
}

$('btn-scramble').addEventListener('click', scramble);
$('btn-solve').addEventListener('click', solve);
$('btn-reset').addEventListener('click', reset);
$('speed').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  scene.setSpeed(v);
  $('speed-label').textContent = `${v.toFixed(1)}×`;
});

window.addEventListener('keydown', (ev) => {
  if (ev.repeat) return;
  if (ev.metaKey || ev.ctrlKey) return;
  const tag = ev.target && ev.target.tagName;
  if (tag && ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(tag)) return;
  const key = ev.key;
  if (key === ' ') {
    ev.preventDefault();
    scramble();
    return;
  }
  if (key === 'Enter') {
    ev.preventDefault();
    solve();
    return;
  }
  if (key === 'Escape') {
    reset();
    return;
  }
  if (key === 'Backspace') {
    ev.preventDefault();
    undo();
    return;
  }
  if (key === '2') {
    twoShot = true;
    clearTimeout(twoTimer);
    twoTimer = setTimeout(() => { twoShot = false; }, 450);
    return;
  }
  const face = FACE_KEYS[key.toLowerCase()];
  if (!face) return;
  ev.preventDefault();
  turn(face, { shift: ev.shiftKey, alt: ev.altKey });
});

scene.setSpeed(Number($('speed').value));
renderTape([]);
setStatus('Loading solver…');
requestAnimationFrame(() => {
  initSolver();
  setStatus('Ready');
});
