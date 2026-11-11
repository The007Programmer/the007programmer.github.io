import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"

/* Small modelling helpers: build an object from simple parts and merge them per material, so a detailed prop
   costs a handful of draw calls instead of one per screw. */
type V3 = [number, number, number]
export interface Part { g: THREE.BufferGeometry; p?: V3; r?: V3; s?: V3 }

const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3()
export function merge(parts: Part[]): THREE.BufferGeometry {
  const gs = parts.map(({ g, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] }) => {
    const out = g.index ? g.toNonIndexed() : g.clone() // some primitives are indexed and some are not; merging needs one or the other
    m4.compose(v4.set(...p), q4.setFromEuler(e4.set(...r)), s4.set(...s))
    out.applyMatrix4(m4)
    // every part must carry the same attribute set to merge
    for (const k of Object.keys(out.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") out.deleteAttribute(k)
    return out
  })
  const merged = mergeGeometries(gs, false)!
  gs.forEach((g) => g.dispose())
  return merged
}
export const rbox = (w: number, h: number, d: number, r: number, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, r)
export const cyl = (rt: number, rb: number, h: number, n = 32) => new THREE.CylinderGeometry(rt, rb, h, n)

/* fine vertical grooves around a cylinder: a bump map for knurled dials, rings and wheels */
export function knurlTex(stripes = 48) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 8
  const g = c.getContext("2d")!
  g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 8)
  const w = 512 / stripes
  for (let i = 0; i < stripes; i++) { const grd = g.createLinearGradient(i * w, 0, (i + 1) * w, 0); grd.addColorStop(0, "#000"); grd.addColorStop(0.5, "#fff"); grd.addColorStop(1, "#000"); g.fillStyle = grd; g.fillRect(i * w, 0, w, 8) }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4
  return t
}
