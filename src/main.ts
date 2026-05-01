import './style.css'
import * as THREE from 'three'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <canvas id="scene"></canvas>

  <div class="panel">
    <h1>FFT 水計畫</h1>
    <p>個別調整水波高度，觀察合成後的水面</p>

    <div id="wave-controls" class="wave-controls"></div>
  </div>
`

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!
const waveModes = [
  { name: 'Wave 1', kx: 0.7, kz: 0.2, amp: 0.45, speed: 1.4, phase: 0.0 },
  { name: 'Wave 2', kx: 1.1, kz: 0.6, amp: 0.25, speed: 1.9, phase: 1.7 },
  { name: 'Wave 3', kx: -0.4, kz: 0.9, amp: 0.22, speed: 1.2, phase: 2.4 },
  { name: 'Wave 4', kx: 1.6, kz: -0.3, amp: 0.12, speed: 2.6, phase: 3.1 },
  { name: 'Wave 5', kx: -1.3, kz: -0.8, amp: 0.1, speed: 2.1, phase: 0.8 },
]

const waveControls = document.querySelector<HTMLDivElement>('#wave-controls')!

for (const [index, wave] of waveModes.entries()) {
  const row = document.createElement('div')
  row.className = 'wave-row'

  row.innerHTML = `
    <div class="wave-label">
      <span>${wave.name}</span>
      <strong id="wave-value-${index}">${wave.amp.toFixed(2)}</strong>
    </div>
    <input
      id="wave-slider-${index}"
      type="range"
      min="0"
      max="1.5"
      step="0.01"
      value="${wave.amp}"
    />
  `

  waveControls.appendChild(row)

  const slider = row.querySelector<HTMLInputElement>('input')!
  const value = row.querySelector<HTMLElement>(`#wave-value-${index}`)!

  slider.addEventListener('input', () => {
    wave.amp = Number(slider.value)
    value.textContent = wave.amp.toFixed(2)
  })
}

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x07111f)

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
)

camera.position.set(0, 18, 34)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
})

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const sun = new THREE.DirectionalLight(0xffffff, 2.5)
sun.position.set(10, 20, 8)
scene.add(sun)

const ambient = new THREE.AmbientLight(0x6ea8ff, 0.7)
scene.add(ambient)

const waterSize = 36
const segments = 160

const waterGeometry = new THREE.PlaneGeometry(
  waterSize,
  waterSize,
  segments,
  segments,
)

waterGeometry.rotateX(-Math.PI / 2)

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x1479a8,
  roughness: 0.35,
  metalness: 0.15,
  wireframe: false,
})

const water = new THREE.Mesh(waterGeometry, waterMaterial)
scene.add(water)

const grid = new THREE.GridHelper(waterSize, 24, 0x2c9ec4, 0x174b64)
grid.position.y = -0.05
scene.add(grid)

const position = waterGeometry.attributes.position as THREE.BufferAttribute



function animate(time: number) {
  const t = time * 0.001

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const z = position.getZ(i)

    let height = 0

    for (const wave of waveModes) {
      const theta = wave.kx * x + wave.kz * z - wave.speed * t + wave.phase
      height += wave.amp * Math.cos(theta)
    }

    position.setY(i, height)

  }

  position.needsUpdate = true
  waterGeometry.computeVertexNormals()

  water.rotation.y = Math.sin(t * 0.12) * 0.08

  renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
})
