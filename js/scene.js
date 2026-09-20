import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { parseMove } from './cube.js';

const COLORS = {
  U: '#f4f7fb',
  R: '#d23c4a',
  F: '#2bb673',
  D: '#f5d031',
  L: '#f07822',
  B: '#2f6adf',
  plastic: '#0e1116',
};

const OUTWARD = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
  M: new THREE.Vector3(-1, 0, 0),
  E: new THREE.Vector3(0, -1, 0),
  S: new THREE.Vector3(0, 0, 1),
};

const SIGN = {
  U: -1, R: -1, F: -1, D: -1, L: -1, B: -1,
  x: -1, y: -1, z: -1,
  M: -1, E: -1, S: -1,
};

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export class CubeScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.cubies = [];
    this.animating = false;
    this.queue = [];
    this.speed = 1;
    this.gen = 0;
    this.gap = 1.05;
    this.anim = null;
    this.onMoveStart = null;
    this.onQueueEmpty = null;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    this.camera.position.set(4.15, 3.35, 5.15);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 4.2;
    this.controls.maxDistance = 12;
    this.controls.target.set(0, -0.15, 0);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.#lights();
    this.#floor();
    this.build();
    this.#resize();
    window.addEventListener('resize', () => this.#resize());
    this.renderer.setAnimationLoop(() => this.#tick());
    this.timer = setInterval(() => {
      if (!this.anim) return;
      this.#step();
      this.renderer.render(this.scene, this.camera);
    }, 16);
    window.cubeScene = this;
  }

  #lights() {
    const hemi = new THREE.HemisphereLight(0xb7c8ff, 0x1a1208, 1.15);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x89b2ff, 0.45);
    fill.position.set(-6, 3, -4);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd9b0, 0.28);
    rim.position.set(0, -4, 5);
    this.scene.add(rim);
  }

  #floor() {
    const geo = new THREE.CircleGeometry(3.4, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x090b10,
      roughness: 0.95,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1.72;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  build() {
    this.#disposeCubies();
    const gap = this.gap;
    const size = 0.94;
    if (!this._plastic) {
      this._plastic = new THREE.MeshStandardMaterial({
        color: COLORS.plastic,
        roughness: 0.42,
        metalness: 0.18,
      });
      this._bodyGeo = new RoundedBoxGeometry(size, size, size, 4, 0.08);
    }

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          const group = new THREE.Group();
          const body = new THREE.Mesh(this._bodyGeo, this._plastic);
          body.castShadow = true;
          body.receiveShadow = true;
          group.add(body);
          if (y === 1) group.add(this.#sticker('U'));
          if (y === -1) group.add(this.#sticker('D'));
          if (x === 1) group.add(this.#sticker('R'));
          if (x === -1) group.add(this.#sticker('L'));
          if (z === 1) group.add(this.#sticker('F'));
          if (z === -1) group.add(this.#sticker('B'));
          group.userData.cx = x;
          group.userData.cy = y;
          group.userData.cz = z;
          group.position.set(x * gap, y * gap, z * gap);
          group.quaternion.identity();
          this.scene.add(group);
          this.cubies.push(group);
        }
      }
    }
  }

  #disposeCubies() {
    this.cubies.forEach((group) => {
      group.traverse((obj) => {
        if (obj.geometry && obj.geometry !== this._bodyGeo) obj.geometry.dispose();
        if (obj.material && obj.material !== this._plastic) obj.material.dispose();
      });
      group.removeFromParent();
    });
    this.cubies = [];
  }

  #sticker(face) {
    const size = 0.78;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS[face],
      roughness: 0.55,
      metalness: 0.04,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const n = OUTWARD[face].clone();
    mesh.position.copy(n).multiplyScalar(0.478);
    mesh.lookAt(n.clone().multiplyScalar(8));
    return mesh;
  }

  #resize() {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 800;
    this.renderer.setSize(w, h, true);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
  }

  #tick() {
    if (this.anim) this.#step();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setSpeed(value) {
    this.speed = value;
  }

  reset() {
    this.gen += 1;
    this.queue = [];
    this.animating = false;
    if (this.anim) {
      const { resolve } = this.anim;
      this.anim = null;
      resolve();
    }
    this.pivot.quaternion.identity();
    this.pivot.updateMatrixWorld(true);
    this.build();
  }

  enqueue(moves, { urgent } = {}) {
    const list = Array.isArray(moves) ? moves : [moves];
    if (urgent) this.queue.unshift(...list);
    else this.queue.push(...list);
    if (!this.animating) this.#playNext();
  }

  clearQueue() {
    this.queue = [];
  }

  #select(face) {
    return this.cubies.filter((c) => {
      const { cx, cy, cz } = c.userData;
      switch (face) {
        case 'U': return cy === 1;
        case 'D': return cy === -1;
        case 'R': return cx === 1;
        case 'L': return cx === -1;
        case 'F': return cz === 1;
        case 'B': return cz === -1;
        case 'M': return cx === 0;
        case 'E': return cy === 0;
        case 'S': return cz === 0;
        case 'x':
        case 'y':
        case 'z':
          return true;
        default:
          return false;
      }
    });
  }

  async #playNext() {
    const gen = this.gen;
    if (!this.queue.length) {
      this.animating = false;
      this.onQueueEmpty?.();
      return;
    }
    this.animating = true;
    const token = this.queue.shift();
    this.onMoveStart?.(token);
    await this.#animate(token, gen);
    if (gen !== this.gen) {
      this.animating = false;
      return;
    }
    return this.#playNext();
  }

  #snapQuat(mesh) {
    const x = this.#snapVec(new THREE.Vector3(1, 0, 0).applyQuaternion(mesh.quaternion));
    let y = this.#snapVec(new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion));
    if (Math.abs(x.dot(y)) > 0.5) {
      y = new THREE.Vector3(0, 1, 0);
      if (Math.abs(x.dot(y)) > 0.5) y = new THREE.Vector3(1, 0, 0);
    }
    const z = new THREE.Vector3().crossVectors(x, y).normalize();
    y.crossVectors(z, x).normalize();
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }

  #snapVec(v) {
    const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
    if (ax >= ay && ax >= az) return new THREE.Vector3(Math.sign(v.x) || 1, 0, 0);
    if (ay >= az) return new THREE.Vector3(0, Math.sign(v.y) || 1, 0);
    return new THREE.Vector3(0, 0, Math.sign(v.z) || 1);
  }

  #animate(token, gen) {
    const { face, power } = parseMove(token);
    const axis = OUTWARD[face];
    if (!axis) return Promise.resolve();
    const turns = power === 2 ? 2 : 1;
    const sign = SIGN[face] ?? 1;
    const dir = power === 3 ? -sign : sign;
    const angle = dir * (Math.PI / 2) * turns;
    const meshes = this.#select(face);
    const duration = Math.max(70, (power === 2 ? 300 : 200) / this.speed);
    const axisN = axis.clone().normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(axisN, angle);
    const g = this.gap;

    const tracks = meshes.map((m) => {
      const fromPos = m.position.clone();
      const fromQuat = m.quaternion.clone();
      const v = new THREE.Vector3(m.userData.cx, m.userData.cy, m.userData.cz).applyQuaternion(q);
      const cx = Math.round(v.x);
      const cy = Math.round(v.y);
      const cz = Math.round(v.z);
      const toPos = new THREE.Vector3(cx * g, cy * g, cz * g);
      const toQuat = q.clone().multiply(fromQuat);
      return { mesh: m, fromPos, fromQuat, toPos, toQuat, cx, cy, cz };
    });

    return new Promise((resolve) => {
      this.anim = { gen, tracks, duration, start: performance.now(), resolve, axisN, angle };
    });
  }

  #step() {
    if (this._stepping || !this.anim) return;
    this._stepping = true;
    try {
      const anim = this.anim;
      if (anim.gen !== this.gen) {
        this.anim = null;
        anim.resolve();
        return;
      }
      const t = Math.min(1, (performance.now() - anim.start) / anim.duration);
      const k = easeInOutCubic(t);
      anim.tracks.forEach((tr) => {
        const qk = new THREE.Quaternion().setFromAxisAngle(anim.axisN, anim.angle * k);
        tr.mesh.position.copy(tr.fromPos).applyAxisAngle(anim.axisN, anim.angle * k);
        tr.mesh.quaternion.copy(qk).multiply(tr.fromQuat);
      });
      if (t >= 1) {
        anim.tracks.forEach((tr) => {
          tr.mesh.position.copy(tr.toPos);
          tr.mesh.quaternion.copy(tr.toQuat);
          tr.mesh.userData.cx = tr.cx;
          tr.mesh.userData.cy = tr.cy;
          tr.mesh.userData.cz = tr.cz;
        });
        this.anim = null;
        anim.resolve();
      }
    } finally {
      this._stepping = false;
    }
  }
}
