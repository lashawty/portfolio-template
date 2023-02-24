import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'

// Debug
const gui = new dat.GUI()

const parameters = {
    materialColor: '#ffeded',
}

gui
    //添加參數 .add .addColor(則是添加顏色參數)
    .addColor(parameters, 'materialColor')
    //監聽變化 不然不會改變
    .onChange(() =>
    {
        material.color.set(parameters.materialColor)
        particlesMaterial.color.set(parameters.materialColor)
    })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// 場景
const scene = new THREE.Scene()

// 載入紋理
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load('textures/gradients/3.jpg')
gradientTexture.magFilter = THREE.NearestFilter
// 物件
// 材質
const material = new THREE.MeshToonMaterial({ 
    color: parameters.materialColor, 
    gradientMap: gradientTexture //帶入紋理
    
})

// 帶入材質及形狀
const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
)

scene.add(mesh1, mesh2, mesh3)

//定義一個距離常數
const objectsDistance = 4

//設定三個物件的y軸 0, 4, 8
mesh1.position.y = - objectsDistance * 0
mesh2.position.y = - objectsDistance * 1
mesh3.position.y = - objectsDistance * 2

// 光源
const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)

//canvas 寬高=裝置寬高
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// 視角群組(跟物件才不會互相影響)
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

// 渲染器
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true // 將canvas背景設為透明 例如iphone往下滑會有一個類似鬆緊帶的感覺 若沒有使用body作為背景色 會有色差
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// renderer.setClearAlpha(1) //黑色


// 動畫區塊

// 帶入scrollY
let scrollY = window.scrollY
let currentSection = 0
window.addEventListener('scroll', () =>
{
    scrollY = window.scrollY
    const newSection = Math.round(scrollY / sizes.height)
    
    if(newSection != currentSection)
    {
        currentSection = newSection

        gsap.to(
            sectionMeshes[currentSection].rotation,
            {
                duration: 1.5,
                ease: 'power2.inOut',
                x: '+=6',
                y: '+=3',
                z: '+=1.5'
            }
        )
    }
})

// 滑鼠座標
const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove', (event) =>
{
    // 一般的滑鼠座標
    //cursor.x = event.clientX
    //cursor.y = event.clientY
    
    // 換算成畫布比例
    //cursor.x = event.clientX / sizes.width
    //cursor.y = event.clientY / sizes.height
    
    // 調整座標位置 0~1 => -0.5~0.5
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5
    
    // 可打開console看這三個邏輯的漸進變化
    //console.log(cursor)
})



const sectionMeshes = [ mesh1, mesh2, mesh3 ] //將三個物件存進陣列
const clock = new THREE.Clock() 
let previousTime = 0 //宣告時間變數以便建立時間差

// 粒子背景
const particlesCount = 200
const positions = new Float32Array(particlesCount * 3)
for(let i = 0; i < particlesCount; i++)
{
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
}
const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
// Material
const particlesMaterial = new THREE.PointsMaterial({
    color: parameters.materialColor,
    sizeAttenuation: true,
    size: 0.03
})
// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    //更新時間差
    const deltaTime = elapsedTime - previousTime //大約0.16秒
    previousTime = elapsedTime
    
    // 旋轉動畫
    for(const mesh of sectionMeshes)
    {
        // mesh.rotation.x = elapsedTime * 0.1
        // mesh.rotation.y = elapsedTime * 0.12
        mesh.rotation.x += deltaTime * 0.1
        mesh.rotation.y += deltaTime * 0.12
    }

    // 視角動畫
    camera.position.y = - scrollY / sizes.height * objectsDistance
    
    // 滑鼠互動
    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5

    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * .5
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * .5

    // Render
    renderer.render(scene, camera)

    // 每更新一禎畫面 跑一次function
    window.requestAnimationFrame(tick)
}

tick()