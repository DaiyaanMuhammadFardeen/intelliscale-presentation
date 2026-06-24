import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── GLSL Simplex Noise (Ian McEwan / Ashima Arts) ──────────────────────────

const NOISE_VERTEX_SHADER = `
uniform float mouseX;
uniform float mouseY;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vec3 displaced = position;
  displaced.x += position.z * mouseX * 0.02;
  displaced.y += position.z * mouseY * 0.02;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`

const NOISE_FRAGMENT_SHADER = `
uniform float uTime;
uniform vec3 uColor;
uniform float mouseX;
uniform float mouseY;
varying vec3 vPosition;

vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec3 p = vPosition * 1.5 + uTime * 0.2;
  float noiseValue = snoise(p);
  float intensity = noiseValue * 0.5 + 0.5;
  vec3 glowColor = uColor * (0.5 + intensity * 0.8);
  float alpha = 0.7 + intensity * 0.3;
  gl_FragColor = vec4(glowColor, alpha);
}
`

// ── Component ──────────────────────────────────────────────────────────────

export default function CrystalSphere({ color = 'var(--bright-cyan)', mouseX = 0, mouseY = 0, pulse = false }) {
  const meshRef = useRef()
  const pulseRef = useRef({ active: false, time: 0, prev: false })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    mouseX: { value: 0 },
    mouseY: { value: 0 },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []) // empty deps: uniforms must be stable ref for shader material

  useEffect(() => {
    uniforms.uColor.value.set(color)
  }, [color, uniforms.uColor])

  useFrame((state, delta) => {
    uniforms.uTime.value += delta * 0.8

    // Mouse parallax — smooth lerp
    uniforms.mouseX.value += (mouseX - uniforms.mouseX.value) * 0.05
    uniforms.mouseY.value += (mouseY - uniforms.mouseY.value) * 0.05

    // Rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4
    }

    // Pulse animation — single pulse triggered on rising edge of `pulse`
    const p = pulseRef.current
    if (pulse && !p.prev) {
      p.active = true
      p.time = 0
    }
    p.prev = pulse

    if (p.active && meshRef.current) {
      p.time += delta
      const t = Math.min(p.time / 0.6, 1)
      // Ease-in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      const s = 1 + 0.4 * ease
      meshRef.current.scale.set(s, s, s)
      if (t >= 1) {
        p.active = false
        meshRef.current.scale.set(1, 1, 1)
      }
    }
  })

  return (
    <group>
      {/* Layer 1 — Inner core with noise shader */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={NOISE_VERTEX_SHADER}
          fragmentShader={NOISE_FRAGMENT_SHADER}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 2 — Outer glass shell */}
      <mesh>
        <sphereGeometry args={[2.0, 64, 64]} />
        <meshPhysicalMaterial
          transparent
          roughness={0}
          transmission={0.9}
          thickness={0.5}
          envMapIntensity={1}
          opacity={0.6}
          ior={1.5}
        />
      </mesh>
    </group>
  )
}


