# 將 three.js 融入網頁中

###### tags: three

## 簡介

**有時候會希望能將 three.js 及 WebGL 的許多特性導入一般網頁中，例如將其當作背景，以下會利用three.js的camera特性製造滾動視差及一些網頁特效：**

## 安裝

### 使用vite打包 [vite 官方文件](https://vitejs.dev/guide/)
### npm i three [three.js 官方文件](https://threejs.org/docs/index.html#manual/en/introduction/Installation)
### npm i lil-gui [Debug工具介紹](https://juejin.cn/post/7055489959511195684)

## 初始化

### 不建議使用 OrbitControls (使用者可以隨意移動相機視角)
### 原因：因為是以一般網頁為主體，故應該由工程師來操控變化

```
// Debug 工具
const gui = new dat.GUI()

// 建立參數
const parameters = {
    materialColor: '#ffeded'
}

// 將參數傳入gui 以便於畫面中調整
gui.addColor(parameters, 'materialColor')
```

### 將canvas背景設為透明

```
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true //開啟alpha屬性 預設為0 透明色
})

// renderer.setClearAlpha(0) 可透過設定改變alpha預設值
// renderer.setClearAlpha(1) 就是黑色
```


![](https://i.imgur.com/b6V1S2v.png)

### 建立基本的物件及材質

#### Material 材質這邊使用的是 [MeshToonMaterial](https://threejs.org/docs/index.html?q=toon#api/en/materials/MeshToonMaterial) 其中一個特性是需設置光源 不然會是黑色的
![](https://i.imgur.com/yE3tLnH.png)

#### Geometry 形狀 TorusGeometry, ConeGeometry, TorusKnotGeometry

##### 官方文件中有許多material, geometry可以自行更換，只是要注意每個需要帶入的參數不同

```
// 材質
const material = new THREE.MeshToonMaterial({ color: parameters.materialColor })

// Meshes
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
```

### 設置光源 這邊使用的是 [DirectionalLight](https://threejs.org/docs/index.html?q=Direc#api/en/lights/DirectionalLight)
```
// 光

const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)
```

![](https://i.imgur.com/bmc0awM.png)

### 使用gui微調顏色

```
gui
    .addColor(parameters, 'materialColor')
    .onChange(() =>
    {
        material.color.set(parameters.materialColor)
    })
```
![](https://i.imgur.com/gCEYqC7.png)

### 漸層紋理

**MeshToonMaterial的特性是面向光源的部分較亮，另一面則較暗，所以我們可以使用 [TextureLoader](https://threejs.org/docs/#api/en/loaders/TextureLoader) 來調整這個特性**

```
// 紋理
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load('textures/gradients/3.jpg')

//帶入紋理
const material = new THREE.MeshToonMaterial({
    color: parameters.materialColor,
    gradientMap: gradientTexture
})
```

![](https://i.imgur.com/JRsUppK.png)

**帶入紋理後，效果不盡理想，紋理的png為3x1的小圖片，WebGL預設會試著將圖片插入對應的pixels(這邊比較抽象，可以自己換圖片試試)，這邊會利用texture的其中一個屬性：magFilter，並將其帶入Three.NearestFilter，所以就不會將其插入對應的px? (這邊我也還在研究，有興趣可以上官網看看文件)，以下為原文：**

![](https://i.imgur.com/X9jsHvv.png)

**有了明顯的效果**

![](https://i.imgur.com/PjjfKdP.png)

### 設定物件的位置

**three.js預設的位置(0,0,0)是畫面正中間(上面的圖片那樣，原本是都疊在一起的，因為預設位置都是(0,0,0)，改變y軸的話則是會呈現以下這樣：**

```
mesh1.position.y = 2
mesh1.scale.set(0.5, 0.5, 0.5)

mesh2.visible = false

mesh3.position.y = - 2
mesh3.scale.set(0.5, 0.5, 0.5)
```

![](https://i.imgur.com/zcW4qVh.png)

**所以如果要製造出互動效果(以此情境來說就是倆倆物件不出現在同個畫面)，我們只需要抓好y軸距離**

```
//定義一個距離常數
const objectsDistance = 4

//設定三個物件的y軸 0, 4, 8
mesh1.position.y = - objectsDistance * 0
mesh2.position.y = - objectsDistance * 1
mesh3.position.y = - objectsDistance * 2
```

**現在只會看到mesh1，其他物件則是藏在畫布的下方**

![](https://i.imgur.com/HYGCYWz.png)

### 加入旋轉效果

先建立一個陣列，放入建立好的三個物件

```
const sectionMeshes = [ mesh1, mesh2, mesh3 ]
```

在最後面的tick()方法中加入時間參數並監聽變化(隨著時間改變更新位置，達到旋轉的效果)
[for...of](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for...of)

```
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // 使用 for ... of
    for(const mesh of sectionMeshes)
    {
        mesh.rotation.x = elapsedTime * 0.1
        mesh.rotation.y = elapsedTime * 0.12
    }

    // ...
}
```
![](https://i.imgur.com/ec8szei.png)

### 帶入相機(視角)並與scroll產生互動變化

```
// 帶入 scrollY
let scrollY = window.scrollY

// 監聽 scroll 事件
window.addEventListener('scroll', () =>
{
    scrollY = window.scrollY
})
```

#### 將改變的值放入動畫的方法中
**因為 *畫布中的單位並非px* ，所以需要針對各個情境去抓距離，這邊每個section的高度皆為100vh，所以我們要抓出 scrollY 跟畫布高度的比例等於在畫布中每個單位的距離，意思是我們滑動的距離 scrollY / 100vh 為一單位的y軸(有點抽象的概念，可以嘗試自己建立物件並且設定x,y,z去體會一下3D)**

```
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // 旋轉動畫
    for(const mesh of sectionMeshes)
    {
        mesh.rotation.x = elapsedTime * 0.1
        mesh.rotation.y = elapsedTime * 0.12
    }

    // 視角動畫
    // camera.position.y = scrollY <= 直覺一定是先這樣寫，會發現方向不對
    // camera.position.y = - scrollY <= 方向對了，但是太靈敏了，因為在webGL中的單位並非px，有點抽象需要自己體會
    //
 
    camera.position.y = - scrollY / sizes.height * objectsDistance

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
```

![](https://i.imgur.com/rJf1s4j.png)

![](https://i.imgur.com/JEGjX1z.png)

### 滑鼠互動效果

#### 先取得滑鼠位置，並將其換算成畫布距離的比例


```
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
    
    // 可以自行打開console看這三個邏輯的漸進變化
    //console.log(cursor)
})
```

#### 並將相機群組，並且帶入個別位置，如果沒將相機群組，則兩個動畫(滾動+滑鼠)則會互相影響

```
const tick = () =>
{
    // ...

    // Animate camera
    camera.position.y = - scrollY / sizes.height * objectsDistance

    const parallaxX = cursor.x
    const parallaxY = - cursor.y
    
    cameraGroup.position.x = parallaxX
    cameraGroup.position.y = parallaxY

    // ...
}
```

### 滑鼠 Easing

```
cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 0.5
cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 0.5
```

### onClick 動畫

#### 新增隕石
![](https://i.imgur.com/4a7NLPP.png)


```
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
```

#### 流星雨
![](https://i.imgur.com/jiQ9JnZ.png)


```
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
```

#### 黑洞

![](https://i.imgur.com/W4TdCKE.png)

```
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
```