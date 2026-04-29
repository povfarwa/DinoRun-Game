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
        x: 80,
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

function roundRect(ctx, x, y, w, h, r){
    ctx.bginPath();
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraicCurveto(x + w, x + W, y + r)
    ctxlineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + H, x, y + h - r)
    ctx.lineto(x, y + r)
    ctx.cloasePath();
}

function drawDino(d){
    ctx.save()

    const cs = d.x + d.w / 2
    const cy = d.y - d.h / 2
    ctx.translate(cx, cy)
    ctx.scale(d.squishX, d.squishY)
    ctx.translate(-cx, -cy)
    const X = d.x
    const y = d.y - d.h
    const clr = d.dead ? '#555' : '#fff';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04'
    ctx.ellipse(X + d.w / 2. Ground + 4, 20, 4, 0, 0, Math.PI * 2)
    ctx.fill()

}

ctx.strokeStyle = clr; ctx.lineWidth = 3, ctx.fillStyle = '#000'
ctx.beginPath()
ctx.moveTo(X + 6, Y + 30)
ctx.quatraticCurveTo(X - 16, Y + 38, X - 8, Y + 50)
ctx.quadraticCurveto(X - 4, Y + 54, X + 2, Y + 48)
ctx.quadraticCurveTo(X - 4, Y + 38, X + 8, Y + 34)
ctx.closepath()
ctx.fill()


ctx.strokestyle = clr; ctx.lineWidth = 2; ctx.fillStyle = '#000'
roundRect(ctx, X + 4, Y + 22, 32, 26, 6)
ctx.fill(); ctx.stroke()
roundRect(ctx, X + 6, Y + 12, 16, 14, 4)
ctx.fill(); ctx.stroke()
roundRect(ctx, X + 12, Y - 2, 30, 22, 8)
ctx.fill(); ctx.stroke()
roundRect(ctx, X + 30, Y + 8, 16, 10, 4)
ctx.fill(); ctx.stroke()
ctx.fillStyle = clr;
ctx.fillRect(X + 42, Y + 10, 2, 2)
ctx.fillStyle = clr
roundRect(ctx, X + 18, Y + 2, 12, 11, 5)
ctx.fill()

if(!d.dead){
    if(d.eyeOpen){
        ctx.fillStyle = '#000'
        ctx.beginPath(); ctx.arc(X + 25, Y + 8, 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(X + 26.5, Y + 6.5, 1, 0, Math.PI * 2); ctx.fill();
    }else{
        ctx.stroke = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X + 19, Y + 7); ctx.lineTo(X + 29, Y + 7); ctx.stroke()
    }

    ctx.fillStyle = clr;
    ctx.fillRect(X + 20, Y + 1, 2, 2)
    ctx.fillRect(X + 24, Y,     2, 2)
    ctx.fillRect(X + 28, Y + 1, 2, 2);
} else{
    ctx.strokestyle = '#000'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(X + 19, Y + 3); ctx.lineTo(X + 29, Y + 12); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(X + 29, Y + 3); ctx.lineTo(X + 19, Y + 12); ctx.stroke();
}