import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Detección de dispositivos móviles para optimizar recursos y rendimiento
const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// SINCRONIZACIÓN AL MILÍMETRO MEJORADA
const LYRICS_SYNC = [
    { time: 0.0,   text: "Anahí 💓" },
    { time: 28.5,  text: "Esta es nuestra historia y pacto de amor..." },
    { time: 35.5,  text: "Cuando frente a las estrellas nos juramos amor..." },
    { time: 42.5,  text: "Le doy gracias a la vida por acercarla a mí..." },
    { time: 49.5,  text: "Eres mi princesa y reina de mi corazón..." },
    { time: 56.0,  text: "Esta es nuestra historia y pacto de amor..." },
    { time: 63.0,  text: "Espero que estés por siempre junto a mí..." },
    { time: 71.0,  text: "Esta es nuestra historia y pacto de amor..." },
    { time: 76.5,  text: "Las estrellas fueron testigo en nuestro pacto de amor..." },
    { time: 82.0,  text: "Nuestro pacto de amor..." },
    { time: 87.5,  text: "Anahí 💓" },
    { time: 112.5, text: "Esta alegría que siento no puedo describir..." },
    { time: 118.5, text: "El amor es lo más lindo que puede existir..." },
    { time: 126.0, text: "Que DIOS ilumine por siempre nuestro pacto de amor..." },
    { time: 133.0, text: "Estaremos juntos amor hasta la eternidad..." },
    { time: 141.5, text: "Esta es nuestra historia y pacto de amor..." },
    { time: 148.0, text: "Espero que estés por siempre junto a mí..." },
    { time: 154.5, text: "Esta es nuestra historia y pacto de amor..." },
    { time: 161.5, text: "Las estrellas fueron testigo en nuestro pacto de amor..." },
    { time: 167.5, text: "Anahí 💓 por siempre" }
];

const CONFIG = {
    galaxy: { rotationSpeed: 0.1, centerExclusionRadius: 45 },
    elementExclusionRadius: 55, 
    blackHole: { radius: 12, segments: isMobile ? 32 : 64, color1: '#000000', color2: '#080014' },
    
    accretionRing: {
        innerRadius: 18, outerRadius: 34, segments: isMobile ? 64 : 128,
        centerColor: '#E2B0FF',
        midColor: '#A855F7',
        edgeColor: '#6B21A8',
        emissiveIntensity: 0.8,
    },
    particles: {
        // Reducción drástica de partículas en celulares para evitar trabas
        coreStars: { count: isMobile ? 4000 : 22000, radius: 125, maxHeight: 60, size: 0.25 },
        sphericalHalo: { count: isMobile ? 2500 : 18000, radiusXZ: 115, radiusY: 55, size: 0.18, minDistFromCenter: 28 },
        backgroundStars: { count: isMobile ? 1200 : 6000, radius: 550, size: 0.22 },
        
        emojis: {
            count: isMobile ? 18 : 65, 
            size: 12,
            minRadius: null, maxRadius: 120,
            content:[ '💖', '✨', '💞', '💜', '❤️', '💐', '🌸', '🌹', '✨', '🌷' ],
            colors:[
                { fill: '#E2B0FF', shadow: '#A855F7' },
                { fill: '#F5D0FF', shadow: '#D946EF' },
                { fill: '#C084FC', shadow: '#6B21A8' }
            ]
        }
    },
    shootingStars: { enabled: true, spawnProbability: isMobile ? 0.01 : 0.02, speed: 1.5 },
    lighting: {
        ambientLight: { color: '#ffffff', intensity: 0.1 },
        pointLight: { color: '#C084FC', intensity: 2.8, distance: 350 }
    },
    bloomEffect: { threshold: 0.55, strength: isMobile ? 0.4 : 0.85, radius: 0.6 },
    cameraControls: { minDistance: 30, maxDistance: 250 }
};

let scene, camera, renderer, controls, galaxyGroup, clock, sphereMaterial, composer;
let loveImages = [], shootingStars = [], starTextures = [];
let occupiedPositions = [];

