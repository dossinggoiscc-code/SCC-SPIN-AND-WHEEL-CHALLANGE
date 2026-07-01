'use strict';
const $=s=>document.querySelector(s);
const stage=$('#stage'), form=$('#registerForm'), game=$('#game'), wheelZone=$('#wheelZone');
const canvas=$('#wheelCanvas'), ctx=canvas.getContext('2d'), spinBtn=$('#spinBtn'), pointer=$('#pointer');
const modal=$('#winnerModal'), winnerName=$('#winnerName'), prizeName=$('#prizeName'), winMascot=$('#winMascot');
const fx=$('#fxCanvas'), fctx=fx.getContext('2d');
const PRIZES=[
  {name:'YONO Coaster',qty:15,color:'#0071c8'},
  {name:'Hand Fan',qty:7,color:'#f07f00'},
  {name:'Battery Fan',qty:5,color:'#cf1237'},
  {name:'Bag Pack',qty:2,color:'#087a2b'},
  {name:'Mystery',qty:1,color:'#c6086d',mystery:true}
];
const mascots=['assets/images/malio.webp','assets/images/malia.png','assets/images/bob.webp','assets/images/ejau.webp','assets/images/kladee.webp'];
let slices=[], rotation=0, spinning=false, currentPlayer=null, records=[];
try{records=JSON.parse(localStorage.getItem('sccSpinWinPlayersV56')||'[]')}catch(e){records=[]}
function buildSlices(){slices=[];PRIZES.forEach(p=>{for(let i=0;i<p.qty;i++)slices.push({...p})});
  // spread prizes for visual balance
  slices=[slices[0],slices[15],slices[1],slices[22],slices[2],slices[27],slices[3],slices[16],slices[4],slices[23],slices[5],slices[28],slices[6],slices[17],slices[7],slices[24],slices[8],slices[18],slices[9],slices[25],slices[10],slices[19],slices[11],slices[26],slices[12],slices[20],slices[13],slices[21],slices[14],slices[29]];
}
buildSlices();
function fitCanvas(){const r=stage.getBoundingClientRect();fx.width=1920;fx.height=1080} window.addEventListener('resize',fitCanvas);fitCanvas();
function drawWheel(){
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,R=w*0.49,inner=w*0.18,arc=Math.PI*2/slices.length;
  ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);
  for(let i=0;i<slices.length;i++){
    const s=slices[i],a0=i*arc-Math.PI/2,a1=a0+arc;
    let grad=ctx.createRadialGradient(0,0,inner,0,0,R);
    grad.addColorStop(0,'#fff7aa');grad.addColorStop(.22,s.color);grad.addColorStop(1,shade(s.color,-42));
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,a0,a1);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.strokeStyle='#ffda62';ctx.lineWidth=5;ctx.stroke();
    ctx.save();ctx.rotate(a0+arc/2);ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=7;ctx.font='900 35px Fredoka,Arial';
    const label=s.name.toUpperCase().replace('YONO COASTER','YONO\nCOASTER').replace('BATTERY FAN','BATTERY\nFAN').replace('HAND FAN','HAND\nFAN').replace('BAG PACK','BAG\nPACK');
    drawMultiline(label,R-48,0,38);
    ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,0,inner,0,Math.PI*2);ctx.fillStyle='rgba(255,240,115,.95)';ctx.fill();ctx.lineWidth=12;ctx.strokeStyle='#fff5bb';ctx.stroke();
  ctx.restore();
}
function drawMultiline(text,x,y,lineH){const lines=text.split('\n');lines.forEach((ln,idx)=>{const yy=y+(idx-(lines.length-1)/2)*lineH;ctx.strokeText(ln,x,yy);ctx.fillText(ln,x,yy)})}
function shade(hex,p){let n=parseInt(hex.slice(1),16),r=(n>>16)+p,g=((n>>8)&255)+p,b=(n&255)+p;return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('')}
drawWheel();
function chooseIndex(){const bag=[];slices.forEach((s,i)=>bag.push(i));return bag[Math.floor(Math.random()*bag.length)]}
function spin(){
  if(spinning)return;spinning=true;stage.classList.add('spinning');spinBtn.disabled=true;modal.classList.add('hidden');
  const winIndex=chooseIndex(), arc=360/slices.length;
  const centerAngle=winIndex*arc+arc/2;
  const target=360-centerAngle; // pointer at top
  const extra=360*(7+Math.floor(Math.random()*3));
  const start=rotation, end=rotation+extra+norm(target-rotation);
  const duration=6500, t0=performance.now();wheelZone.classList.add('zoom');
  let lastTick=-1;
  function frame(now){
    const t=Math.min(1,(now-t0)/duration),e=easeOutQuint(t);rotation=start+(end-start)*e;
    canvas.style.transform=`rotate(${rotation}deg)`;
    const tick=Math.floor((rotation%360)/arc);if(tick!==lastTick){lastTick=tick;pointer.classList.add('bounce');setTimeout(()=>pointer.classList.remove('bounce'),80)}
    if(t<1)requestAnimationFrame(frame);else finishSpin(winIndex);
  } requestAnimationFrame(frame);
}
function norm(v){v%=360;return v<0?v+360:v} function easeOutQuint(x){return 1-Math.pow(1-x,5)}
function finishSpin(idx){setTimeout(()=>{wheelZone.classList.remove('zoom');stage.classList.remove('spinning');spinBtn.disabled=false;spinning=false;showWinner(slices[idx])},650)}
function showWinner(prize){winnerName.textContent=currentPlayer?.name||'Player';prizeName.textContent=prize.name;winMascot.src=mascots[Math.floor(Math.random()*mascots.length)];modal.classList.remove('hidden');confetti(); if(currentPlayer){currentPlayer.prize=prize.name;currentPlayer.time=new Date().toLocaleString();records.push(currentPlayer);localStorage.setItem('sccSpinWinPlayersV56',JSON.stringify(records));}}
form.addEventListener('submit',e=>{e.preventDefault();currentPlayer={name:$('#fullName').value.trim(),organisation:$('#orgDept').value.trim(),mobile:$('#phone').value.trim(),consent:$('#consent').checked?'Yes':'No'};stage.classList.remove('intro-mode');stage.classList.add('game-mode');$('#intro').classList.add('hidden');game.classList.remove('hidden');drawWheel()});
spinBtn.addEventListener('click',spin);
function resetWheelOnly(){
  modal.classList.add('hidden');
  $('#staffPanel')?.classList.add('hidden');
  rotation=0;
  canvas.style.transform='rotate(0deg)';
  spinBtn.disabled=false;
  spinning=false;
  stage.classList.remove('spinning');
  wheelZone.classList.remove('zoom');
}
function returnToRegistration(){
  resetWheelOnly();
  game.classList.add('hidden');
  $('#intro').classList.remove('hidden');
  stage.classList.add('intro-mode');
  stage.classList.remove('game-mode');
  form.reset();
  currentPlayer=null;
}
$('#awesomeBtn').onclick=returnToRegistration;
$('#staffMenuBtn')?.addEventListener('click',()=>$('#staffPanel')?.classList.remove('hidden'));
$('#closeStaffBtn')?.addEventListener('click',()=>$('#staffPanel')?.classList.add('hidden'));
$('#retryBtn')?.addEventListener('click',resetWheelOnly);
// Hidden admin shortcut: tap/click logo five times
let logoTaps=0,logoTimer=null;
document.querySelector('.brand img')?.addEventListener('click',()=>{clearTimeout(logoTimer);logoTaps++;logoTimer=setTimeout(()=>logoTaps=0,1200);if(logoTaps>=5){logoTaps=0;$('#staffPanel')?.classList.remove('hidden')}});
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='a')$('#staffPanel')?.classList.remove('hidden')});
$('#exportBtn').onclick=()=>{const rows=[['Name','Organisation / Department','Mobile','Consent','Prize','Time'],...records.map(r=>[r.name,r.organisation,r.mobile,r.consent,r.prize||'',r.time||''])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='scc-spin-win-players.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$('#resetDataBtn').onclick=()=>{if(confirm('Reset all saved player data?')){records=[];localStorage.removeItem('sccSpinWinPlayersV56')}};
// single day/night controller
let night=false;setInterval(()=>{night=!night;stage.classList.toggle('night',night)},22000);
// Background music support
// Put your licensed/approved background music file here:
// assets/audio/background.mp3
// Note: copyrighted YouTube music is not bundled. If you have rights to use the track,
// download it yourself and save it as assets/audio/background.mp3.
let audioCtx=null,bgmTimer=null,musicOn=false,bgmAudio=null,bgmUsingFallback=false;
function ac(){return audioCtx||(audioCtx=new (window.AudioContext||window.webkitAudioContext)())}
function tone(freq,dur=.18,type='sine',vol=.04){const c=ac(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(c.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);o.stop(c.currentTime+dur)}
function startFallbackMusic(){
  if(bgmTimer)return;
  bgmUsingFallback=true;
  const notes=[523,659,784,988,880,784,659,587,659,784,880,784];
  let i=0;
  bgmTimer=setInterval(()=>{tone(notes[i++%notes.length],.2,'triangle',.022)},340);
}
function stopFallbackMusic(){if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null}}
function ensureBgmAudio(){
  if(bgmAudio)return bgmAudio;
  bgmAudio=new Audio('assets/audio/background.mp3');
  bgmAudio.loop=true;
  bgmAudio.volume=.35;
  bgmAudio.preload='auto';
  bgmAudio.addEventListener('error',()=>{if(musicOn)startFallbackMusic()},{once:true});
  return bgmAudio;
}
function startMusic(){
  if(musicOn)return;
  musicOn=true;
  const audio=ensureBgmAudio();
  stopFallbackMusic();
  audio.play().then(()=>{bgmUsingFallback=false}).catch(()=>startFallbackMusic());
}
function stopMusic(){
  musicOn=false;
  if(bgmAudio){bgmAudio.pause();bgmAudio.currentTime=0}
  stopFallbackMusic();
}
$('#musicBtn').onclick=()=>{musicOn?stopMusic():startMusic()};document.addEventListener('pointerdown',()=>{if(!musicOn)startMusic()},{once:true});
function confetti(){let parts=[];for(let i=0;i<130;i++)parts.push({x:960,y:360,vx:(Math.random()-.5)*12,vy:-Math.random()*9-3,g:.22,a:1,s:4+Math.random()*7,c:['#ffcc00','#00aaff','#ff2d6d','#32d74b','#fff'][i%5]});let st=performance.now();function f(now){fctx.clearRect(0,0,1920,1080);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.a-=.008;fctx.globalAlpha=Math.max(0,p.a);fctx.fillStyle=p.c;fctx.fillRect(p.x,p.y,p.s,p.s)});fctx.globalAlpha=1;if(now-st<2600)requestAnimationFrame(f);else fctx.clearRect(0,0,1920,1080)}requestAnimationFrame(f)}

