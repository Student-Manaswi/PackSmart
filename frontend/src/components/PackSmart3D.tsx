import { useEffect, useRef } from "react";
import * as THREE from "three";

export type BoxType = "cardboard" | "bottle" | "plywood";

export interface PackSmartProps {
  length: number;
  breadth: number;
  height: number;
  boxType: BoxType;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    width: "100%",
    height: "520px", // fixed height ensures 3d canvas appears inside card (parent has min-height only)
    minHeight: "500px",
    overflow: "hidden",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    background: "transparent",
    color: "#333",
  },
  ui: {
    display: "none",
  },
};

function mkMesh(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function mkFlap(w: number, h: number, t: number, mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const p = mkMesh(w, h, t, mat);
  p.position.y = h / 2;
  g.add(p);
  return g;
}

function buildCardboard(L: number, B: number, H: number, t: number, g: THREE.Group, flapAngle = Math.PI / 3.5) {
  const outerMat = new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.85 });
  const dblMat = new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.85, side: THREE.DoubleSide });

  const add = (m: THREE.Mesh, x: number, y: number, z: number) => {
    m.position.set(x, y, z);
    g.add(m);
  };

  add(mkMesh(L, t, B, outerMat), 0, -H / 2 + t / 2, 0);
  add(mkMesh(L, H, t, outerMat), 0, 0, B / 2 - t / 2);
  add(mkMesh(L, H, t, outerMat), 0, 0, -B / 2 + t / 2);
  add(mkMesh(t, H, B - 2 * t, outerMat), -L / 2 + t / 2, 0, 0);
  add(mkMesh(t, H, B - 2 * t, outerMat), L / 2 - t / 2, 0, 0);

  const topY = H / 2;
  const outerFD = B / 2;
  const innerFD = Math.min(L / 2, B / 2 - t);

  const ff = mkFlap(L - 2 * t, outerFD, t, dblMat);
  ff.position.set(0, topY, B / 2 - t);
  ff.rotation.x = flapAngle;
  g.add(ff);

  const fb = mkFlap(L - 2 * t, outerFD, t, dblMat);
  fb.position.set(0, topY, -B / 2 + t);
  fb.rotation.x = -flapAngle;
  g.add(fb);

  const fl = new THREE.Group();
  const flp = mkMesh(innerFD, t, B - 2 * t, dblMat);
  flp.position.set(-innerFD / 2, 0, 0);
  fl.add(flp);
  fl.position.set(-L / 2 + t, topY, 0);
  fl.rotation.z = Math.PI / 2.8;
  g.add(fl);

  const fr = new THREE.Group();
  const frp = mkMesh(innerFD, t, B - 2 * t, dblMat);
  frp.position.set(innerFD / 2, 0, 0);
  fr.add(frp);
  fr.position.set(L / 2 - t, topY, 0);
  fr.rotation.z = -Math.PI / 2.8;
  g.add(fr);
}


function buildBottleBox(L: number, B: number, H: number, t: number, g: THREE.Group) {
  const outerMat = new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.85 });
  const dblMat = new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.85, side: THREE.DoubleSide });

  const add = (m: THREE.Mesh, x: number, y: number, z: number) => {
    m.position.set(x, y, z);
    g.add(m);
  };

  add(mkMesh(L, t, B, outerMat), 0, -H / 2 + t / 2, 0);
  add(mkMesh(L, H, t, outerMat), 0, 0, B / 2 - t / 2);
  add(mkMesh(L, H, t, outerMat), 0, 0, -B / 2 + t / 2);
  add(mkMesh(t, H, B - 2 * t, outerMat), -L / 2 + t / 2, 0, 0);
  add(mkMesh(t, H, B - 2 * t, outerMat), L / 2 - t / 2, 0, 0);

  const topY = H / 2;

  const tf = mkFlap(L - 2 * t, B, t, dblMat);
  tf.position.set(0, topY, -B / 2 + t);
  tf.rotation.x = -Math.PI / 5;
  g.add(tf);

  const tabH = Math.min(B * 0.2, 0.8);
  const tab = mkMesh(L * 0.9, tabH, t, dblMat);
  tab.position.set(0, B + tabH / 2, 0);
  tab.rotation.x = Math.PI / 7;
  tf.add(tab);

  const ldg = new THREE.Group();
  const ldp = mkMesh(B / 2, t, B - 2 * t, dblMat);
  ldp.position.set(-B / 4, 0, 0);
  ldg.add(ldp);
  ldg.position.set(-L / 2 + t, topY, 0);
  ldg.rotation.z = Math.PI / 4;
  g.add(ldg);

  const rdg = new THREE.Group();
  const rdp = mkMesh(B / 2, t, B - 2 * t, dblMat);
  rdp.position.set(B / 4, 0, 0);
  rdg.add(rdp);
  rdg.position.set(L / 2 - t, topY, 0);
  rdg.rotation.z = -Math.PI / 4;
  g.add(rdg);
}

