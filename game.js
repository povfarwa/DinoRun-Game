
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W      = canvas.width;   
const H      = canvas.height;  
const GROUND = H - 55;         

const GRAVITY     = 0.72;
const JUMP_V      = -16;  
const DJUMP_V     = -13;   
const BASE_SPEED  = 5.5;   

let state      = 'idle';   
let score      = 0;
let hiScore    = 0;
let frameCount = 0;
let speedMult  = 1;        
let animId     = null;     

let dino = {};

function resetDino() {
  dino = {
    x: 90,       
    y: GROUND,   
    w: 48,       
    h: 56,       
    vy: 0,       
    jumping: false,
    jumpsLeft: 2,   
    dead: false,
    legFrame: 0,    
    blinkTimer: 0,
    eyeOpen: true,
    squishX: 1,    
    squishY: 1,     
  };
}

let obstacles    = [];   
let birds        = [];   
let nextObsDist  = 120;  
let nextBirdDist = 300;  

let particles = [];   

function spawnDust(x, y) {
  for (let i = 0; i < 3; i++) {
    particles.push({
      x, y,
      vx: -1 - Math.random() * 3,
      vy: -0.5 - Math.random() * 2,
      life: 14 + Math.random() * 8,
      maxLife: 18,
      r: 1 + Math.random() * 2
    });
  }
}

function spawnDeathParticles() {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    particles.push({
      x: dino.x + dino.w / 2,
      y: dino.y - dino.h / 2,
      vx: Math.cos(angle) * (2 + Math.random() * 4),
      vy: Math.sin(angle) * (2 + Math.random() * 4) - 3,
      life: 40,
      maxLife: 40,
      r: 2 + Math.random() * 3
    });
  }
}

const stars = Array.from({ length: 60 }, () => ({
  x: Math.random() * W,
  y: Math.random() * (GROUND - 40),
  size: Math.random() < 0.3 ? 2 : 1,
  speed: 0.2 + Math.random() * 0.4,
  twinkle: Math.random() * Math.PI * 2
}));

const pebbles = Array.from({ length: 18 }, () => ({
  x: Math.random() * W,
  w: 6 + Math.random() * 16,
}));

let popups = [];  