/* ===============================
   V5.5 FULL SCREEN PRESENTATION MODE
   Fixed 1920x1080 stage scaling for every device
   =============================== */
(function(){
  const gate=document.getElementById('presentationGate');
  const fullBtn=document.getElementById('fullScreenBtn');
  const contBtn=document.getElementById('continueBtn');
  const view=document.getElementById('viewport');
  const st=document.getElementById('stage');
  const BASE_W=1920, BASE_H=1080;

  function scaleStage(){
    const vw=window.innerWidth;
    const vh=window.innerHeight;
    const scale=Math.min(vw/BASE_W, vh/BASE_H);
    st.style.transform=`translate(-50%, -50%) scale(${scale})`;
  }

  window.addEventListener('resize',scaleStage,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(scaleStage,250));
  document.addEventListener('fullscreenchange',()=>setTimeout(scaleStage,80));
  scaleStage();

  async function enterFullscreen(){
    try{
      if(view.requestFullscreen) await view.requestFullscreen();
      else if(view.webkitRequestFullscreen) await view.webkitRequestFullscreen();
    }catch(err){
      console.warn('Fullscreen not available:',err);
    }
    gate.classList.add('hidden');
    scaleStage();
    try{ if(typeof startMusic==='function') startMusic(); }catch(e){}
  }

  fullBtn?.addEventListener('click',enterFullscreen);
  contBtn?.addEventListener('click',()=>{gate.classList.add('hidden');scaleStage();try{ if(typeof startMusic==='function') startMusic(); }catch(e){}});

  // keep the game scaled even when browser zoom changes or mobile address bar appears
  let lastW=0,lastH=0;
  setInterval(()=>{
    if(window.innerWidth!==lastW || window.innerHeight!==lastH){
      lastW=window.innerWidth;lastH=window.innerHeight;scaleStage();
    }
  },500);
})();