function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('galaxy-canvas'), antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limita pixel ratio para fluidez en móviles
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.minDistance = CONFIG.cameraControls.minDistance;
    controls.maxDistance = CONFIG.cameraControls.maxDistance;
    controls.target.set(0, 0, 0); // Fija el centro exacto de la galaxia

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = CONFIG.bloomEffect.threshold;
    bloomPass.strength = CONFIG.bloomEffect.strength;
    bloomPass.radius = CONFIG.bloomEffect.radius;
    
    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    starTextures = [
        createStarTexture('⭐'),
        createStarTexture('🌟')
    ];

    const { ambientLight, pointLight } = CONFIG.lighting;
    scene.add(new THREE.AmbientLight(ambientLight.color, ambientLight.intensity));
    const mainLight = new THREE.PointLight(pointLight.color, pointLight.intensity, pointLight.distance);
    mainLight.position.set(0, 0, 0);
    scene.add(mainLight);
    
    galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    createBlackHole();
    createCoreStars();
    createSphericalHalo();
    createBackgroundStars();
    createLoveElements();

    window.addEventListener('resize', onWindowResize);
    onWindowResize();
    animate();
}

function createBlackHole() {
    const bhConfig = CONFIG.blackHole;
    const ringConfig = CONFIG.accretionRing;
    
    sphereMaterial = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0.0 }, uColor1: { value: new THREE.Color(bhConfig.color1) }, uColor2: { value: new THREE.Color(bhConfig.color2) } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime; uniform vec3 uColor1; uniform vec3 uColor2; varying vec2 vUv; float noise(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); } void main() { float n = noise(vUv * 4.0 + uTime * 0.1); vec3 mixedColor = mix(uColor1, uColor2, n); gl_FragColor = vec4(mixedColor, 1.0); }`
    });
    
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(bhConfig.radius, bhConfig.segments, bhConfig.segments), sphereMaterial));
    
    const ringGeometry = new THREE.RingGeometry(ringConfig.innerRadius, ringConfig.outerRadius, ringConfig.segments);
    const ringMaterial = new THREE.ShaderMaterial({
        uniforms: { innerRadius: { value: ringConfig.innerRadius }, outerRadius: { value: ringConfig.outerRadius }, centerColor: { value: new THREE.Color(ringConfig.centerColor) }, midColor: { value: new THREE.Color(ringConfig.midColor) }, edgeColor: { value: new THREE.Color(ringConfig.edgeColor) }, emissiveIntensity: { value: ringConfig.emissiveIntensity } },
        vertexShader: `varying vec3 vPosition; void main() { vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float innerRadius; uniform float outerRadius; uniform vec3 centerColor; uniform vec3 midColor; uniform vec3 edgeColor; uniform float emissiveIntensity; varying vec3 vPosition; void main() { float distance = length(vPosition.xy); float normalizedDistance = clamp((distance - innerRadius) / (outerRadius - innerRadius), 0.0, 1.0); vec3 finalColor; if (normalizedDistance < 0.5) { finalColor = mix(centerColor, midColor, normalizedDistance * 2.0); } else { finalColor = mix(midColor, edgeColor, (normalizedDistance - 0.5) * 2.0); } float glowFactor = 1.0 - smoothstep(0.0, 1.0, normalizedDistance); vec3 emissiveColor = finalColor * emissiveIntensity * glowFactor; gl_FragColor = vec4(finalColor + emissiveColor, 1.0); }`,
        side: THREE.DoubleSide
    });
    
    const goldenRing = new THREE.Mesh(ringGeometry, ringMaterial);
    goldenRing.rotation.x = Math.PI / 2;
    scene.add(goldenRing);
}

function createCoreStars() {
    const coreConfig = CONFIG.particles.coreStars;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(coreConfig.count * 3);
    const colors = new Float32Array(coreConfig.count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < coreConfig.count; i++) {
        const distance = CONFIG.accretionRing.outerRadius + Math.random() * (coreConfig.radius - CONFIG.accretionRing.outerRadius);
        const angle = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * coreConfig.maxHeight * Math.pow(1 - (distance / coreConfig.radius), 1.5);
        positions.set([Math.cos(angle) * distance, y, Math.sin(angle) * distance], i * 3);
        
        const hue = 0.72 + Math.random() * 0.14;
        const saturation = 0.85 + Math.random() * 0.15;
        const lightness = 0.55 + Math.random() * 0.4;
        color.setHSL(hue % 1, saturation, lightness);
        colors.set([color.r, color.g, color.b], i * 3);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: coreConfig.size, blending: THREE.AdditiveBlending, vertexColors: true, transparent: true });
    galaxyGroup.add(new THREE.Points(geometry, material));
}

function createSphericalHalo() {
    const haloConfig = CONFIG.particles.sphericalHalo;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(haloConfig.count * 3);
    const colors = new Float32Array(haloConfig.count * 3);
    const color = new THREE.Color();

    let filled = 0;
    while (filled < haloConfig.count) {
        const rx = (Math.random() * 2 - 1);
        const ry = (Math.random() * 2 - 1);
        const rz = (Math.random() * 2 - 1);

        if (rx * rx + ry * ry + rz * rz > 1.0) continue;

        const x = rx * haloConfig.radiusXZ;
        const y = ry * haloConfig.radiusY;
        const z = rz * haloConfig.radiusXZ;

        const distFromCenter = Math.sqrt(x * x + y * y + z * z);
        if (distFromCenter < haloConfig.minDistFromCenter) continue;

        const rNorm = distFromCenter / Math.max(haloConfig.radiusXZ, haloConfig.radiusY);
        if (Math.random() > Math.pow(1.0 - rNorm * 0.7, 1.2)) continue;

        positions.set([x, y, z], filled * 3);

        const hue = 0.70 + Math.random() * 0.15;
        const saturation = 0.7 + Math.random() * 0.3;
        const lightness = 0.45 + Math.random() * 0.45;
        color.setHSL(hue % 1, saturation, lightness);
        colors.set([color.r, color.g, color.b], filled * 3);

        filled++;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: haloConfig.size,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        opacity: 0.7
    });

    galaxyGroup.add(new THREE.Points(geometry, material));
}

function createLoveElements() {
    const emojiConfig = CONFIG.particles.emojis;

    for (let i = 0; i < emojiConfig.count; i++) {
        const colorData = emojiConfig.colors[i % emojiConfig.colors.length];
        const emoji = emojiConfig.content[i % emojiConfig.content.length];
        const texture = createEmojiTexture(emoji, colorData);
        
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const emojiSprite = new THREE.Sprite(material);
        emojiSprite.scale.set(emojiConfig.size, emojiConfig.size, 1);
        
        setElementOrbitPosition(emojiSprite, emojiConfig.minRadius, emojiConfig.maxRadius);
        galaxyGroup.add(emojiSprite); 
        loveImages.push(emojiSprite);
    }
}

function createBackgroundStars() {
    const bgConfig = CONFIG.particles.backgroundStars;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(bgConfig.count * 3);
    
    for (let i = 0; i < bgConfig.count; i++) {
        const r = bgConfig.radius;
        positions.set([(Math.random() - 0.5) * 2 * r, (Math.random() - 0.5) * 2 * r, (Math.random() - 0.5) * 2 * r], i * 3);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: bgConfig.size, color: 0xd8b4fe, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(geometry, material));
}

function createStarTexture(starChar) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Reducido para optimizar memoria móvil
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.font = '80px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.shadowColor = '#ff69b4'; 
    ctx.shadowBlur = 12;
    ctx.fillText(starChar, canvas.width / 2, canvas.height / 2 + 5);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createShootingStar(isMassiveShower = false) {
    let starObj;
    if (isMassiveShower && starTextures.length > 0) {
        const randomTexture = starTextures[Math.floor(Math.random() * starTextures.length)];
        const material = new THREE.SpriteMaterial({ map: randomTexture, transparent: true, blending: THREE.AdditiveBlending });
        starObj = new THREE.Sprite(material);
        
        const scaleSize = 8 + Math.random() * 6; 
        starObj.scale.set(scaleSize, scaleSize, 1);
    } else {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
        const material = new THREE.PointsMaterial({ color: 0xf0abfc, size: 2.2, blending: THREE.AdditiveBlending, transparent: true });
        starObj = new THREE.Points(geometry, material);
    }

    const x = THREE.MathUtils.randFloatSpread(1000);
    const y = THREE.MathUtils.randFloat(150, 450);
    const z = THREE.MathUtils.randFloatSpread(1000);
    starObj.position.set(x, y, z);
    
    const speedMultiplier = isMassiveShower ? 2.5 : 1.3;
    starObj.userData.velocity = new THREE.Vector3(
        (Math.random() < 0.5 ? -1 : 1) * CONFIG.shootingStars.speed * speedMultiplier,
        -CONFIG.shootingStars.speed * 0.75 * speedMultiplier,
        (Math.random() - 0.5) * 4
    );
    starObj.userData.life = 0;

    shootingStars.push(starObj);
    scene.add(starObj);
}

function setElementOrbitPosition(element, minRadius, maxRadius) {
    const safeMinRadius = minRadius || CONFIG.elementExclusionRadius;
    const safeMaxRadius = maxRadius || CONFIG.particles.coreStars.radius;
    const minSeparation = 18; 
    const maxAttempts = 50;
    let validPosition = false; 
    let attempts = 0;
    let finalPosition = { x: 0, y: 0, z: 0 };
    
    while (!validPosition && attempts < maxAttempts) {
        attempts++;
        const radius = safeMinRadius + Math.random() * (safeMaxRadius - safeMinRadius);
        const theta = Math.random() * Math.PI * 2;
        const maxVerticalOffset = 15;
        const y = (Math.random() - 0.5) * maxVerticalOffset;
        const x = radius * Math.cos(theta); 
        const z = radius * Math.sin(theta);
        
        validPosition = true;
        for (let pos of occupiedPositions) {
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2) + Math.pow(z - pos.z, 2));
            if (distance < minSeparation) { validPosition = false; break; }
        }
        if (validPosition) finalPosition = { x, y, z };
    }
    
    element.position.set(finalPosition.x, finalPosition.y, finalPosition.z);
    occupiedPositions.push(finalPosition);
}

function createEmojiTexture(emoji, colorData) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; // Reducido para evitar congelamientos en móviles
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.font = '160px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.shadowColor = colorData.shadow; 
    ctx.shadowBlur = 16; 
    ctx.fillStyle = colorData.fill;
    ctx.fillText(emoji, canvas.width / 2, canvas.height / 2 + 8);

    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.colorSpace = THREE.SRGBColorSpace;
    newTexture.generateMipmaps = false;
    newTexture.minFilter = THREE.LinearFilter;
    newTexture.magFilter = THREE.LinearFilter;
    return newTexture;
}

function onWindowResize() {
    const width = window.innerWidth, height = window.innerHeight;
    renderer.setSize(width, height);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.set(0, 0, width < 768 ? 150 : 120);
    controls.target.set(0, 0, 0); // Mantiene el centro perfectamente alineado con el texto
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    galaxyGroup.rotation.y = elapsedTime * CONFIG.galaxy.rotationSpeed;
    if (sphereMaterial) sphereMaterial.uniforms.uTime.value = elapsedTime;

    if (CONFIG.shootingStars.enabled && Math.random() < CONFIG.shootingStars.spawnProbability) {
        createShootingStar(false);
    }
    
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.position.add(star.userData.velocity);
        star.userData.life++;
        if (star.userData.life > 300) {
            scene.remove(star);
            if (star.geometry) star.geometry.dispose();
            if (star.material) star.material.dispose();
            shootingStars.splice(i, 1);
        }
    }
    
    controls.update();

    // En celulares usamos render directo para evitar la sobrecarga del EffectComposer (Bloom)
    if (isMobile) {
        renderer.render(scene, camera);
    } else {
        composer.render();
    }
}

init();

// GESTIÓN DE AUDIO Y SINCRONIZACIÓN DE LA LETRA OPTIMIZADA
const music = document.getElementById('background-music');
let lastActiveText = ""; // Evita sobrescribir el DOM constantemente

music.addEventListener('timeupdate', () => {
    const currentTime = music.currentTime;
    const activeLine = LYRICS_SYNC.slice().reverse().find(line => currentTime >= line.time);
    
    if (activeLine && activeLine.text !== lastActiveText) {
        lastActiveText = activeLine.text;
        const loveNameElem = document.getElementById('love-name');
        loveNameElem.textContent = activeLine.text;
    }

    // LLUVIA DE ESTRELLAS MODERADA EN LOS COROS PARA CELULARES
    const isFirstChorus = (currentTime >= 76.0 && currentTime <= 83.0);
    const isSecondChorus = (currentTime >= 160.0 && currentTime <= 167.0);

    if (isFirstChorus || isSecondChorus) {
        // Limitamos la creación masiva para que no cause "lag" en celulares
        if (Math.random() < 0.4) {
            createShootingStar(true);
        }
    }
});

document.getElementById('entry-button').addEventListener('click', () => {
    music.src = 'https://raw.githubusercontent.com/kevinj2628/org/0ffda8d13a1c99e6c413c12f17577a4e82882587/Pacto%20de%20Amor%20%5BDB3ZziisIqI%5D.mp3'; 
    music.load();
    music.play().catch(e => console.error('Error al reproducir música:', e));

    document.getElementById('entry-modal').style.display = 'none';
});