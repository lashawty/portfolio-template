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

//隕石
const meteoriteTexture = textureLoader.load('textures/gradients/stone.jpeg')
const meteoriteMaterial = new THREE.MeshPhongMaterial({ 
    color: parameters.materialColor, 
    alphaMap: meteoriteTexture//帶入紋理
})

let meteorites = []
let animating = false
const meteoAnimateTl = () => {
    const meteoriteGeo = new THREE.DodecahedronGeometry(
        gsap.utils.random(0, 3, .1), 
        gsap.utils.random(0, 1, 1)
    )
    const meteorite = new THREE.Mesh(meteoriteGeo, meteoriteMaterial)

    meteorite.scale.set(.1, .1, .1)
    meteorite.position.set(0,0,gsap.utils.random(1, 5, 1))
    scene.add(meteorite)
    meteorites.push(meteorite)
    
    const tl = gsap.timeline()
    tl.to(meteorite.position, {
        x: gsap.utils.random(-2, 2, .1),
        y: gsap.utils.random(-10, 1, .1),
        z: gsap.utils.random(2, 4, .1),
        duration: 5,
        delay: .2,
    })
    .to(meteorite.rotation, {
        x: "+=10",
        y: "+=10",
        z: "+=10",
        duration: 5,
    },"<")
    
}

const metroriteClass = document.querySelector('.meteorite')
metroriteClass.addEventListener('click', function () {
    meteoAnimateTl()
})

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
const particlesCount = 1000
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

//流星雨
let raining = false
const newParticles = new THREE.Points(particlesGeometry, particlesMaterial)
const particlesAnimate = () => {
    scene.add(newParticles)
    if (!raining) {
        gsap.to(particles.position, {
            x: `+=${gsap.utils.random(-15,15,1)}`,
            y: "+=-10",
            z: `+=${gsap.utils.random(-2,2,1)}`,
            stagger: 1,
            duration: gsap.utils.random(1,10,.5),
            onStart: self => {raining = true},
            onComplete: self => {
                scene.remove(particles)
                // scene.add(particles)
                scene.add(particles)
                particles.position.set(0,0,0)
                raining = false
            }
        })
    }
}
const shootingStar = document.querySelector('.shooting-stars')
shootingStar.addEventListener('click', particlesAnimate)

//黑洞
const holeGeometry = new THREE.TorusGeometry( 1, .8, 12, 48, )
const holeMaterial = new THREE.MeshPhongMaterial( { 
    color: 0x000000,
    bumpMap: meteoriteTexture
} )
const hole = new THREE.Mesh( holeGeometry, holeMaterial)
hole.scale.set(.1, .1, .1)
hole.position.set(5, objectsDistance * -2, 1.5)
scene.add( hole )
const blackHole = document.querySelector('.black-hole')
let sucking = false
gsap.to(hole.rotation, {
    repeat: -1,
    z: 5,
    ease: "bounce"
 }
)
blackHole.addEventListener('click', function () {
    if (sucking) return
    sucking = true
    
    const tl = gsap.timeline()
    let positionArr = [mesh1.position, mesh2.position, mesh3.position, newParticles.position, particles.position]
    let scaleArr = [mesh1.scale, mesh2.scale, mesh3.scale, newParticles.scale, particles.scale]
    
    tl
    .to(hole.position, {
        x: 1.5,
        duration: 2,
    })
    .to(hole.scale, {
        x: .6,
        y: .6,
        z: .6,
        duration: 2
    }, "<")
    .to(positionArr, {
        x: 2,
        y: objectsDistance * -2,
        z: 0,
    })
    .to(scaleArr, {
        x: 0,
        y: 0,
        z: 0,
    }, "<")
    .to(hole.scale,{
        x: 0,
        y: 0,
        z: 0,
        onComplete: self => {
            sucking = false
        }
    })
    meteorites.forEach(e => {
        gsap.to(e.position, {
            x: 2,
            y: objectsDistance * -2,
            z: 0,
            delay: 2,
        })
        gsap.to(e.scale, {
            x: 0,
            y: 0,
            z: 0,
            delay: 2,
        })
    })
})


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
        // hole.rotation.y += elapsedTime 
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