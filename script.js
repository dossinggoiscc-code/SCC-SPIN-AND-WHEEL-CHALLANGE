const registrationForm=document.getElementById('registrationForm');
const registrationScreen=document.getElementById('registrationScreen');
const gameScreen=document.getElementById('gameScreen');
const playerBadge=document.getElementById('playerBadge');
const badgeName=document.getElementById('badgeName');
const wheelStage=document.getElementById('wheelStage');
const canvas=document.getElementById('wheelCanvas');
const ctx=canvas.getContext('2d');
const spinButton=document.getElementById('spinButton');
const pointer=document.getElementById('pointer');
const winnerOverlay=document.getElementById('winnerOverlay');
const winnerPrize=document.getElementById('winnerPrize');
const closeWinner=document.getElementById('closeWinner');
const fxCanvas=document.getElementById('fxCanvas');
const fx=fxCanvas.getContext('2d');

const prizes=[
  {name:'YOYO',color:'#0078d7',qty:20},
  {name:'HAND FAN',color:'#ff8500',qty:15},
  {name:'BATTERY FAN',color:'#d11236',qty:10},
  {name:'BACK PACK',color:'#118c22',qty:5},
  {name:'MYSTERY',color:'#d30072',qty:1,isMystery:true,label:'🎁'}
];
const totalSections=51;
const sections=[];
sections[0]={...prizes[4]};
[10,20,30,40,50].forEach(i=>sections[i]={...prizes[3]});
[5,9,14,19,24,29,34,39,44,48].forEach(i=>sections[i]={...prizes[2]});
[2,4,7,12,16,18,22,26,28,32,36,38,41,43,46].forEach(i=>sections[i]={...prizes[1]});
for(let i=0;i<totalSections;i++){if(!sections[i])sections[i]={...prizes[0]};}

const arc=Math.PI*2/totalSections;
let rotation=0;
let spinning=false;
let particles=[];
let tickTimer=null;

function resizeFX(){fxCanvas.width=innerWidth;fxCanvas.height=innerHeight;}addEventListener('resize',resizeFX);resizeFX();
function shade(hex,p){let n=parseInt(hex.slice(1),16),a=Math.round(2.55*p),r=(n>>16)+a,g=(n>>8&255)+a,b=(n&255)+a;return '#'+(0x1000000+(r<255?r<0?0:r:255)*0x10000+(g<255?g<0?0:g:255)*0x100+(b<255?b<0?0:b:255)).toString(16).slice(1)}
function drawWheel(){
  const r=canvas.width/2;ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<totalSections;i++){
    const a=i*arc-Math.PI/2;const s=sections[i];
    ctx.beginPath();ctx.moveTo(r,r);ctx.arc(r,r,r,a,a+arc);ctx.closePath();
    const grad=ctx.createRadialGradient(r,r,r*.05,r,r,r);
    grad.addColorStop(0,'#fff');grad.addColorStop(.14,s.color);grad.addColorStop(1,shade(s.color,-30));
    ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=5;ctx.stroke();
    ctx.save();ctx.translate(r,r);ctx.rotate(a+arc/2);ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=8;ctx.font=s.isMystery?'900 76px Fredoka, Arial':'900 42px Fredoka, Arial';
    ctx.fillText(s.isMystery?s.label:s.name,r-150,0);ctx.restore();
  }
  ctx.beginPath();ctx.arc(r,r,r*.16,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.beginPath();ctx.arc(r,r,r*.11,0,Math.PI*2);ctx.fillStyle='#ffd34d';ctx.fill();
}wheelStage.classList.remove('spinning','zooming');
canvas.style.transition='none';
canvas.style.transform='rotate(0deg)';
drawWheel();

registrationForm.addEventListener('submit',e=>{e.preventDefault();const name=document.getElementById('playerName').value.trim();if(!name)return;badgeName.textContent=name;playerBadge.classList.remove('hidden');registrationScreen.classList.add('hidden');gameScreen.classList.remove('hidden');setTimeout(()=>spinButton.focus(),250);});

function pointerTicks(on){clearInterval(tickTimer);if(!on)return;tickTimer=setInterval(()=>{pointer.classList.add('tick');setTimeout(()=>pointer.classList.remove('tick'),90)},135)}
function spin(){
  if(spinning)return;spinning=true;spinButton.disabled=true;winnerOverlay.classList.add('hidden');
  wheelStage.classList.add('zooming','spinning');pointerTicks(true);
  canvas.style.transition='none';canvas.style.transform=`rotate(${rotation%360}deg)`;
  setTimeout(()=>{
    const target=Math.random()*Math.PI*2;const spinRad=11*Math.PI*2+target;rotation+=spinRad*180/Math.PI;
    canvas.style.transition='transform 6.4s cubic-bezier(.1,.8,.1,1)';canvas.style.transform=`rotate(${rotation}deg)`;
    setTimeout(finishSpin,6400);
  },50);
}
function finishSpin(){
  pointerTicks(false);wheelStage.classList.remove('zooming','spinning');
  let final=(rotation*Math.PI/180)%(Math.PI*2);if(final<0)final+=Math.PI*2;
  let pointerAngle=(Math.PI*2)-final;if(pointerAngle<0)pointerAngle+=Math.PI*2;
  const idx=Math.floor(pointerAngle/arc)%totalSections;const prize=sections[idx];
  winnerPrize.textContent=prize.isMystery?'MYSTERY PRIZE':prize.name;
  burst(innerWidth/2,innerHeight*.32);burst(innerWidth*.25,innerHeight*.42);burst(innerWidth*.75,innerHeight*.42);animateFX();
  setTimeout(()=>winnerOverlay.classList.remove('hidden'),650);
  spinButton.disabled=false;spinning=false;
}
spinButton.addEventListener('click',spin);
closeWinner.addEventListener('click',()=>winnerOverlay.classList.add('hidden'));
function burst(x,y){const colors=['#fff','#ffd300','#ff315a','#00aaff','#3be044','#ff8a00'];for(let i=0;i<90;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*8;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,decay:.01+Math.random()*.018,size:3+Math.random()*5,color:colors[Math.floor(Math.random()*colors.length)]})}}
function animateFX(){fx.clearRect(0,0,fxCanvas.width,fxCanvas.height);particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life-=p.decay;fx.globalAlpha=p.life;fx.fillStyle=p.color;fx.beginPath();fx.arc(p.x,p.y,p.size,0,Math.PI*2);fx.fill();});fx.globalAlpha=1;if(particles.length)requestAnimationFrame(animateFX)}