/* V5.8 patch: uploaded background music + fullscreen recovery */
(function(){
  const miniFs=document.getElementById('miniFullScreenBtn');
  const viewport=document.getElementById('viewport');
  const gate=document.getElementById('presentationGate');
  const stage=document.getElementById('stage');
  let hint=document.createElement('div');
  hint.className='fullscreen-exit-hint';
  hint.textContent='Tap ⛶ to return Full Screen';
  stage?.appendChild(hint);
  async function goFullScreen(){
    try{
      if(viewport?.requestFullscreen) await viewport.requestFullscreen();
      else if(viewport?.webkitRequestFullscreen) await viewport.webkitRequestFullscreen();
    }catch(e){ console.warn('Fullscreen unavailable',e); }
    gate?.classList.add('hidden');
    try{ if(typeof startMusic==='function') startMusic(); }catch(e){}
  }
  miniFs?.addEventListener('click',goFullScreen);
  document.addEventListener('fullscreenchange',()=>{
    const isFull=!!document.fullscreenElement;
    if(!isFull && gate?.classList.contains('hidden')){
      hint?.classList.add('show');
      miniFs && (miniFs.style.opacity='1');
      setTimeout(()=>hint?.classList.remove('show'),3500);
    }
  });
})();

/* ===============================
   V5.9 Final Patch
   Fullscreen reminder + cover scaling + landscape lock attempt
   =============================== */