function spawnPopup(text, x, y) {
  popups.push({ text, x, y, life: 40, maxLife: 40 });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDino(d) {
  ctx.save();

  const cx = d.x + d.w / 2;
  const cy = d.y - d.h / 2;
  ctx.translate(cx, cy);
  ctx.scale(d.squishX, d.squishY);
  ctx.translate(-cx, -cy);

  const X   = d.x;
  const Y   = d.y - d.h;
  const clr = d.dead ? '#555' : '#fff';

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.ellipse(X + d.w / 2, GROUND + 4, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = clr; ctx.lineWidth = 3; ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(X + 6, Y + 30);
  ctx.quadraticCurveTo(X - 16, Y + 38, X - 8, Y + 50);
  ctx.quadraticCurveTo(X - 4, Y + 54, X + 2, Y + 48);
  ctx.quadraticCurveTo(X - 4, Y + 38, X + 8, Y + 34);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle = clr; ctx.lineWidth = 2; ctx.fillStyle = '#000';
  roundRect(ctx, X + 4, Y + 22, 32, 26, 6);
  ctx.fill(); ctx.stroke();

  roundRect(ctx, X + 16, Y + 12, 16, 14, 4);
  ctx.fill(); ctx.stroke();

  roundRect(ctx, X + 12, Y - 2, 30, 22, 8);
  ctx.fill(); ctx.stroke();

  roundRect(ctx, X + 30, Y + 8, 16, 10, 4);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = clr;
  ctx.fillRect(X + 42, Y + 10, 2, 2);

  ctx.fillStyle = clr;
  roundRect(ctx, X + 18, Y + 2, 12, 11, 5);
  ctx.fill();

  if (!d.dead) {
    if (d.eyeOpen) {
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(X + 25, Y + 8, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(X + 26.5, Y + 6.5, 1, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X + 19, Y + 7); ctx.lineTo(X + 29, Y + 7); ctx.stroke();
    }
    ctx.fillStyle = clr;
    ctx.fillRect(X + 20, Y + 1, 2, 2);
    ctx.fillRect(X + 24, Y,     2, 2);
    ctx.fillRect(X + 28, Y + 1, 2, 2);
  } else {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X + 19, Y + 3); ctx.lineTo(X + 29, Y + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X + 29, Y + 3); ctx.lineTo(X + 19, Y + 12); ctx.stroke();
  }

  ctx.strokeStyle = clr; ctx.lineWidth = 1.5; ctx.fillStyle = '#000';
  for (let i = 0; i < 3; i++) {
    const sx = X + 16 + i * 8;
    ctx.beginPath();
    ctx.moveTo(sx, Y - 2);
    ctx.lineTo(sx + 4, Y - 9 - i * 2);
    ctx.lineTo(sx + 8, Y - 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  ctx.strokeStyle = clr; ctx.lineWidth = 2; ctx.fillStyle = '#000';
  roundRect(ctx, X + 28, Y + 28, 10, 7, 3);
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle = clr; ctx.lineWidth = 3;
  const lf = d.legFrame;

  if (d.jumping) {
    ctx.fillStyle = '#000';
    roundRect(ctx, X + 8,  Y + 46, 11, 12, 4); ctx.fill(); ctx.stroke();
    roundRect(ctx, X + 22, Y + 46, 11, 12, 4); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2;
    roundRect(ctx, X + 4,  Y + 54, 14, 5, 2); ctx.fill(); ctx.stroke();
    roundRect(ctx, X + 20, Y + 54, 14, 5, 2); ctx.fill(); ctx.stroke();
  } else {
    const a = lf < 8;  
    ctx.fillStyle = '#000';

    if (a) {
      roundRect(ctx, X + 8, Y + 44, 11, 16, 4); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2;
      roundRect(ctx, X + 4, Y + 56, 14, 5, 2); ctx.fill(); ctx.stroke();
    } else {
      roundRect(ctx, X + 8, Y + 44, 11, 10, 4); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2;
      roundRect(ctx, X + 4, Y + 50, 18, 5, 2); ctx.fill(); ctx.stroke();
    }
    ctx.lineWidth = 3;

    if (!a) {
      roundRect(ctx, X + 22, Y + 44, 11, 16, 4); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2;
      roundRect(ctx, X + 20, Y + 56, 14, 5, 2); ctx.fill(); ctx.stroke();
    } else {
      roundRect(ctx, X + 22, Y + 44, 11, 10, 4); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2;
      roundRect(ctx, X + 20, Y + 50, 18, 5, 2); ctx.fill(); ctx.stroke();
    }
  }

  ctx.restore();
}

function drawCactus(c) {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 2;
  ctx.fillStyle   = '#000';

  const x = c.x;
  const y = GROUND;

  if (c.type === 0) {
    roundRect(ctx, x + 8, y - 54, 12, 54, 3); ctx.fill(); ctx.stroke();
    roundRect(ctx, x,     y - 40,  8,  8, 2); ctx.fill(); ctx.stroke();
    roundRect(ctx, x,     y - 48,  8, 14, 2); ctx.fill(); ctx.stroke();
    roundRect(ctx, x + 20, y - 32, 8,  8, 2); ctx.fill(); ctx.stroke();
    roundRect(ctx, x + 20, y - 40, 8, 14, 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1;
    drawSpike(x + 14, y - 55, 0);
    drawSpike(x + 0,  y - 50, -1);
    drawSpike(x + 28, y - 42,  1);
  } else if (c.type === 1) {
    for (let i = 0; i < 2; i++) {
      const ox = i * 20;
      roundRect(ctx, x + ox + 2, y - 46, 12, 46, 3); ctx.fill(); ctx.stroke();
      if (i === 0) { roundRect(ctx, x,        y - 32, 4, 8, 2); ctx.fill(); ctx.stroke(); }
      else         { roundRect(ctx, x + ox + 14, y - 26, 4, 8, 2); ctx.fill(); ctx.stroke(); }
    }
    ctx.lineWidth = 1;
    drawSpike(x + 8,  y - 47, 0);
    drawSpike(x + 28, y - 47, 0);
  } else {
    const heights = [44, 38, 50];
    const offsets = [0, 18, 36];
    for (let i = 0; i < 3; i++) {
      roundRect(ctx, x + offsets[i], y - heights[i], 12, heights[i], 3);
      ctx.fill(); ctx.stroke();
    }
    ctx.lineWidth = 1;
    heights.forEach((h, i) => drawSpike(x + offsets[i] + 6, y - h - 1, 0));
  }
}

function drawSpike(x, y, dir) {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(x + dir * 2, y);
  ctx.lineTo(x + dir * 2, y - 8);
  ctx.stroke();
}

function drawBird(b) {
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.fillStyle   = '#000';
  ctx.lineWidth   = 1.8;

  const x  = b.x;
  const y  = b.y;
  const up = b.wingFrame < 8; 

  ctx.beginPath();
  ctx.ellipse(x + 16, y + 8, 12, 6, -0.1, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  roundRect(ctx, x + 22, y + 2, 10, 10, 4);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 32, y + 4);
  ctx.lineTo(x + 48, y + 6);
  ctx.lineTo(x + 48, y + 9);
  ctx.lineTo(x + 32, y + 10);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + 28, y + 5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(x + 28, y + 5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + 29, y + 4, 0.6, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 2);
  ctx.lineTo(x + 26, y - 5);
  ctx.lineTo(x + 30, y + 2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.lineWidth = 1.8; ctx.fillStyle = '#000';
  if (up) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 5);
    ctx.quadraticCurveTo(x - 4, y - 16, x - 18, y - 12);
    ctx.quadraticCurveTo(x - 8, y - 2,  x + 4,  y + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 20, y + 4);
    ctx.quadraticCurveTo(x + 30, y - 14, x + 44, y - 10);
    ctx.quadraticCurveTo(x + 34, y,      x + 24, y + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 10);
    ctx.quadraticCurveTo(x - 6, y + 22, x - 18, y + 18);
    ctx.quadraticCurveTo(x - 8, y + 10, x + 4,  y + 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 20, y + 10);
    ctx.quadraticCurveTo(x + 32, y + 22, x + 44, y + 18);
    ctx.quadraticCurveTo(x + 34, y + 10, x + 24, y + 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x + 12, y + 14); ctx.lineTo(x + 10, y + 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 10, y + 20); ctx.lineTo(x + 7, y + 22);
                   ctx.moveTo(x + 10, y + 20); ctx.lineTo(x + 13, y + 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 20, y + 14); ctx.lineTo(x + 18, y + 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 18, y + 20); ctx.lineTo(x + 15, y + 22);
                   ctx.moveTo(x + 18, y + 20); ctx.lineTo(x + 21, y + 22); ctx.stroke();

  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const t = Date.now() / 1000;
  stars.forEach(s => {
    const brightness = 0.3 + 0.4 * Math.sin(t * 0.8 + s.twinkle);
    ctx.fillStyle = `rgba(255,255,255,${brightness})`;
    ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    s.x -= s.speed * speedMult * 0.3;
    if (s.x < 0) s.x = W;
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.fillStyle   = '#000';
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.arc(820, 40, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(828, 36, 18, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();

  const spd = BASE_SPEED * speedMult;
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
  pebbles.forEach(p => {
    p.x -= spd * 0.5;
    if (p.x + p.w < 0) p.x = W + p.w;
    ctx.beginPath(); ctx.moveTo(p.x, GROUND + 8); ctx.lineTo(p.x + p.w, GROUND + 8); ctx.stroke();
  });

  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const mx = ((i * 180 - frameCount * spd * 0.08) % (W + 200)) - 100;
    const mh = 40 + (i % 3) * 20;
    ctx.beginPath(); ctx.moveTo(mx, GROUND); ctx.lineTo(mx + 70, GROUND - mh); ctx.lineTo(mx + 140, GROUND); ctx.stroke();
  }
}

function collides(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkCollisions() {
  const pad = 8; 
  const dx = dino.x + pad,       dy = dino.y - dino.h + pad;
  const dw = dino.w - pad * 2,   dh = dino.h - pad * 2;

  for (const c of obstacles) {
    if (collides(dx, dy, dw, dh, c.x + 6, GROUND - 54, 32, 54)) return true;
  }
  for (const b of birds) {
    if (collides(dx, dy, dw, dh, b.x + 6, b.y, 38, 18)) return true;
  }
  return false;
}


function jump() {
  if (state !== 'playing') return;
  if (dino.jumpsLeft > 0) {
    dino.vy        = dino.jumpsLeft === 2 ? JUMP_V : DJUMP_V;
    dino.jumping   = true;
    dino.jumpsLeft--;
    dino.squishX   = 0.8;  
    dino.squishY   = 1.3;   
    spawnDust(dino.x + 10, GROUND);
  }
}

function update() {
  if (state !== 'playing') return;
  frameCount++;

  speedMult = 1 + score / 1200;
  const spd = BASE_SPEED * speedMult;
  document.getElementById('spdVal').textContent = speedMult.toFixed(1);

  score += 0.12 * speedMult;
  const scoreInt = Math.floor(score);
  document.getElementById('scoreEl').textContent  = fmt(scoreInt);
  if (score > hiScore) {
    hiScore = score;
    document.getElementById('hiScoreEl').textContent = fmt(Math.floor(hiScore));
  }

  if (scoreInt > 0 && scoreInt % 100 === 0 && frameCount % 2 === 0) {
    spawnPopup('×' + scoreInt / 100 + '00', W / 2, 60);
  }

  if (dino.jumping || dino.vy !== 0) {
    dino.vy += GRAVITY;
    dino.y  += dino.vy;
    if (dino.y >= GROUND) {
      dino.y       = GROUND;
      dino.jumping = false;
      dino.vy      = 0;
      dino.jumpsLeft = 2;
      dino.squishX = 1.3;
      dino.squishY = 0.75;
    }
  } else {
    dino.legFrame = (dino.legFrame + 1) % 16;
    if (frameCount % 5 === 0) spawnDust(dino.x + 10, GROUND);
  }

  dino.squishX += (1 - dino.squishX) * 0.2;
  dino.squishY += (1 - dino.squishY) * 0.2;

  dino.blinkTimer++;
  if (dino.blinkTimer > 120 + Math.random() * 80) {
    dino.eyeOpen = false;
    if (dino.blinkTimer > 128) { dino.eyeOpen = true; dino.blinkTimer = 0; }
  }

  nextObsDist -= spd;
  if (nextObsDist <= 0) {
    obstacles.push({ x: W + 30, type: Math.floor(Math.random() * 3) });
    nextObsDist = 280 + Math.random() * 350 / speedMult;
  }
  obstacles = obstacles.filter(c => { c.x -= spd; return c.x > -120; });

  if (score > 200) {
    nextBirdDist -= spd;
    if (nextBirdDist <= 0) {
      const yOpts = [GROUND - 80, GROUND - 115, GROUND - 155];
      birds.push({
        x: W + 30,
        y: yOpts[Math.floor(Math.random() * yOpts.length)],
        wingFrame: 0
      });
      nextBirdDist = 350 + Math.random() * 450 / speedMult;
    }
  }
  birds = birds.filter(b => {
    b.x -= spd * 0.88;
    b.wingFrame = (b.wingFrame + 1) % 16;
    return b.x > -100;
  });

  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--;
    return p.life > 0;
  });

  popups = popups.filter(p => { p.y -= 0.5; p.life--; return p.life > 0; });

  if (checkCollisions()) gameOver();
}

function draw() {
  drawBackground();

  particles.forEach(p => {
    const a = p.life / p.maxLife;
    ctx.fillStyle = `rgba(255,255,255,${a * 0.7})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2); ctx.fill();
  });

  obstacles.forEach(drawCactus);
  birds.forEach(drawBird);
  drawDino(dino);

  popups.forEach(p => {
    const a = p.life / p.maxLife;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
  });
  ctx.textAlign = 'left';
}

function startGame() {
  score        = 0;
  frameCount   = 0;
  speedMult    = 1;
  obstacles    = [];
  birds        = [];
  particles    = [];
  popups       = [];
  nextObsDist  = 120;
  nextBirdDist = 300;

  resetDino();
  document.getElementById('overlay').classList.add('hidden');
  state = 'playing';
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(gameLoop);
}

function gameOver() {
  state      = 'dead';
  dino.dead  = true;
  spawnDeathParticles();
  cancelAnimationFrame(animId);
  draw();  

  setTimeout(() => {
    const ov = document.getElementById('overlay');
    ov.innerHTML = `
      <div class="overlay-title">GAME OVER</div>
      <div class="overlay-score">SCORE: ${fmt(Math.floor(score))}</div>
      <div class="overlay-hiscore">BEST: ${fmt(Math.floor(hiScore))}</div>
      <button class="btn" onclick="startGame()">[ RETRY ]</button>
    `;
    ov.classList.remove('hidden');
  }, 600);
}

function gameLoop() {
  update();
  draw();
  animId = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); jump(); }
});
document.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
document.getElementById('mainBtn').addEventListener('click', startGame);

function fmt(n) {
  return String(n).padStart(5, '0');
}

resetDino();
(function idleLoop() {
  if (state !== 'idle') return;
  drawBackground();
  dino.legFrame = (dino.legFrame + 1) % 16;
  dino.blinkTimer++;
  if (dino.blinkTimer > 100) {
    dino.eyeOpen = false;
    if (dino.blinkTimer > 108) { dino.eyeOpen = true; dino.blinkTimer = 0; }
  }
  drawDino(dino);
  requestAnimationFrame(idleLoop);
})();

let prevHipY     = null;
let hipHistory   = [];    
let jumpCooldown = 0;

const JUMP_THRESHOLD = 0.028; 
const CAM_STATUS     = document.getElementById('camStatus');

async function initCamera() {
  try {
    const video  = document.getElementById('camFeed');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } });
    video.srcObject    = stream;
    video.style.display = 'block';
    CAM_STATUS.textContent = 'CAM: LOADING...';
    CAM_STATUS.style.color = '#666';

    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
    setupPose(video);
  } catch (err) {
    CAM_STATUS.textContent = 'CAM: ' + (err.name === 'NotAllowedError' ? 'DENIED' : 'ERROR');
    const msg = document.getElementById('camMsg');
    if (msg) msg.textContent = '⟶ use SPACE to jump instead';
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s    = document.createElement('script');
    s.src      = src;
    s.onload   = resolve;
    s.onerror  = reject;
    document.head.appendChild(s);
  });
}

function setupPose(video) {
  if (typeof Pose === 'undefined') {
    CAM_STATUS.textContent = 'CAM: POSE ERR';
    return;
  }

  const pose = new Pose({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
  });

  pose.setOptions({
    modelComplexity:        0,     
    smoothLandmarks:        false, 
    enableSegmentation:     false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence:  0.4
  });

  pose.onResults(results => {
    if (!results.poseLandmarks) return;

    const lh       = results.poseLandmarks[23]; 
    const rh       = results.poseLandmarks[24]; 
    const avgHipY  = (lh.y + rh.y) / 2;

    
    hipHistory.push(avgHipY);
    if (hipHistory.length > 3) hipHistory.shift();
    const smoothHip = hipHistory.reduce((a, b) => a + b, 0) / hipHistory.length;

    if (prevHipY !== null) {
      const delta = prevHipY - smoothHip;  

      if (jumpCooldown === 0 && delta > JUMP_THRESHOLD) {
        jump();
        jumpCooldown = 12;   // ~0.2s cooldown at 60fps
        CAM_STATUS.textContent = 'CAM: JUMP!';
        CAM_STATUS.style.color = '#fff';
        setTimeout(() => {
          CAM_STATUS.textContent = 'CAM: TRACKING';
          CAM_STATUS.style.color = '#4f4';
        }, 200);
      }
    }

    if (jumpCooldown > 0) jumpCooldown--;
    prevHipY = smoothHip;
  });

  if (typeof Camera !== 'undefined') {
    const cam = new Camera(video, {
      onFrame: async () => pose.send({ image: video }),
      width: 160, height: 120
    });
    cam.start();
  } else {
    const poseLoop = async () => {
      if (video.readyState >= 2) await pose.send({ image: video });
      requestAnimationFrame(poseLoop);
    };
    poseLoop();
  }

  CAM_STATUS.textContent = 'CAM: TRACKING';
  CAM_STATUS.style.color = '#4f4';
}

initCamera();