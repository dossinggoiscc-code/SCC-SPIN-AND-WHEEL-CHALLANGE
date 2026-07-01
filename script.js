(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const body = document.body;
  const form = $('registerForm'), registrationScreen = $('registrationScreen'), gameScreen = $('gameScreen');
  const loadingOverlay = $('loadingOverlay'), wheelCanvas = $('wheelCanvas'), ctx = wheelCanvas.getContext('2d');
  const spinButton = $('spinButton'), gameCamera = $('gameCamera'), pointer = $('pointer');
  const overlay = $('winnerOverlay'), winnerPrize = $('winnerPrize'), winnerMessage = $('winnerMessage'), winnerMascot = $('winnerMascot');
  const awesomeButton = $('awesomeButton'), retryButton = $('retryButton');
  const fxCanvas = $('fxCanvas'), fx = fxCanvas.getContext('2d');
  const exportCsv = $('exportCsv'), resetData = $('resetData'), musicToggle = $('musicToggle');
  const STORE_KEY = 'sccSpinWinPlayersV2';

  const mascotSrc = ['assets/images/malio.webp','assets/images/malia.png','assets/images/bob.webp','assets/images/ejau.webp','assets/images/kladee.webp'];
  const prizePattern = [
    ['YONO','#0057b8'],['HAND FAN','#f57400'],['BATTERY FAN','#b00018'],['YONO','#0472d6'],
    ['HAND FAN','#ca5c00'],['BACK PACK','#087a22'],['YONO','#0a4da3'],['HAND FAN','#f47d00'],
    ['BATTERY FAN','#c3002f'],['YONO','#0050a4'],['HAND FAN','#d96600'],['BACK PACK','#046d1b'],
    ['MYSTERY GIFT','#cc006b','🎁'],['YONO','#0079c8'],['HAND FAN','#f28300'],['BATTERY FAN','#980018']
  ].map(([name,color,icon]) => ({name,color,icon}));
  const sections = Array.from({length:48}, (_,i)=>prizePattern[i % prizePattern.length]);
  const arc = Math.PI * 2 / sections.length;
  let rotation = 0, isSpinning = false, particles = [], currentPlayer = null, audioCtx = null, musicTimer = null, musicOn = false;

  function loadPlayers(){ try{return JSON.parse(localStorage.getItem(STORE_KEY)||'[]')}catch{return[]} }
  function savePlayers(players){ localStorage.setItem(STORE_KEY, JSON.stringify(players)); }
  function updateCurrentPlayer(patch){
    if(!currentPlayer) return;
    const players = loadPlayers();
    const idx = players.findIndex(p=>p.id===currentPlayer.id);
    if(idx >= 0){ players[idx] = {...players[idx], ...patch}; currentPlayer = players[idx]; savePlayers(players); }
  }

  function resizeFx(){
    const dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
    fxCanvas.width = Math.floor(innerWidth*dpr); fxCanvas.height = Math.floor(innerHeight*dpr);
    fxCanvas.style.width = innerWidth+'px'; fxCanvas.style.height = innerHeight+'px'; fx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize',()=>{resizeFx(); drawWheel();}); resizeFx();

  function shade(hex, amt){
    const n=parseInt(hex.slice(1),16); let r=(n>>16)+amt,g=((n>>8)&255)+amt,b=(n&255)+amt;
    return `rgb(${Math.max(0,Math.min(255,r))},${Math.max(0,Math.min(255,g))},${Math.max(0,Math.min(255,b))})`;
  }
  function drawWheel(){
    const w=wheelCanvas.width, r=w/2; ctx.clearRect(0,0,w,w);
    const gold=ctx.createRadialGradient(r*.35,r*.28,8,r,r,r*.49); gold.addColorStop(0,'#fff8bd'); gold.addColorStop(.32,'#ffd84a'); gold.addColorStop(.75,'#df9200'); gold.addColorStop(1,'#8c4200');
    ctx.beginPath(); ctx.arc(r,r,r*.49,0,Math.PI*2); ctx.fillStyle=gold; ctx.fill();
    ctx.lineWidth=r*.034; ctx.strokeStyle='#fff0a3'; ctx.stroke(); ctx.lineWidth=r*.014; ctx.strokeStyle='#9a4b00'; ctx.beginPath(); ctx.arc(r,r,r*.425,0,Math.PI*2); ctx.stroke();
    for(let i=0;i<36;i++){const a=i*Math.PI*2/36,x=r+Math.cos(a)*r*.454,y=r+Math.sin(a)*r*.454; ctx.beginPath(); ctx.arc(x,y,r*.017,0,Math.PI*2); ctx.fillStyle=(isSpinning&&i%2)?'#fff':'#ffdf60'; ctx.shadowColor='#fff1a0'; ctx.shadowBlur=isSpinning?23:8; ctx.fill(); ctx.shadowBlur=0;}
    ctx.save(); ctx.translate(r,r); ctx.rotate(rotation); ctx.translate(-r,-r);
    const innerR=r*.368;
    sections.forEach((s,i)=>{ const start=-Math.PI/2+i*arc,end=start+arc; const grad=ctx.createRadialGradient(r,r,r*.05,r,r,innerR); grad.addColorStop(0,shade(s.color,60)); grad.addColorStop(.72,s.color); grad.addColorStop(1,shade(s.color,-45)); ctx.beginPath(); ctx.moveTo(r,r); ctx.arc(r,r,innerR,start,end); ctx.closePath(); ctx.fillStyle=grad; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#ffffffb8'; ctx.stroke(); ctx.save(); ctx.translate(r,r); ctx.rotate(start+arc/2); ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.shadowColor='#0009'; ctx.shadowBlur=5; ctx.font=`900 ${Math.max(23,r*.037)}px Fredoka, Arial`; ctx.fillText(s.icon||s.name, innerR-r*.05, 0); ctx.restore(); });
    ctx.restore();
    const hub=ctx.createRadialGradient(r*.92,r*.88,5,r,r,r*.16); hub.addColorStop(0,'#fff8bb'); hub.addColorStop(.55,'#ffc928'); hub.addColorStop(1,'#e29400'); ctx.beginPath(); ctx.arc(r,r,r*.14,0,Math.PI*2); ctx.fillStyle=hub; ctx.fill(); ctx.lineWidth=r*.014; ctx.strokeStyle='#fff9'; ctx.stroke();
  }

  function easeOutQuart(t){return 1-Math.pow(1-t,4);}  
  function animateSpin(from,to,duration,done){
    const start=performance.now(); let last=-1;
    function frame(now){ const t=Math.min(1,(now-start)/duration); rotation=from+(to-from)*easeOutQuart(t); const idx=Math.floor((((Math.PI*1.5-rotation)%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/arc); if(idx!==last&&t>.04){ pointer.classList.remove('bounce'); void pointer.offsetWidth; pointer.classList.add('bounce'); tickSound(t); last=idx;} drawWheel(); if(t<1) requestAnimationFrame(frame); else done(); }
    requestAnimationFrame(frame);
  }
  function getWinner(){ const pointerAngle=((-Math.PI/2-rotation)%(Math.PI*2)+Math.PI*2)%(Math.PI*2); return sections[Math.floor(pointerAngle/arc)%sections.length]; }

  function spin(){
    if(isSpinning || !currentPlayer) return; startAudio(); isSpinning=true; body.classList.add('spinning'); spinButton.disabled=true; spinButton.classList.add('hide-text'); gameCamera.classList.add('zooming'); spinSound();
    const from=rotation, to=from + Math.PI*2*(7+Math.floor(Math.random()*3)) + Math.random()*Math.PI*2;
    setTimeout(()=>animateSpin(from,to,6400,()=>{ rotation=to%(Math.PI*2); drawWheel(); setTimeout(showWinner,450); }),330);
  }
  function showWinner(){
    const win=getWinner(); const now=new Date().toISOString();
    updateCurrentPlayer({lastPrize:win.name, lastSpinAt:now, spinCount:(currentPlayer.spinCount||0)+1});
    isSpinning=false; body.classList.remove('spinning'); body.classList.add('celebrate'); gameCamera.classList.remove('zooming'); spinButton.classList.remove('hide-text'); spinButton.disabled=false;
    winnerPrize.textContent=win.name; winnerMessage.textContent=`${currentPlayer.name}, thank you for participating!`; winnerMascot.src=mascotSrc[Math.floor(Math.random()*mascotSrc.length)]; overlay.classList.remove('hidden'); winnerSound(); burst(innerWidth/2,innerHeight*.43); setTimeout(()=>body.classList.remove('celebrate'),1600);
  }

  function burst(x,y){ const colors=['#ffc928','#ff3d67','#0aa7ff','#4ee03e','#fff']; for(let i=0;i<135;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*8; particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,life:1,c:colors[Math.floor(Math.random()*colors.length)],s:3+Math.random()*6});} if(!fxLoopRunning) fxLoop(); }
  let fxLoopRunning=false;
  function fxLoop(){ fxLoopRunning=true; fx.clearRect(0,0,innerWidth,innerHeight); particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life-=.014; if(p.life<=0)return false; fx.save(); fx.globalAlpha=p.life; fx.fillStyle=p.c; fx.beginPath(); fx.arc(p.x,p.y,p.s,0,Math.PI*2); fx.fill(); fx.restore(); return true;}); if(particles.length) requestAnimationFrame(fxLoop); else fxLoopRunning=false; }

  form.addEventListener('submit',e=>{ e.preventDefault(); startAudio(); const name=$('playerName').value.trim(), organisation=$('organisation').value.trim(), mobile=$('mobileNumber').value.trim(); if(!name||!organisation||!mobile||!$('consentCheck').checked) return; const players=loadPlayers(); currentPlayer={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),registeredAt:new Date().toISOString(),name,organisation,mobile,consent:true,spinCount:0,lastPrize:'',lastSpinAt:''}; players.push(currentPlayer); savePlayers(players); loadingOverlay.classList.remove('hidden'); clickSound(); setTimeout(()=>{loadingOverlay.classList.add('hidden'); registrationScreen.classList.add('hidden'); gameScreen.classList.remove('hidden'); drawWheel();},850); });
  spinButton.addEventListener('click',spin);
  awesomeButton.addEventListener('click',()=>{ overlay.classList.add('hidden'); clickSound(); });
  retryButton.addEventListener('click',()=>{ overlay.classList.add('hidden'); gameScreen.classList.add('hidden'); registrationScreen.classList.remove('hidden'); currentPlayer=null; form.reset(); clickSound(); });

  exportCsv.addEventListener('click',()=>{ const rows=loadPlayers(); if(!rows.length){alert('No player data yet.');return;} const header=['registered_at','full_name_as_per_ic','organisation_department','mobile_number','consent','spin_count','last_prize','last_spin_at']; const csv=[header.join(',')].concat(rows.map(r=>header.map(h=>csvCell(({registered_at:r.registeredAt,full_name_as_per_ic:r.name,organisation_department:r.organisation,mobile_number:r.mobile,consent:r.consent?'YES':'NO',spin_count:r.spinCount||0,last_prize:r.lastPrize||'',last_spin_at:r.lastSpinAt||''})[h])).join(','))).join('\n'); download(`scc-spin-win-players-${new Date().toISOString().slice(0,10)}.csv`,csv); });
  resetData.addEventListener('click',()=>{ if(confirm('Reset all saved player information?')){ localStorage.removeItem(STORE_KEY); alert('Player information reset.'); }});
  function csvCell(v){ return '"'+String(v??'').replace(/"/g,'""')+'"'; }
  function download(name,text){ const blob=new Blob([text],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }

  setInterval(()=>body.classList.toggle('night'),26000);
  drawWheel();

  function startAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume(); if(!musicOn) startMusic(); }
  function tone(freq,dur=0.12,type='sine',vol=.06,delay=0){ if(!audioCtx)return; const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.02); }
  function clickSound(){ tone(720,.07,'triangle',.035); }
  function tickSound(t){ if(t>.08) tone(1000-Math.min(400,t*350),.035,'square',.018); }
  function spinSound(){ tone(160,.45,'sawtooth',.035); tone(220,.55,'sawtooth',.025,.1); }
  function winnerSound(){ [523,659,784,1046].forEach((n,i)=>tone(n,.22,'triangle',.065,i*.11)); }
  function startMusic(){ musicOn=true; musicToggle.textContent='♪'; const notes=[523,659,784,659,587,698,880,698,523,659,784,1046,988,784,659,587]; let i=0; clearInterval(musicTimer); musicTimer=setInterval(()=>{ if(!musicOn||!audioCtx)return; tone(notes[i%notes.length],.20,'triangle',.018); if(i%4===0) tone(notes[(i+5)%notes.length]/2,.32,'sine',.014); i++; },360); }
  function stopMusic(){ musicOn=false; musicToggle.textContent='off'; clearInterval(musicTimer); }
  musicToggle.addEventListener('click',()=>{ startAudio(); musicOn?stopMusic():startMusic(); });
})();
