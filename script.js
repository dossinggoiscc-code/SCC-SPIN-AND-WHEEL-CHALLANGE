(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const registerForm = $('registerForm');
  const registrationScreen = $('registrationScreen');
  const gameScreen = $('gameScreen');
  const successToast = $('successToast');
  const playerPill = $('playerPill');
  const wheelCanvas = $('wheelCanvas');
  const ctx = wheelCanvas.getContext('2d');
  const spinButton = $('spinButton');
  const gameCamera = $('gameCamera');
  const pointer = $('pointer');
  const winnerOverlay = $('winnerOverlay');
  const winnerPrize = $('winnerPrize');
  const winnerName = $('winnerName');
  const winnerMascot = $('winnerMascot');
  const awesomeButton = $('awesomeButton');
  const retryButton = $('retryButton');
  const fxCanvas = $('fxCanvas');
  const fx = fxCanvas.getContext('2d');

  const mascots = [
    'assets/images/malio.webp',
    'assets/images/malia.png',
    'assets/images/bob.webp',
    'assets/images/ejau.webp',
    'assets/images/kladee.webp'
  ];

  const prizePattern = [
    { name: 'YONO', color: '#0057b8' },
    { name: 'HAND FAN', color: '#f57400' },
    { name: 'BATTERY FAN', color: '#b00018' },
    { name: 'YONO', color: '#0472d6' },
    { name: 'HAND FAN', color: '#ca5c00' },
    { name: 'BACK PACK', color: '#087a22' },
    { name: 'YONO', color: '#0a4da3' },
    { name: 'HAND FAN', color: '#f47d00' },
    { name: 'BATTERY FAN', color: '#c3002f' },
    { name: 'YONO', color: '#0050a4' },
    { name: 'HAND FAN', color: '#d96600' },
    { name: 'BACK PACK', color: '#046d1b' },
    { name: 'GIFT', color: '#cc006b', icon: '🎁' },
    { name: 'YONO', color: '#0079c8' },
    { name: 'HAND FAN', color: '#f28300' },
    { name: 'BATTERY FAN', color: '#980018' }
  ];
  const sections = Array.from({ length: 48 }, (_, i) => prizePattern[i % prizePattern.length]);
  const arc = (Math.PI * 2) / sections.length;
  let currentRotation = 0;
  let isSpinning = false;
  let currentPlayer = { name: '', org: '', phone: '' };
  let particles = [];

  function resizeFx() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    fxCanvas.width = Math.floor(innerWidth * dpr);
    fxCanvas.height = Math.floor(innerHeight * dpr);
    fxCanvas.style.width = innerWidth + 'px';
    fxCanvas.style.height = innerHeight + 'px';
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', () => { resizeFx(); drawWheel(); });
  resizeFx();

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function drawWheel() {
    const w = wheelCanvas.width, h = wheelCanvas.height;
    const r = w / 2;
    ctx.clearRect(0, 0, w, h);

    // Outer gold body - static, no rotation illusion before spin.
    let gold = ctx.createRadialGradient(r * .38, r * .28, r * .06, r, r, r);
    gold.addColorStop(0, '#fff7b8'); gold.addColorStop(.28, '#ffd84a'); gold.addColorStop(.72, '#e59c00'); gold.addColorStop(1, '#b76500');
    ctx.beginPath(); ctx.arc(r, r, r * .485, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill();
    ctx.lineWidth = r * .035; ctx.strokeStyle = '#ffe368'; ctx.stroke();
    ctx.lineWidth = r * .016; ctx.strokeStyle = '#b76500'; ctx.beginPath(); ctx.arc(r, r, r * .43, 0, Math.PI * 2); ctx.stroke();

    // LED bulbs.
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI * 2 / 24;
      const x = r + Math.cos(a) * r * .445;
      const y = r + Math.sin(a) * r * .445;
      ctx.beginPath(); ctx.arc(x, y, r * .022, 0, Math.PI * 2);
      ctx.fillStyle = isSpinning && i % 2 ? '#fff' : '#ffe46a';
      ctx.shadowColor = '#fff29a'; ctx.shadowBlur = isSpinning ? 25 : 10; ctx.fill(); ctx.shadowBlur = 0;
    }

    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(currentRotation);
    ctx.translate(-r, -r);

    const innerR = r * .365;
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const start = -Math.PI / 2 + i * arc;
      const end = start + arc;
      const grad = ctx.createRadialGradient(r, r, r * .06, r, r, innerR);
      grad.addColorStop(0, shade(s.color, 50));
      grad.addColorStop(.75, s.color);
      grad.addColorStop(1, shade(s.color, -45));
      ctx.beginPath(); ctx.moveTo(r, r); ctx.arc(r, r, innerR, start, end); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#fff9'; ctx.stroke();

      ctx.save();
      ctx.translate(r, r);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#0008'; ctx.shadowBlur = 5;
      ctx.font = `800 ${Math.max(21, r * .036)}px Fredoka, Arial`;
      if (s.icon) ctx.fillText(s.icon, innerR - r * .055, 0);
      else ctx.fillText(s.name, innerR - r * .055, 0);
      ctx.restore();
    }
    ctx.restore();

    // Inner hub.
    ctx.beginPath(); ctx.arc(r, r, r * .14, 0, Math.PI * 2);
    const hub = ctx.createRadialGradient(r * .93, r * .88, 5, r, r, r * .16);
    hub.addColorStop(0, '#fff7b5'); hub.addColorStop(.55, '#ffc928'); hub.addColorStop(1, '#e79a00');
    ctx.fillStyle = hub; ctx.fill();
    ctx.lineWidth = r * .015; ctx.strokeStyle = '#fff9'; ctx.stroke();
  }

  function animateRotation(from, to, duration, onDone) {
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 4.2);
    let lastIndex = -1;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      currentRotation = from + (to - from) * ease(t);
      const idx = Math.floor((((Math.PI * 1.5 - currentRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / arc);
      if (idx !== lastIndex && t > .05) {
        pointer.classList.remove('bounce');
        void pointer.offsetWidth;
        pointer.classList.add('bounce');
        lastIndex = idx;
      }
      drawWheel();
      if (t < 1) requestAnimationFrame(frame); else onDone && onDone();
    }
    requestAnimationFrame(frame);
  }

  function winningSection() {
    const pointerAngle = ((-Math.PI / 2 - currentRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    return sections[Math.floor(pointerAngle / arc) % sections.length];
  }

  function spin() {
    if (isSpinning) return;
    isSpinning = true;
    body.classList.add('spinning');
    spinButton.disabled = true;
    spinButton.classList.add('hide-text');
    gameCamera.classList.add('zooming');

    const from = currentRotation;
    const target = from + Math.PI * 2 * (7 + Math.floor(Math.random() * 3)) + Math.random() * Math.PI * 2;
    setTimeout(() => {
      animateRotation(from, target, 6400, () => {
        currentRotation = target % (Math.PI * 2);
        drawWheel();
        setTimeout(showWinner, 500);
      });
    }, 360);
  }

  function showWinner() {
    const winner = winningSection();
    gameCamera.classList.remove('zooming');
    spinButton.classList.remove('hide-text');
    spinButton.disabled = false;
    isSpinning = false;
    body.classList.remove('spinning');
    body.classList.add('celebrate');
    setTimeout(() => body.classList.remove('celebrate'), 1800);
    winnerPrize.textContent = winner.name === 'GIFT' ? 'MYSTERY GIFT' : winner.name;
    winnerName.textContent = currentPlayer.name ? `${currentPlayer.name}, thank you for participating!` : 'Thank you for participating!';
    winnerMascot.src = mascots[Math.floor(Math.random() * mascots.length)];
    winnerOverlay.classList.remove('is-hidden');
    burst(innerWidth / 2, innerHeight * .45);
  }

  function burst(x, y) {
    const colors = ['#ffc928', '#ff3d67', '#0aa7ff', '#4ee03e', '#ffffff'];
    for (let i = 0; i < 120; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 8;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c: colors[Math.floor(Math.random() * colors.length)], s: 3 + Math.random() * 6 });
    }
    if (!fxLoopActive) { fxLoopActive = true; requestAnimationFrame(fxLoop); }
  }
  let fxLoopActive = false;
  function fxLoop() {
    fx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .13; p.life -= .014;
      fx.globalAlpha = Math.max(0, p.life);
      fx.fillStyle = p.c;
      fx.fillRect(p.x, p.y, p.s, p.s * .55);
    });
    fx.globalAlpha = 1;
    if (particles.length) requestAnimationFrame(fxLoop); else fxLoopActive = false;
  }

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentPlayer = {
      name: $('playerName').value.trim(),
      org: $('department').value.trim(),
      phone: $('phoneNumber').value.trim()
    };
    playerPill.textContent = currentPlayer.name || 'Player';
    successToast.classList.remove('is-hidden');
    setTimeout(() => {
      successToast.classList.add('is-hidden');
      registrationScreen.classList.add('is-hidden');
      gameScreen.classList.remove('is-hidden');
      drawWheel();
    }, 950);
  });

  spinButton.addEventListener('click', spin);
  awesomeButton.addEventListener('click', () => winnerOverlay.classList.add('is-hidden'));
  retryButton.addEventListener('click', () => {
    winnerOverlay.classList.add('is-hidden');
    gameScreen.classList.add('is-hidden');
    registrationScreen.classList.remove('is-hidden');
    registerForm.reset();
    currentPlayer = { name: '', org: '', phone: '' };
    playerPill.textContent = 'Player';
  });

  // Smooth day/night loop.
  setInterval(() => body.classList.toggle('night'), 24000);
  body.classList.add('night');
  drawWheel();
})();
