const canvas = document.getElementById('gamecanvas')
const ctx = canvas.getContext('2d')
    const W = conwas.width
    const H = canvas.height
    const GROUND = H - 55

    const GRAVITY = 0.72
    const JUMP_V = -16
    const DJUMP_V = -13
    const BASE_SPEED = 5.5

    let state = 'idle'
    let score = 0
    let hiScore = 0
    let frameCount = 0
    let speedMult = 1
    let AnimId = null

let dino = {}

function resetDino(){
    dino = {
        x: 80;
        y: GROUND,
        w: 48,
        h: 46,
        vy: 0,
        jumping: false,
        dead: false,
        legFrame: 0,
        blinkTimer: 0,
        eyeOpen: true,
        squishX: 1,
        squishY: 1,
    };
}

let obstcles = []
let birds = []
let nextObsDist = 122
let nextBirdDist = 300

let parcticles = []

function spawnDust(x, y){
    for(let i = 0; i< 3; i++){
        parcticles.push({
            x, y,
            vx: -1 -Math.random() * 3,
            vy: -0.5 -Math.random() * 2,
            life: 14 + Math.random() * 8,
            maxLife: 18,
            r: 1+ Math.random() * 2
        });
    }
}

function spawnDeathParticles(){
    for(let i = 0; i < 20; i++){
        const angle = Math.PI * 2 * i / 20
        parcticles.push({
            x: dino.x + dino.w / 2,
            y: dino.y - dino.h / 2,
            vx: Math.cos(angle) * (2 + Math.random() * 4),
            vy: Math.sin(angle)  * (2+ Math.random() * 4) - 3,
            life: 40,
            mazLife: 40,
            r: 2+ Math.random() * 3
        });
    }
}

const stars = Array.from({ length: 60 } , () =>({
    x: Math.random() * W,
    y: Math.random() * (GROUND - 40)
    size: Math.random() < 0.4 ? 1: 1,
    speed: 0.2 + Math.random() 8 0.5,
    twinkle: Math.random() * Math.PI * 2
}))

const pebbles = Arrays.from({ length: 18 }, () => ({
    x: Math.random() * W,
    w: 6 + Math.random() * 16,
}));

let popups = [];

function spawnPopup(text, x, y){
    popups.push({ text, x, y, life: 40, maxLife: 40 })
}