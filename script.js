(() => {
  const $ = (s) => document.querySelector(s);
  const app = $('#app');
  const form = $('#registerForm');
  const registerScreen = $('#registerScreen');
  const gameScreen = $('#gameScreen');
  const wheelStage = $('#wheelStage');
  const wheelWrap = $('#wheelWrap');
  const pointer = $('#pointer');
  const canvas = $('#wheelCanvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = $('#spinBtn');
  const winnerOverlay = $('#winnerOverlay');
  const winnerPrize = $('#winnerPrize');
  const winnerMascot = $('#winnerMascot');
  const awesomeBtn = $('#awesomeBtn');
  const retryBtn = $('#retryBtn');
  const exportBtn = $('#exportBtn');
  const resetDataBtn = $('#resetDataBtn');
  const musicBtn = $('#musicBtn');
  const confettiCanvas = $('#confettiCanvas');
  const cfx = confettiCanvas.getContext('2d');

  const prizes = [
    { name: 'YONO COASTER', color: '#0057b7' },
    { name: 'HAND FAN', color: '#f47a00' },
    { name: 'BATTERY FAN', color: '#c90024' },
    { name: 'BAG PACK', color: '#078225' },
    { name: 'MYSTERY', color: '#c60062' }
  ];

  // 30 equal slices based on requested quantity:
  // YONO Coaster 15, Hand Fan 7, Battery Fan 5, Bag Pack 2, Mystery 1.
  const pattern = [
    'YONO COASTER','HAND FAN','YONO COASTER','BATTERY FAN','YONO COASTER',
    'HAND FAN','YONO COASTER','BAG PACK','YONO COASTER','BATTERY FAN',
    'YONO COASTER','HAND FAN','YONO COASTER','BATTERY FAN','MYSTERY',
    'YONO COASTER','HAND FAN','YONO COASTER','BAG PACK','YONO COASTER',
    'BATTERY FAN','HAND FAN','YONO COASTER','HAND FAN','YONO COASTER',
    'BATTERY FAN','YONO COASTER','HAND FAN','YONO COASTER','YONO COASTER'
  ];
  const wheelSegments = pattern.map(name => prizes.find(p => p.name === name));
  const segCount = wheelSegments.length;
  const arc = Math.PI * 2 / segCount;
  let rotation = 0;
  let spinning = false;
  let currentPlayer = null;
  let lastTick = -1;
  const mascotList = ['assets/images/malia.png','assets/images/malio.webp','assets/images/bob.webp','assets/images/ejau.webp','assets/images/kladee.webp'];

  function resizeFX(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
  addEventListener('resize', resizeFX); resizeFX();

  function drawWheel(){
    const w = canvas.width, h = canvas.height, r = w/2, outer = r*0.91;
    ctx.clearRect(0,0,w,h);
    ctx.save();
    ctx.translate(r,r);

    // outer gold plate
    const plate = ctx.createRadialGradient(0,0,outer*.45,0,0,outer*1.03);
    plate.addColorStop(0,'#fff6b5');
    plate.addColorStop(.35,'#ffd84f');
    plate.addColorStop(.72,'#c87300');
    plate.addColorStop(1,'#6e3a00');
    ctx.beginPath(); ctx.arc(0,0,outer*1.035,0,Math.PI*2); ctx.fillStyle=plate; ctx.fill();

    for(let i=0;i<segCount;i++){
      const a0 = -Math.PI/2 + i*arc;
      const a1 = a0 + arc;
      const p = wheelSegments[i];
      const grad = ctx.createRadialGradient(0,0,outer*.12,0,0,outer*.96);
      grad.addColorStop(0, '#fff6b0');
      grad.addColorStop(.20, p.color);
      grad.addColorStop(1, shade(p.color,-34));
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,outer*.93,a0,a1);
      ctx.closePath();
      ctx.fillStyle=grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,236,122,.94)';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.save();
      ctx.rotate(a0+arc/2);
      ctx.textAlign='right';
      ctx.textBaseline='middle';
      ctx.fillStyle='#fff';
      ctx.strokeStyle='rgba(0,35,80,.75)';
      ctx.lineWidth=8;
      ctx.shadowColor='rgba(0,0,0,.5)';
      ctx.shadowBlur=8;
      const label = p.name === 'MYSTERY' ? 'MYSTERY' : p.name;
      const fontSize = label.length > 11 ? 34 : 40;
      ctx.font = `900 ${fontSize}px Fredoka, Arial`;
      ctx.strokeText(label, outer*.80, 0);
      ctx.fillText(label, outer*.80, 0);
      ctx.restore();
    }

    // LED bulbs on outer ring
    for(let i=0;i<60;i++){
      const a = i * Math.PI*2/60;
      const x = Math.cos(a)*outer*.99, y = Math.sin(a)*outer*.99;
      ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2);
      ctx.fillStyle = i%2 ? '#fff8bc' : '#ffbf25';
      ctx.shadowColor='#fff199'; ctx.shadowBlur=12; ctx.fill(); ctx.shadowBlur=0;
    }

    const hub = ctx.createRadialGradient(-45,-55,10,0,0,outer*.26);
    hub.addColorStop(0,'#fff7b7'); hub.addColorStop(.55,'#ffcd2c'); hub.addColorStop(1,'#a45a00');
    ctx.beginPath(); ctx.arc(0,0,outer*.24,0,Math.PI*2); ctx.fillStyle=hub; ctx.fill();
    ctx.lineWidth=10; ctx.strokeStyle='#fff2a2'; ctx.stroke();
    ctx.restore();
  }
  function shade(hex, pct){
    let n=parseInt(hex.slice(1),16), a=Math.round(2.55*pct);
    let r=(n>>16)+a,g=(n>>8&255)+a,b=(n&255)+a;
    return '#'+(0x1000000+(r<255?r<0?0:r:255)*0x10000+(g<255?g<0?0:g:255)*0x100+(b<255?b<0?0:b:255)).toString(16).slice(1);
  }
  drawWheel();

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    currentPlayer = {
      name: $('#playerName').value.trim(),
      organisation: $('#department').value.trim(),
      phone: $('#phone').value.trim(),
      consent: $('#consent').checked,
      registeredAt: new Date().toISOString()
    };
    if(!currentPlayer.name || !currentPlayer.organisation || !currentPlayer.phone || !currentPlayer.consent) return;
    registerScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    playClick(); startMusic();
    setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),50);
  });

  spinBtn.addEventListener('click', spin);
  function spin(){
    if(spinning) return;
    spinning = true; lastTick = -1;
    wheelWrap.classList.add('spinning');
    wheelStage.classList.add('zoom');
    playSpinTone();
    const targetIndex = Math.floor(Math.random()*segCount);
    const sliceDeg = 360 / segCount;
    const current = ((rotation % 360) + 360) % 360;
    const desired = (360 - ((targetIndex + 0.5) * sliceDeg)) % 360;
    const extra = 360 * (7 + Math.floor(Math.random()*3));
    let delta = desired - current;
    if(delta < 0) delta += 360;
    rotation += extra + delta;
    canvas.style.transform = `rotate(${rotation}deg)`;
    const timer = setInterval(()=>{
      const matrix = getComputedStyle(canvas).transform;
      tickPointer();
    }, 120);
    setTimeout(()=>{
      clearInterval(timer);
      const winner = calculateWinner();
      finishSpin(winner);
    }, 6200);
  }
  function tickPointer(){ pointer.classList.remove('tick'); void pointer.offsetWidth; pointer.classList.add('tick'); playTickTone(); }
  function calculateWinner(){
    const deg = ((rotation % 360)+360)%360;
    const pointerDeg = (360 - deg) % 360;
    const idx = Math.floor(pointerDeg / (360/segCount)) % segCount;
    return wheelSegments[idx];
  }
  function finishSpin(winner){
    wheelWrap.classList.remove('spinning');
    wheelStage.classList.remove('zoom');
    setTimeout(()=>{
      spinning = false;
      showWinner(winner);
    }, 800);
  }
  function showWinner(winner){
    winnerPrize.textContent = winner.name;
    winnerMascot.src = mascotList[Math.floor(Math.random()*mascotList.length)];
    saveRecord(winner.name);
    winnerOverlay.classList.remove('hidden');
    confetti(); playWinTone();
  }
  awesomeBtn.addEventListener('click',()=>{ winnerOverlay.classList.add('hidden'); playClick(); });
  retryBtn.addEventListener('click',()=>{
    winnerOverlay.classList.add('hidden');
    gameScreen.classList.add('hidden'); registerScreen.classList.remove('hidden');
    form.reset(); currentPlayer = null; playClick();
    setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),50);
  });

  function saveRecord(prize){
    if(!currentPlayer) return;
    const rows = JSON.parse(localStorage.getItem('sccSpinWinPlayers') || '[]');
    rows.push({...currentPlayer, prize, playedAt:new Date().toISOString()});
    localStorage.setItem('sccSpinWinPlayers', JSON.stringify(rows));
  }
  exportBtn.addEventListener('click',()=>{
    const rows = JSON.parse(localStorage.getItem('sccSpinWinPlayers') || '[]');
    const header = ['Name','Organisation / Department','Mobile Number','Prize','Registered At','Played At'];
    const csv = [header, ...rows.map(r=>[r.name,r.organisation,r.phone,r.prize,r.registeredAt,r.playedAt])]
      .map(row=>row.map(v=>'"'+String(v||'').replaceAll('"','""')+'"').join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='scc-spin-win-players.csv'; a.click(); URL.revokeObjectURL(url);
  });
  resetDataBtn.addEventListener('click',()=>{ if(confirm('Reset all saved player records?')) localStorage.removeItem('sccSpinWinPlayers'); });

  const AudioCtx = window.AudioContext || window.webkitAudioContext; let audioCtx, musicOn=false, musicTimer;
  function ac(){ if(!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }
  function tone(freq=440,dur=.1,type='sine',gain=.04){
    try{ const c=ac(), o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur); o.stop(c.currentTime+dur); }catch(e){}
  }
  function playClick(){ tone(680,.07,'triangle',.035); }
  function playTickTone(){ tone(980,.035,'square',.018); }
  function playSpinTone(){ tone(180,.35,'sawtooth',.035); setTimeout(()=>tone(240,.25,'sawtooth',.025),250); }
  function playWinTone(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.18,'triangle',.055),i*130)); }
  function startMusic(){ if(musicOn) return; musicOn=true; cuteLoop(); musicTimer=setInterval(cuteLoop,8000); }
  musicBtn.addEventListener('click',()=>{ if(musicOn){clearInterval(musicTimer);musicOn=false}else startMusic(); });
  function cuteLoop(){ const notes=[392,523,659,523,440,587,740,587]; notes.forEach((n,i)=>setTimeout(()=>tone(n,.16,'sine',.018),i*260)); }

  function confetti(){
    const parts = Array.from({length:120},()=>({x:innerWidth/2,y:innerHeight*.45,vx:(Math.random()-.5)*11,vy:Math.random()*-8-3,rot:Math.random()*6,s:Math.random()*8+4,c:['#ff2b69','#ffd22e','#00b7ff','#26d74b','#ffffff'][Math.floor(Math.random()*5)],life:90}));
    function frame(){ cfx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.22;p.rot+=.12;p.life--;cfx.save();cfx.translate(p.x,p.y);cfx.rotate(p.rot);cfx.fillStyle=p.c;cfx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);cfx.restore();} if(parts.some(p=>p.life>0)) requestAnimationFrame(frame); else cfx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); }
    frame();
  }

  setInterval(()=>app.classList.toggle('night'),17000);
})();