function buildPlywood(L: number, B: number, H: number, t: number, g: THREE.Group, floor: THREE.Mesh) {
  const plyMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xc19a6b, roughness: 1.0 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.8 });

  const body = mkMesh(L, H, B, plyMat);
  body.position.set(0, 0, 0);
  g.add(body);

  const fT = Math.min(L, B, H) * 0.08;

  const cf = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const p = mkMesh(w, h, d, frameMat);
    p.position.set(x, y, z);
    g.add(p);
  };

  cf(L + 0.02, fT, fT, 0, H / 2, B / 2);
  cf(L + 0.02, fT, fT, 0, H / 2, -B / 2);
  cf(L + 0.02, fT, fT, 0, -H / 2, B / 2);
  cf(L + 0.02, fT, fT, 0, -H / 2, -B / 2);
  cf(fT, fT, B + 0.02, L / 2, H / 2, 0);
  cf(fT, fT, B + 0.02, -L / 2, H / 2, 0);
  cf(fT, fT, B + 0.02, L / 2, -H / 2, 0);
  cf(fT, fT, B + 0.02, -L / 2, -H / 2, 0);
  cf(fT, H + 0.02, fT, L / 2, 0, B / 2);
  cf(fT, H + 0.02, fT, -L / 2, 0, B / 2);
  cf(fT, H + 0.02, fT, L / 2, 0, -B / 2);
  cf(fT, H + 0.02, fT, -L / 2, 0, -B / 2);

  const cS = fT * 2;
  const cT2 = 0.015;
  const cm = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const p = mkMesh(w, h, d, metalMat);
    p.position.set(x, y, z);
    g.add(p);
  };

  ([
    [1, 1, 1],
    [1, 1, -1],
    [1, -1, 1],
    [1, -1, -1],
    [-1, 1, 1],
    [-1, 1, -1],
    [-1, -1, 1],
    [-1, -1, -1],
  ] as [number, number, number][]).forEach(([x, y, z]) => {
    const cx = (L / 2) * x,
      cy = (H / 2) * y,
      cz = (B / 2) * z;
    cm(cS, cS, cT2, cx, cy, cz + cT2 * z);
    cm(cT2, cS, cS, cx + cT2 * x, cy, cz);
    cm(cS, cT2, cS, cx, cy + cT2 * y, cz);
  });

  const legH = H * 0.15,
    legW = L * 0.15;
  cf(legW, legH, B, L / 2 - legW / 2, -H / 2 - legH / 2, 0);
  cf(legW, legH, B, -L / 2 + legW / 2, -H / 2 - legH / 2, 0);
  cf(legW, legH, B, 0, -H / 2 - legH / 2, 0);
  floor.position.y = -H / 2 - legH;
}

const BOX_LABELS: Record<BoxType, string> = {
  cardboard: "📦 Cardboard (4 Flaps)",
  bottle: "🧴 Bottle Box (Tuck Top)",
  plywood: "🪵 Plywood Crate (Framed)",
};