(function(){
  const BASE_W=1920, BASE_H=1080;
  const viewport=document.getElementById('viewport');
  const st=document.getElementById('stage');
  const gate=document.getElementById('presentationGate');
  const oldFull=document.getElementById('fullScreenBtn');
  const oldMini=document.getElementById('miniFullScreenBtn');
  if(!viewport || !st) return;

  function applyScale(){
    const vw=window.innerWidth;
    const vh=window.innerHeight;
    const aspect=vw/vh;
    const isFull=!!document.fullscreenElement || !!document.webkitFullscreenElement;
    const shouldCover=isFull || aspect > (BASE_W/BASE_H);
    const scale=shouldCover ? Math.max(vw/BASE_W, vh/BASE_H) : Math.min(vw/BASE_W, vh/BASE_H);
    st.style.transform=`translate(-50%, -50%) scale(${scale})`;
  }

  const modal=document.createElement('div');
  modal.className='orientation-modal hidden';
  modal.innerHTML=`
    <div class="orientation-card">
      <span class="phone-icon">📱↔️</span>
      <h2>Best Experience</h2>
      <p>For mobile phones and tablets, please rotate your device to <strong>landscape orientation</strong> before playing in full screen.</p>
      <button type="button" id="confirmLandscapeBtn">OK, ENTER FULL SCREEN</button>
    </div>`;
  document.body.appendChild(modal);
  const confirmBtn=modal.querySelector('#confirmLandscapeBtn');

  async function requestFs(){
    try{
      if(viewport.requestFullscreen) await viewport.requestFullscreen();
      else if(viewport.webkitRequestFullscreen) await viewport.webkitRequestFullscreen();
    }catch(e){ console.warn('Fullscreen unavailable',e); }
    try{
      if(screen.orientation && screen.orientation.lock){
        await screen.orientation.lock('landscape');
      }
    }catch(e){ /* iOS/browser may not support orientation lock */ }
    gate?.classList.add('hidden');
    modal.classList.add('hidden');
    try{ if(typeof startMusic==='function') startMusic(); }catch(e){}
    setTimeout(applyScale,80);
  }

  function showReminder(e){
    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();
    modal.classList.remove('hidden');
  }

  // Clone buttons to remove older fullscreen listeners, then attach final behavior.
  if(oldFull){
    const newFull=oldFull.cloneNode(true);
    oldFull.parentNode.replaceChild(newFull,oldFull);
    newFull.addEventListener('click',showReminder);
  }
  if(oldMini){
    const newMini=oldMini.cloneNode(true);
    oldMini.parentNode.replaceChild(newMini,oldMini);
    newMini.addEventListener('click',showReminder);
  }
  confirmBtn?.addEventListener('click',requestFs);

  // Keep applying after older scripts, zoom changes, browser UI changes, and fullscreen changes.
  window.addEventListener('resize',()=>setTimeout(applyScale,40),{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(applyScale,350));
  document.addEventListener('fullscreenchange',()=>setTimeout(applyScale,80));
  document.addEventListener('webkitfullscreenchange',()=>setTimeout(applyScale,80));
  setInterval(applyScale,300);
  applyScale();
})();
