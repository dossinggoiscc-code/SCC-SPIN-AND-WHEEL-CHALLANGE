(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const app = $('app');
  const form = $('registerForm');
  const wheelCanvas = $('wheelCanvas');
  const ctx = wheelCanvas.getContext('2d');
  const spinButton = $('spinButton');
  const pointer = $('pointer');
  const overlay = $('winnerOverlay');
  const loading = $('loadingOverlay');
  const winnerPrize = $('winnerPrize');
  const winnerText = $('winnerText');
  const winnerMascot = $('winnerMascot');
  const awesomeButton = $('awesomeButton');
  const retryButton = $('retryButton');
  const fxCanvas = $('fxCanvas');
  const fx = fxCanvas.getContext('2d');
  const musicToggle = $('musicToggle');
  const exportCsv = $('exportCsv');
  const resetData = $('resetData');
  const STORE_KEY = 'sccSpinWinFinalV3Players';

  const prizes = [
    {name:'RM200 CASH VOUCHER', color:'#c71928'},
    {name:'BLUETOOTH SPEAKER', color:'#168332'},
    {name:'BATTERY FAN', color:'#6e35b8'},
    {name:'MYSTERY GIFT', color:'#d51f64'},
    {name:'RM50 CASH VOUCHER', color:'#d66b18'},
    {name:'PREMIUM UMBRELLA', color:'#008a84'},
    {name:'INSULATED TUMBLER', color:'#7437a8'},
    {name:'POWER BANK', color:'#0756ad'}
  ];
  const mascots = ['malio.webp','malia.png','bob.webp','ejau.webp','kladee.webp'].map(n => `assets/images/${n}`);
  const arc = Math.PI * 2 / prizes.length;
  let rotation = 0;
  let spinning = false;
  let currentPlayer = null;
  let particles = [];
  let fxRunning = false;
  let audioCtx = null;
  let musicOn = false;
  let musicTimer = null;

  function players(){ try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } }
  function savePlayers(list){ localStorage.setItem(STORE_KEY, JSON.stringify(list)); }

  function sizeFx(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    fxCanvas.width = Math.floor(innerWidth * dpr);
    fxCanvas.height = Math.floor(innerHeight * dpr);
    fxCanvas.style.width = innerWidth + 'px';
    fxCanvas.style.height = innerHeight + 'px';
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', () => { sizeFx(); drawWheel(); }, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWheel).catch(()=>{});
  sizeFx();

  function shade(hex, amt){
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function drawWheel(){
    const w = wheelCanvas.width;
    const r = w / 2;
    ctx.clearRect(0,0,w,w);

    // outer gold rim
    const rim = ctx.createRadialGradient(r*.33,r*.24,30,r,r,r*.5);
    rim.addColorStop(0,'#fff6b8');
    rim.addColorStop(.22,'#ffdc49');
    rim.addColorStop(.53,'#f3a90d');
    rim.addColorStop(.82,'#a95700');
    rim.addColorStop(1,'#6f3300');
    ctx.beginPath(); ctx.arc(r,r,r*.492,0,Math.PI*2); ctx.fillStyle = rim; ctx.fill();
    ctx.lineWidth = r*.028; ctx.strokeStyle = '#ffe98c'; ctx.stroke();
    ctx.lineWidth = r*.012; ctx.strokeStyle = '#8f4b00'; ctx.beginPath(); ctx.arc(r,r,r*.425,0,Math.PI*2); ctx.stroke();
    ctx.lineWidth = r*.008; ctx.strokeStyle = '#fff4ad'; ctx.beginPath(); ctx.arc(r,r,r*.372,0,Math.PI*2); ctx.stroke();

    // lights
    for(let i=0;i<40;i++){
      const a = i*Math.PI*2/40;
      const x = r + Math.cos(a) * r*.456;
      const y = r + Math.sin(a) * r*.456;
      ctx.save();
      ctx.beginPath(); ctx.arc(x,y,r*.018,0,Math.PI*2);
      const active = spinning && (i + Math.floor(performance.now()/90)) % 3 === 0;
      ctx.fillStyle = active ? '#ffffff' : '#ffe26b';
      ctx.shadowColor = '#fff0a0'; ctx.shadowBlur = active ? 26 : 9;
      ctx.fill(); ctx.restore();
    }

    ctx.save();
    ctx.translate(r,r); ctx.rotate(rotation); ctx.translate(-r,-r);

    const outer = r*.365;
    const inner = r*.165;
    prizes.forEach((p,i)=>{
      const start = -Math.PI/2 + i*arc;
      const end = start + arc;
      const grad = ctx.createRadialGradient(r,r,inner,r,r,outer);
      grad.addColorStop(0, shade(p.color, 62)); grad.addColorStop(.58, p.color); grad.addColorStop(1, shade(p.color, -38));
      ctx.beginPath(); ctx.moveTo(r,r); ctx.arc(r,r,outer,start,end); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.lineWidth = r*.005; ctx.strokeStyle = '#ffd95f'; ctx.stroke();

      ctx.save();
      ctx.translate(r,r); ctx.rotate(start + arc/2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = r*.008;
      ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8;
      const fontSize = Math.round(r * 0.034);
      ctx.font = `900 ${fontSize}px Fredoka, Arial, sans-serif`;
      const label = p.name.split(' ');
      let lines;
      if(label.length >= 3) lines = [label.slice(0, -1).join(' '), label.slice(-1).join('')];
      else lines = label.length === 2 ? label : [p.name];
      const tx = outer * .66;
      const lh = fontSize * 1.05;
      lines.forEach((ln,j)=>{
        const y = (j - (lines.length-1)/2) * lh;
        ctx.strokeText(ln, tx, y);
        ctx.fillText(ln, tx, y);
      });
      ctx.restore();
    });
    ctx.restore();

    // glossy cover ring
    ctx.save();
    ctx.beginPath(); ctx.arc(r,r,r*.382,Math.PI*1.1,Math.PI*1.9); ctx.strokeStyle='rgba(255,255,255,.24)'; ctx.lineWidth=r*.05; ctx.stroke();
    ctx.restore();

    // center hub
    const hub = ctx.createRadialGradient(r*.87,r*.86,10,r,r,r*.18);
    hub.addColorStop(0,'#fff8ba'); hub.addColorStop(.48,'#ffd33c'); hub.addColorStop(1,'#e59a00');
    ctx.beginPath(); ctx.arc(r,r,r*.178,0,Math.PI*2); ctx.fillStyle = hub; ctx.fill();
    ctx.lineWidth = r*.014; ctx.strokeStyle = '#fff7ae'; ctx.stroke();
    ctx.lineWidth = r*.007; ctx.strokeStyle = '#a85b00'; ctx.beginPath(); ctx.arc(r,r,r*.151,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#d68b00'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font = `900 ${Math.round(r*.075)}px Fredoka, Arial`; ctx.fillText('SCC', r, r-r*.02);
    ctx.font = `900 ${Math.round(r*.026)}px Fredoka, Arial`; ctx.fillStyle='#533100'; ctx.fillText('SABAH CREDIT', r, r+r*.06);
  }

  function winnerForRotation(){
    const pointerAngle = ((-Math.PI/2 - rotation) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
    return prizes[Math.floor(pointerAngle / arc) % prizes.length];
  }
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
  function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

  function animateSpin(from, to, duration){
    return new Promise(resolve => {
      const start = performance.now(); let lastIndex = -1;
      function frame(now){
        const t = Math.min(1, (now - start) / duration);
        rotation = from + (to - from) * easeOutCubic(t);
        const idx = Math.floor((((-Math.PI/2 - rotation) % (Math.PI*2) + Math.PI*2) % (Math.PI*2)) / arc);
        if(idx !== lastIndex && t > .04){
          pointer.classList.remove('bounce'); void pointer.offsetWidth; pointer.classList.add('bounce');
          tickSound(t); lastIndex = idx;
        }
        drawWheel();
        if(t < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  async function spin(){
    if(spinning || !currentPlayer) return;
    startAudio();
    spinning = true;
    app.classList.add('spinning');
    spinButton.classList.add('hide-text');
    spinButton.disabled = true;
    spinStartSound();
    const from = rotation;
    const spins = 6 + Math.floor(Math.random()*3);
    const to = from + Math.PI*2*spins + Math.random()*Math.PI*2;
    await wait(220);
    await animateSpin(from, to, 5600);
    rotation = to % (Math.PI*2);
    drawWheel();
    await wait(420);
    showWinner();
  }

  function showWinner(){
    const win = winnerForRotation();
    const list = players();
    if(currentPlayer){
      const idx = list.findIndex(p => p.id === currentPlayer.id);
      if(idx >= 0){
        list[idx].spinCount = (list[idx].spinCount || 0) + 1;
        list[idx].lastPrize = win.name;
        list[idx].lastSpinAt = new Date().toISOString();
        currentPlayer = list[idx];
        savePlayers(list);
      }
    }
    spinning = false;
    app.classList.remove('spinning');
    spinButton.classList.remove('hide-text');
    spinButton.disabled = false;
    winnerPrize.textContent = win.name;
    winnerText.textContent = `${currentPlayer?.name || 'Player'}, thank you for participating in the SCC SPIN & WIN CHALLENGE.`;
    winnerMascot.src = mascots[Math.floor(Math.random()*mascots.length)];
    overlay.classList.remove('hidden');
    winnerSound();
    confetti(innerWidth/2, innerHeight*.42);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('playerName').value.trim();
    const organisation = $('organisation').value.trim();
    const mobile = $('mobileNumber').value.trim();
    if(!name || !organisation || !mobile || !$('consentCheck').checked) return;
    startAudio(); clickSound();
    currentPlayer = { id: makeId(), registeredAt:new Date().toISOString(), name, organisation, mobile, consent:true, spinCount:0, lastPrize:'', lastSpinAt:'' };
    const list = players(); list.push(currentPlayer); savePlayers(list);
    loading.classList.remove('hidden');
    setTimeout(()=>{
      loading.classList.add('hidden');
      app.classList.add('registered');
      drawWheel();
    }, 750);
  });

  spinButton.addEventListener('click', spin);
  awesomeButton.addEventListener('click', ()=>{ overlay.classList.add('hidden'); clickSound(); });
  retryButton.addEventListener('click', ()=>{
    overlay.classList.add('hidden');
    app.classList.remove('registered','spinning');
    currentPlayer = null;
    form.reset();
    clickSound();
    setTimeout(()=> $('playerName').focus(), 150);
  });

  exportCsv.addEventListener('click', () => {
    const rows = players();
    if(!rows.length){ alert('No player data yet.'); return; }
    const header = ['registered_at','full_name_as_per_ic','organisation_department','mobile_number','consent','spin_count','last_prize','last_spin_at'];
    const csv = [header.join(',')].concat(rows.map(r => header.map(h => csvCell({
      registered_at:r.registeredAt, full_name_as_per_ic:r.name, organisation_department:r.organisation, mobile_number:r.mobile, consent:r.consent?'YES':'NO', spin_count:r.spinCount||0, last_prize:r.lastPrize||'', last_spin_at:r.lastSpinAt||''
    }[h])).join(','))).join('\n');
    download(`scc-spin-win-players-${new Date().toISOString().slice(0,10)}.csv`, csv);
  });
  resetData.addEventListener('click', () => { if(confirm('Reset all saved player information?')){ localStorage.removeItem(STORE_KEY); alert('Player information reset.'); }});

  function csvCell(v){ return '"' + String(v ?? '').replace(/"/g,'""') + '"'; }
  function download(filename, text){ const blob = new Blob([text], {type:'text/csv;charset=utf-8'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 800); }
  function makeId(){ return (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); }

  function confetti(x,y){
    const colors = ['#ffc928','#ff3f6e','#1aa7ff','#61dd32','#ffffff','#8f4dff'];
    for(let i=0;i<170;i++){
      const a = Math.random()*Math.PI*2, v = 2 + Math.random()*8;
      particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,life:1,s:3+Math.random()*7,c:colors[Math.floor(Math.random()*colors.length)]});
    }
    if(!fxRunning) fxLoop();
  }
  function fxLoop(){
    fxRunning = true; fx.clearRect(0,0,innerWidth,innerHeight);
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .08; p.life -= .014;
      if(p.life <= 0) return false;
      fx.save(); fx.globalAlpha = p.life; fx.fillStyle = p.c; fx.beginPath(); fx.arc(p.x,p.y,p.s,0,Math.PI*2); fx.fill(); fx.restore();
      return true;
    });
    if(particles.length) requestAnimationFrame(fxLoop); else fxRunning = false;
  }

  function startAudio(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if(!musicOn) startMusic();
  }
  function tone(freq, dur=.12, type='sine', vol=.05, delay=0){
    if(!audioCtx) return;
    const t = audioCtx.currentTime + delay;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+.02); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+dur+.03);
  }
  function clickSound(){ tone(720,.07,'triangle',.04); }
  function tickSound(t){ tone(1050 - Math.min(450,t*420), .035, 'square', .018); }
  function spinStartSound(){ tone(180,.45,'sawtooth',.035); tone(240,.55,'sawtooth',.025,.12); }
  function winnerSound(){ [523,659,784,1046,1318].forEach((n,i)=>tone(n,.23,'triangle',.06,i*.10)); }
  function startMusic(){
    musicOn = true; musicToggle.textContent = '♪'; clearInterval(musicTimer);
    const notes = [523,659,784,659,587,698,880,698,523,659,784,1046,988,784,659,587]; let i=0;
    musicTimer = setInterval(()=>{ if(!musicOn || !audioCtx) return; tone(notes[i%notes.length], .18, 'triangle', .014); if(i%4===0) tone(notes[(i+5)%notes.length]/2, .32, 'sine', .010); i++; }, 360);
  }
  function stopMusic(){ musicOn = false; musicToggle.textContent = 'off'; clearInterval(musicTimer); }
  musicToggle.addEventListener('click', ()=>{ startAudio(); musicOn ? stopMusic() : startMusic(); });

  setInterval(()=> document.body.classList.toggle('night'), 33000);
  drawWheel();
})();