export default function PackSmart3D({ length, breadth, height, boxType }: PackSmartProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);
  const boxGroupRef = useRef<THREE.Group | null>(null);
  const rafRef = useRef<number>(0);
  const orbitRef = useRef({
    drag: false,
    rightDrag: false,
    px: 0,
    py: 0,
    rpx: 0,
    rpy: 0,
    rotY: 0.6,
    rotX: 0.5,
    zoom: 5,
    panX: 0,
    panY: 0,
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const o = orbitRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(8, 10, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const ml = new THREE.DirectionalLight(0xffffff, 0.8);
    ml.position.set(10, 20, 15);
    ml.castShadow = true;
    ml.shadow.mapSize.set(2048, 2048);
    scene.add(ml);
    const fl = new THREE.DirectionalLight(0xfff5e0, 0.4);
    fl.position.set(-8, 5, -8);
    scene.add(fl);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.15 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    floorRef.current = floor;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const r = o.zoom;
      camera.position.set(
        o.panX + r * Math.sin(o.rotY) * Math.cos(o.rotX),
        o.panY + r * Math.sin(o.rotX),
        r * Math.cos(o.rotY) * Math.cos(o.rotX)
      );
      camera.lookAt(o.panX, o.panY, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const onDown = (e: MouseEvent) => {
      if (e.button === 0) { o.drag = true; o.px = e.clientX; o.py = e.clientY; }
      if (e.button === 2) { o.rightDrag = true; o.rpx = e.clientX; o.rpy = e.clientY; }
    };
    const onUp = () => { o.drag = false; o.rightDrag = false; };
    const onMove = (e: MouseEvent) => {
      if (o.drag) {
        o.rotY += (e.clientX - o.px) * 0.012;
        o.rotX += (e.clientY - o.py) * 0.01;
        o.rotX = Math.max(-1.2, Math.min(1.2, o.rotX));
        o.px = e.clientX;
        o.py = e.clientY;
      }
      if (o.rightDrag) {
        o.panX -= (e.clientX - o.rpx) * 0.01;
        o.panY += (e.clientY - o.rpy) * 0.01;
        o.rpx = e.clientX;
        o.rpy = e.clientY;
      }
    };
    const onWheel = (e: WheelEvent) => {
      o.zoom = Math.max(4, Math.min(40, o.zoom + e.deltaY * 0.03));
      e.preventDefault();
    };
    const onCtxMenu = (e: MouseEvent) => e.preventDefault();

    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("contextmenu", onCtxMenu);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("mousedown", onDown);
      renderer.domElement.removeEventListener("contextmenu", onCtxMenu);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const floor = floorRef.current;
    if (!scene || !floor) return;

    if (boxGroupRef.current) {
      scene.remove(boxGroupRef.current);
      boxGroupRef.current = null;
    }

    const maxDim = Math.max(length, breadth, height);
    const sc = maxDim > 0 ? 2 / maxDim : 1;
    const L = Math.max(0.1, length * sc);
    const B = Math.max(0.1, breadth * sc);
    const H = Math.max(0.1, height * sc);
    const t = Math.max(0.01, Math.min(L, B, H) * 0.04);

    floor.position.y = -H / 2;
    orbitRef.current.zoom = 5;

    const group = new THREE.Group();

    if (boxType === "cardboard") buildCardboard(L, B, H, t, group);
    else if (boxType === "bottle") buildBottleBox(L, B, H, t, group);
    else buildPlywood(L, B, H, t, group, floor);

    scene.add(group);
    boxGroupRef.current = group;
  }, [length, breadth, height, boxType]);

  return (
    <div style={styles.wrapper}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <div style={styles.ui}>
        <h2 style={styles.heading as React.CSSProperties}>PackSmart 3D</h2>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Packaging Type</label>
          <span style={styles.badge}>{BOX_LABELS[boxType]}</span>
        </div>
      </div>
    </div>
  );
}
