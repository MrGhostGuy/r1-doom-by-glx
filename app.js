// DOOM by GLX - Complete R1 Edition
// Created by Jeff Hollaway [GhostLegacyX]
const W=240,H=282,MAP_S=16,TEX=64,FOV=Math.PI/3,HALF_FOV=FOV/2;
const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
canvas.width=W;canvas.height=H;
const isR1=typeof PluginMessageHandler!=="undefined";
let gameState="title",level=1,maxLevel=3,score=0,gameTime=0,lastTime=0;
let kills=0,totalEnemies=0,itemsCollected=0,totalItems=0,secretsFound=0,totalSecrets=0;
let px=3.5,py=3.5,pa=0,pHealth=100,pMaxHealth=100,pArmor=0,pArmorType=0;
let curWeap=1,hasWeap=[true,true,false,false,false,false],weapAnim=0,fireTimer=0;
let hasKey={red:false,blue:false,yellow:false};
let invulnTimer=0,berserkTimer=0,invisTimer=0,radSuitTimer=0,lightAmpTimer=0,mapReveal=false;
let ammo={bullet:50,shell:0,rocket:0,cell:0};
let maxAmmo={bullet:200,shell:50,rocket:50,cell:300};
let hasBackpack=false,damageFlash=0,pickupMsg="",pickupTimer=0,faceFrame=0,facePain=0,faceKillGrin=0,activeFaceIdx=0,totalKills=0,audioOn=1,menuSelection=0;
let enemies=[],items=[],projectiles=[],doors=[],particles=[];
let moveF=0,moveS=0,turnR=0,shooting=false,useBtn=false;
let aimOffsetY=0,aimSensitivity=3,scrollAimAmount=0;
let hitFlashTimer=0,weapSwitchTimer=0,weapSwitchFrom=0;
let shootBtnPressed=false,switchBtnPressed=false;
let shootBtnAnim=0,switchBtnAnim=0;
let screenShakeTimer=0,screenShakeIntensity=0;
let lastDamageDir=0,compassAngle=0;
let settingsOpen=false,titleSelection=0;
let smoothPA=0,targetPA=0;

// Audio context for sound effects
let audioCtx=null;
function initAudio(){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function playSound(freq,dur,type,vol){
  if(!audioCtx)return;try{
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type||"square";o.frequency.setValueAtTime(freq,audioCtx.currentTime);
  g.gain.setValueAtTime(vol||0.15,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
  o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
  }catch(e){}}
function sndShoot(){playSound(180,0.1,"sawtooth",0.2);}
function sndShotgun(){playSound(80,0.15,"sawtooth",0.25);setTimeout(()=>playSound(60,0.1,"square",0.15),50);}
function sndRocket(){playSound(60,0.3,"sawtooth",0.3);}
function sndPlasma(){playSound(800,0.08,"sine",0.15);}
function sndPickup(){playSound(600,0.1,"sine",0.15);setTimeout(()=>playSound(900,0.1,"sine",0.15),100);}
function sndDoor(){playSound(100,0.3,"square",0.1);}
function sndHurt(){playSound(150,0.15,"sawtooth",0.2);}
function sndDeath(){playSound(80,0.4,"sawtooth",0.25);}
function sndKey(){playSound(500,0.15,"sine",0.2);setTimeout(()=>playSound(700,0.15,"sine",0.2),150);}
function sndSecret(){playSound(400,0.1,"sine",0.15);setTimeout(()=>playSound(600,0.1,"sine",0.15),100);setTimeout(()=>playSound(800,0.15,"sine",0.2),200);}
function sndWeaponSwitch(){playSound(300,0.05,"square",0.1);}
function sndExplosion(){playSound(40,0.4,"sawtooth",0.3);playSound(60,0.3,"square",0.2);}

// Weapon definitions: name,damage,fireRate,ammoType,ammoCost,range,spread
const WEAPONS=[
  {name:"Fist",dmg:10,rate:20,ammoType:null,cost:0,range:1.5,spread:0,auto:false},
  {name:"Pistol",dmg:15,rate:12,ammoType:"bullet",cost:1,range:50,spread:0.02,auto:false},
  {name:"Shotgun",dmg:70,rate:25,ammoType:"shell",cost:1,range:30,spread:0.08,auto:false},
  {name:"Chaingun",dmg:15,rate:4,ammoType:"bullet",cost:1,range:50,spread:0.04,auto:true},
  {name:"Rocket",dmg:100,rate:30,ammoType:"rocket",cost:1,range:50,spread:0,auto:false},
  {name:"Plasma",dmg:25,rate:5,ammoType:"cell",cost:1,range:50,spread:0.02,auto:true}
];

// Enemy types: name,hp,speed,damage,attackRate,score,sprite color
const ENEMY_TYPES={
  zombie:{name:"Zombie",hp:20,spd:0.015,dmg:8,rate:40,score:50,color:"#4a4"},
  imp:{name:"Imp",hp:60,spd:0.02,dmg:12,rate:50,score:100,color:"#a64"},
  demon:{name:"Demon",hp:150,spd:0.03,dmg:25,rate:30,score:200,color:"#a44"},
  caco:{name:"Cacodemon",hp:400,spd:0.018,dmg:20,rate:60,score:400,color:"#a33"},
  baron:{name:"Baron",hp:1000,spd:0.015,dmg:40,rate:70,score:1000,color:"#633"}
};

// Item types
const ITEM_TYPES={
  healthBonus:{name:"Health Bonus",color:"#aaf",effect:"health",val:1,max:200},
  stimpack:{name:"Stimpack",color:"#f44",effect:"health",val:10,max:100},
  medikit:{name:"Medikit",color:"#f88",effect:"health",val:25,max:100},
  soulSphere:{name:"Soul Sphere",color:"#44f",effect:"health",val:100,max:200},
  armorBonus:{name:"Armor Bonus",color:"#4f4",effect:"armor",val:1,max:200,type:0},
  greenArmor:{name:"Green Armor",color:"#0a0",effect:"armor",val:100,max:100,type:1},
  blueArmor:{name:"Blue Armor",color:"#00f",effect:"armor",val:200,max:200,type:2},
  clipAmmo:{name:"Clip",color:"#aa0",effect:"ammo",ammoType:"bullet",val:10},
  shellAmmo:{name:"Shells",color:"#a60",effect:"ammo",ammoType:"shell",val:4},
  rocketAmmo:{name:"Rocket",color:"#a00",effect:"ammo",ammoType:"rocket",val:1},
  cellAmmo:{name:"Cell Pack",color:"#0aa",effect:"ammo",ammoType:"cell",val:20},
  backpack:{name:"Backpack",color:"#860",effect:"backpack",val:0},
  redKey:{name:"Red Key",color:"#f00",effect:"key",keyType:"red"},
  blueKey:{name:"Blue Key",color:"#00f",effect:"key",keyType:"blue"},
  yellowKey:{name:"Yellow Key",color:"#ff0",effect:"key",keyType:"yellow"},
  invuln:{name:"Invulnerability",color:"#fff",effect:"powerup",pType:"invuln",dur:1800},
  berserk:{name:"Berserk",color:"#f00",effect:"powerup",pType:"berserk",dur:3600},
  invis:{name:"Invisibility",color:"#88f",effect:"powerup",pType:"invis",dur:1800},
  radsuit:{name:"Radiation Suit",color:"#0f0",effect:"powerup",pType:"radsuit",dur:3600},
  compMap:{name:"Computer Map",color:"#888",effect:"powerup",pType:"map",dur:0},
  lightAmp:{name:"Light Amp",color:"#ff8",effect:"powerup",pType:"light",dur:3600},
  shotgunPickup:{name:"Shotgun",color:"#a80",effect:"weapon",weapIdx:2,ammoType:"shell",val:8},
  chaingunPickup:{name:"Chaingun",color:"#aa0",effect:"weapon",weapIdx:3,ammoType:"bullet",val:20},
  rocketPickup:{name:"Rocket Launcher",color:"#800",effect:"weapon",weapIdx:4,ammoType:"rocket",val:2},
  plasmaPickup:{name:"Plasma Gun",color:"#088",effect:"weapon",weapIdx:5,ammoType:"cell",val:40}
};

// Level maps - 0=empty,1-5=walls,6=door,7=locked red,8=locked blue,9=locked yellow,E=exit

const FACE_TYPES=[{name:"Marine",color:"#c90",eye:"#000",unlock:0},{name:"Robot",color:"#aaa",eye:"#f00",unlock:10},{name:"Alien",color:"#0a0",eye:"#ff0",unlock:25},{name:"Zombie",color:"#686",eye:"#f80",unlock:50},{name:"Cyborg",color:"#68a",eye:"#0ff",unlock:75},{name:"Demon",color:"#a00",eye:"#ff0",unlock:100}];
function isFaceUnlocked(i){return totalKills>=FACE_TYPES[i].unlock;}
const LEVELS=[null,
  {name:"Hangar",map:[
    "1111111111111111",
    "1000000100000001",
    "1000000100000001",
    "1000000600000001",
    "1000000100000001",
    "1111611111161111",
    "1000000000000001",
    "1000000000000001",
    "1000007000008001",
    "1000001000001001",
    "1000001000001001",
    "1000001000001001",
    "1111111000011111",
    "100000000000E001",
    "1000000000000001",
    "1111111111111111"
  ],spawn:{x:1.5,y:1.5,a:0},
  enemies:[
    {type:"zombie",x:5.5,y:2.5},{type:"zombie",x:8.5,y:1.5},
    {type:"imp",x:12.5,y:7.5},{type:"zombie",x:3.5,y:7.5},
    {type:"imp",x:10.5,y:9.5},{type:"zombie",x:6.5,y:13.5}
  ],
  items:[
    {type:"stimpack",x:2.5,y:2.5},{type:"clipAmmo",x:4.5,y:1.5},
    {type:"shotgunPickup",x:8.5,y:6.5},{type:"medikit",x:1.5,y:7.5},
    {type:"greenArmor",x:13.5,y:1.5},{type:"shellAmmo",x:10.5,y:7.5},
    {type:"redKey",x:1.5,y:13.5},{type:"blueKey",x:5.5,y:4.5},
    {type:"healthBonus",x:3.5,y:6.5},{type:"healthBonus",x:4.5,y:6.5},
    {type:"armorBonus",x:7.5,y:7.5},{type:"armorBonus",x:8.5,y:7.5}
  ],secrets:[{x:13,y:1}]},
  {name:"Nuclear Plant",map:[
    "2222222222222222",
    "2000020000000002",
    "2000020000000002",
    "2000060000060002",
    "2000020000020002",
    "2222022222022222",
    "2000000000000002",
    "2000000000000002",
    "2000090000070002",
    "2000020000020002",
    "2222022222022222",
    "2000000000000002",
    "2000000000000002",
    "200000000000E002",
    "2000000000000002",
    "2222222222222222"
  ],spawn:{x:1.5,y:1.5,a:0},
  enemies:[
    {type:"zombie",x:4.5,y:1.5},{type:"imp",x:8.5,y:2.5},
    {type:"imp",x:12.5,y:1.5},{type:"demon",x:6.5,y:6.5},
    {type:"zombie",x:1.5,y:6.5},{type:"zombie",x:13.5,y:6.5},
    {type:"imp",x:4.5,y:11.5},{type:"imp",x:10.5,y:11.5},
    {type:"caco",x:7.5,y:13.5},{type:"zombie",x:1.5,y:13.5}
  ],
  items:[
    {type:"stimpack",x:1.5,y:2.5},{type:"medikit",x:13.5,y:2.5},
    {type:"shellAmmo",x:6.5,y:1.5},{type:"rocketAmmo",x:10.5,y:6.5},
    {type:"blueArmor",x:1.5,y:11.5},{type:"soulSphere",x:13.5,y:11.5},
    {type:"yellowKey",x:4.5,y:4.5},{type:"redKey",x:10.5,y:4.5},
    {type:"chaingunPickup",x:7.5,y:6.5},{type:"rocketPickup",x:7.5,y:11.5},
    {type:"clipAmmo",x:3.5,y:11.5},{type:"cellAmmo",x:11.5,y:11.5},
    {type:"berserk",x:1.5,y:14.5},{type:"invuln",x:13.5,y:14.5}
  ],secrets:[{x:1,y:14},{x:13,y:14}]},
  {name:"Toxin Refinery",map:[
    "3333333333333333",
    "3000030000000003",
    "3000030000000003",
    "3000063000060003",
    "3000030000030003",
    "3333033333033333",
    "3000000000000003",
    "3000000000000003",
    "3000080000090003",
    "3000030000030003",
    "3333033333033333",
    "3000000000000003",
    "3000000000000003",
    "300000000000E003",
    "3000000000000003",
    "3333333333333333"
  ],spawn:{x:1.5,y:1.5,a:0},
  enemies:[
    {type:"imp",x:5.5,y:2.5},{type:"imp",x:9.5,y:1.5},
    {type:"demon",x:12.5,y:2.5},{type:"caco",x:3.5,y:6.5},
    {type:"demon",x:10.5,y:6.5},{type:"imp",x:1.5,y:11.5},
    {type:"caco",x:7.5,y:11.5},{type:"baron",x:12.5,y:13.5},
    {type:"imp",x:3.5,y:13.5},{type:"demon",x:6.5,y:8.5},
    {type:"zombie",x:13.5,y:6.5},{type:"zombie",x:1.5,y:8.5}
  ],
  items:[
    {type:"medikit",x:1.5,y:2.5},{type:"soulSphere",x:13.5,y:1.5},
    {type:"blueArmor",x:7.5,y:6.5},{type:"rocketAmmo",x:5.5,y:6.5},
    {type:"cellAmmo",x:9.5,y:6.5},{type:"plasmaPickup",x:7.5,y:1.5},
    {type:"blueKey",x:4.5,y:4.5},{type:"yellowKey",x:10.5,y:4.5},
    {type:"medikit",x:1.5,y:11.5},{type:"rocketAmmo",x:13.5,y:11.5},
    {type:"backpack",x:7.5,y:13.5},{type:"lightAmp",x:1.5,y:14.5},
    {type:"compMap",x:13.5,y:14.5},{type:"radsuit",x:7.5,y:8.5},
    {type:"invis",x:4.5,y:8.5}
  ],secrets:[{x:1,y:14},{x:13,y:14},{x:7,y:8}]}
];
let map=[],mapW=16,mapH=16;

// Load level
function loadLevel(n){
  const lv=LEVELS[n];if(!lv)return;
  map=lv.map.map(r=>r.split("").map(c=>c==="E"?"E":parseInt(c)||0));
  mapW=map[0].length;mapH=map.length;
  px=lv.spawn.x;py=lv.spawn.y;pa=lv.spawn.a;
  pHealth=100;pArmor=0;pArmorType=0;curWeap=1;
  hasWeap=[true,true,false,false,false,false];weapAnim=0;fireTimer=0;
  hasKey={red:false,blue:false,yellow:false};
  invulnTimer=0;berserkTimer=0;invisTimer=0;radSuitTimer=0;lightAmpTimer=0;mapReveal=false;
  ammo={bullet:50,shell:0,rocket:0,cell:0};
  maxAmmo={bullet:200,shell:50,rocket:50,cell:300};
  hasBackpack=false;damageFlash=0;pickupMsg="";pickupTimer=0;
  kills=0;itemsCollected=0;secretsFound=0;
  enemies=[];items=[];projectiles=[];doors=[];particles=[];
  totalEnemies=lv.enemies.length;totalItems=lv.items.length;totalSecrets=lv.secrets?lv.secrets.length:0;
  lv.enemies.forEach(e=>{
    const t=ENEMY_TYPES[e.type];
    enemies.push({x:e.x,y:e.y,type:e.type,hp:t.hp,maxHp:t.hp,spd:t.spd,dmg:t.dmg,
      rate:t.rate,score:t.score,color:t.color,state:"idle",timer:0,attackTimer:0,
      dir:Math.random()*Math.PI*2,alert:false,pain:0,dead:false});
  });
  lv.items.forEach(i=>{
    const t=ITEM_TYPES[i.type];
    items.push({x:i.x,y:i.y,type:i.type,color:t.color,name:t.name,picked:false});
  });
  // Setup doors
  for(let y=0;y<mapH;y++)for(let x=0;x<mapW;x++){
    if(map[y][x]>=6&&map[y][x]<=9){
      doors.push({x:x,y:y,open:0,opening:false,closing:false,locked:map[y][x]>=7?["","red","blue","yellow"][map[y][x]-6]:"",timer:0});
    }
  }
  gameTime=0;
}

// Collision detection
function isWall(x,y){
  const mx=Math.floor(x),my=Math.floor(y);
  if(mx<0||mx>=mapW||my<0||my>=mapH)return true;
  const c=map[my][mx];
  if(c==="E")return false;
  if(c>=6&&c<=9){
    const d=doors.find(d=>d.x===mx&&d.y===my);
    return d?d.open<0.8:true;
  }
  return c>0;
}

function canMove(nx,ny){
  const r=0.2;
  return !isWall(nx-r,ny-r)&&!isWall(nx+r,ny-r)&&!isWall(nx-r,ny+r)&&!isWall(nx+r,ny+r);
}

// Door interaction
function tryOpenDoor(){
  const dx=Math.cos(pa),dy=Math.sin(pa);
  for(let s=0.5;s<2;s+=0.5){
    const tx=Math.floor(px+dx*s),ty=Math.floor(py+dy*s);
    const d=doors.find(d=>d.x===tx&&d.y===ty);
    if(d){
      if(d.locked){
        if(hasKey[d.locked]){const kc=d.locked;d.locked="";d.opening=true;sndDoor();sndKey();
          pickupMsg=kc+" door unlocked!";pickupTimer=90;return;}
        else{pickupMsg="Need "+d.locked+" key!";pickupTimer=90;sndHurt();return;}
      }
      if(!d.opening&&d.open<0.1){d.opening=true;sndDoor();}
      return;
    }
    // Check exit
    if(map[ty]&&map[ty][tx]==="E"){completeLevel();return;}
  }
}

// Item pickup
function checkItemPickup(){
  items.forEach(it=>{
    if(it.picked)return;
    const dx=it.x-px,dy=it.y-py;
    if(dx*dx+dy*dy<0.5){
      const t=ITEM_TYPES[it.type];
      let picked=false;
      if(t.effect==="health"){
        const mh=t.max||100;
        if(pHealth<mh){pHealth=Math.min(pHealth+t.val,mh);picked=true;}
      }else if(t.effect==="armor"){
        const ma=t.max||100;
        if(pArmor<ma){pArmor=Math.min(pArmor+t.val,ma);if(t.type>0)pArmorType=Math.max(pArmorType,t.type);picked=true;}
      }else if(t.effect==="ammo"){
        if(ammo[t.ammoType]<maxAmmo[t.ammoType]){ammo[t.ammoType]=Math.min(ammo[t.ammoType]+t.val,maxAmmo[t.ammoType]);picked=true;}
      }else if(t.effect==="backpack"){
        if(!hasBackpack){hasBackpack=true;maxAmmo.bullet*=2;maxAmmo.shell*=2;maxAmmo.rocket*=2;maxAmmo.cell*=2;}
        ammo.bullet=Math.min(ammo.bullet+10,maxAmmo.bullet);ammo.shell=Math.min(ammo.shell+4,maxAmmo.shell);
        ammo.rocket=Math.min(ammo.rocket+1,maxAmmo.rocket);ammo.cell=Math.min(ammo.cell+20,maxAmmo.cell);picked=true;
      }else if(t.effect==="key"){
        if(!hasKey[t.keyType]){hasKey[t.keyType]=true;picked=true;sndKey();}
      }else if(t.effect==="powerup"){
        if(t.pType==="invuln"){invulnTimer=t.dur;picked=true;}
        else if(t.pType==="berserk"){berserkTimer=t.dur;pHealth=Math.max(pHealth,100);WEAPONS[0].dmg=100;picked=true;}
        else if(t.pType==="invis"){invisTimer=t.dur;picked=true;}
        else if(t.pType==="radsuit"){radSuitTimer=t.dur;picked=true;}
        else if(t.pType==="map"){mapReveal=true;picked=true;}
        else if(t.pType==="light"){lightAmpTimer=t.dur;picked=true;}
      }else if(t.effect==="weapon"){
        if(!hasWeap[t.weapIdx]){hasWeap[t.weapIdx]=true;curWeap=t.weapIdx;picked=true;}
        if(t.ammoType&&ammo[t.ammoType]<maxAmmo[t.ammoType]){ammo[t.ammoType]=Math.min(ammo[t.ammoType]+t.val,maxAmmo[t.ammoType]);picked=true;}
      }
      if(picked){it.picked=true;itemsCollected++;pickupMsg=t.name;pickupTimer=90;
        if(t.effect!=="key")sndPickup();
        // Check secret
        const lv=LEVELS[level];
        if(lv.secrets){lv.secrets.forEach(s=>{
          if(Math.floor(it.x)===s.x&&Math.floor(it.y)===s.y){secretsFound++;sndSecret();pickupMsg="Secret found!";}
        });}
      }
    }
  });
}

// Weapon switching
function switchWeapon(dir){weapSwitchTimer=1;weapSwitchFrom=curWeap;
  let n=curWeap;
  for(let i=0;i<6;i++){n=(n+dir+6)%6;if(hasWeap[n]){
    const w=WEAPONS[n];if(!w.ammoType||ammo[w.ammoType]>=w.cost){curWeap=n;sndWeaponSwitch();return;}
  }}
}
function selectWeapon(idx){if(hasWeap[idx]){const w=WEAPONS[idx];if(!w.ammoType||ammo[w.ammoType]>=w.cost){curWeap=idx;sndWeaponSwitch();}}}

// Fire weapon
function fireWeapon(){
  if(fireTimer>0||weapAnim>0)return;
  const w=WEAPONS[curWeap];
  if(w.ammoType&&ammo[w.ammoType]<w.cost)return;
  if(w.ammoType)ammo[w.ammoType]-=w.cost;
  fireTimer=w.rate;weapAnim=10;
  if(curWeap===0){sndShoot();}
  else if(curWeap===2){sndShotgun();}
  else if(curWeap===4){sndRocket();}
  else if(curWeap===5){sndPlasma();}
  else{sndShoot();}
  damageFlash=3;
  // Hitscan or projectile
  if(curWeap===4){// Rocket - projectile
    projectiles.push({x:px,y:py,dx:Math.cos(pa)*0.1,dy:Math.sin(pa)*0.1,dmg:w.dmg,owner:"player",life:300,type:"rocket"});
  }else if(curWeap===5){// Plasma
    projectiles.push({x:px,y:py,dx:Math.cos(pa)*0.12,dy:Math.sin(pa)*0.12,dmg:w.dmg,owner:"player",life:200,type:"plasma"});
  }else{// Hitscan
    let dmg=w.dmg;if(berserkTimer>0&&curWeap===0)dmg=100;
    const spread=w.spread;const pellets=curWeap===2?7:1;
    for(let p=0;p<pellets;p++){
      const a=pa+(Math.random()-0.5)*spread;
      const dx=Math.cos(a),dy=Math.sin(a);
      let hit=null,hitDist=w.range;
      enemies.forEach(e=>{
        if(e.dead)return;
        const ex=e.x-px,ey=e.y-py;
        const dot=ex*dx+ey*dy;if(dot<0.2||dot>hitDist)return;
        const cx=px+dx*dot,cy=py+dy*dot;
        const d=Math.sqrt((e.x-cx)**2+(e.y-cy)**2);
        if(d<0.4&&dot<hitDist){hit=e;hitDist=dot;}
      });
      if(hit){
        const d=curWeap===2?Math.floor(dmg/pellets*(0.8+Math.random()*0.4)):dmg;
        hit.hp-=d;hit.pain=8;hit.alert=true;hit.state="chase";
        particles.push({x:hit.x,y:hit.y,color:"#f00",life:10,type:"blood"});
        if(hit.hp<=0){hit.dead=true;hit.state="dead";hit.timer=30;kills++;score+=hit.score;sndDeath();}
        else{sndHurt();}
      }
    }
  }
}

// Update projectiles
function updateProjectiles(){
  projectiles=projectiles.filter(p=>{
    p.x+=p.dx;p.y+=p.dy;p.life--;
    if(p.life<=0||isWall(p.x,p.y)){
      if(p.type==="rocket"){sndExplosion();
        for(let i=0;i<8;i++)particles.push({x:p.x,y:p.y,color:"#f80",life:15+Math.random()*10,type:"explosion",
          vx:(Math.random()-0.5)*0.05,vy:(Math.random()-0.5)*0.05});
        enemies.forEach(e=>{if(!e.dead){const d=Math.sqrt((e.x-p.x)**2+(e.y-p.y)**2);
          if(d<2){const dmg=Math.floor(p.dmg*(1-d/2));e.hp-=dmg;e.pain=8;e.alert=true;
            if(e.hp<=0){e.dead=true;e.state="dead";faceKillGrin=30;totalKills++;e.timer=30;kills++;score+=e.score;}}}});
        if(p.owner==="player"){const d=Math.sqrt((px-p.x)**2+(py-p.y)**2);
          if(d<2){takeDamage(Math.floor(50*(1-d/2)));}}
      }return false;}
    if(p.owner==="player"){
      let hit=false;enemies.forEach(e=>{if(!e.dead&&!hit){
        const d=Math.sqrt((e.x-p.x)**2+(e.y-p.y)**2);
        if(d<0.4){e.hp-=p.dmg;e.pain=8;e.alert=true;
          if(e.hp<=0){e.dead=true;e.state="dead";faceKillGrin=30;totalKills++;e.timer=30;kills++;score+=e.score;sndDeath();}
          hit=true;if(p.type==="rocket"){sndExplosion();
            enemies.forEach(e2=>{if(!e2.dead){const d2=Math.sqrt((e2.x-p.x)**2+(e2.y-p.y)**2);
              if(d2<2&&e2!==e){e2.hp-=Math.floor(p.dmg*(1-d2/2));if(e2.hp<=0){e2.dead=true;e2.state="dead";kills++;score+=e2.score;}}}});}
        }}});if(hit)return false;
    }else{
      const d=Math.sqrt((px-p.x)**2+(py-p.y)**2);
      if(d<0.3){takeDamage(p.dmg);return false;}
    }
    return true;
  });
}

// Take damage
function takeDamage(d){
  if(invulnTimer>0)return;
  let dmg=d;
  if(pArmor>0){const ab=pArmorType===2?0.5:0.33;const blocked=Math.floor(dmg*ab);
    pArmor=Math.max(0,pArmor-blocked);dmg-=blocked;}
  pHealth-=dmg;damageFlash=8;facePain=20;sndHurt();
  if(pHealth<=0){pHealth=0;gameState="dead";sndDeath();}
}

// Enemy AI
function updateEnemies(){
  enemies.forEach(e=>{
    if(e.dead){e.timer--;return;}
    if(e.pain>0){e.pain--;return;}
    const dx=px-e.x,dy=py-e.y,dist=Math.sqrt(dx*dx+dy*dy);
    const toPlayer=Math.atan2(dy,dx);
    // Alert if close or shot
    if(dist<8&&!e.alert){e.alert=true;e.state="chase";}
    if(e.state==="idle"){
      e.timer--;if(e.timer<=0){e.dir=Math.random()*Math.PI*2;e.timer=60+Math.random()*120;}
      const nx=e.x+Math.cos(e.dir)*e.spd*0.5,ny=e.y+Math.sin(e.dir)*e.spd*0.5;
      if(!isWall(nx,ny)){e.x=nx;e.y=ny;}else{e.dir=Math.random()*Math.PI*2;}
    }else if(e.state==="chase"){
      e.dir=toPlayer;e.attackTimer--;
      if(dist<1.5&&e.type==="demon"){
        if(e.attackTimer<=0){takeDamage(e.dmg);e.attackTimer=e.rate;}
      }else if(dist<10&&e.attackTimer<=0&&e.type!=="demon"){
        // Ranged attack
        const spread=(Math.random()-0.5)*0.1;
        projectiles.push({x:e.x,y:e.y,dx:Math.cos(toPlayer+spread)*0.06,dy:Math.sin(toPlayer+spread)*0.06,
          dmg:e.dmg,owner:"enemy",life:200,type:"enemy"});
        e.attackTimer=e.rate;
      }
      const spd=e.spd;const nx=e.x+Math.cos(toPlayer)*spd,ny=e.y+Math.sin(toPlayer)*spd;
      if(!isWall(nx,e.y))e.x=nx;if(!isWall(e.x,ny))e.y=ny;
    }
  });
}

// Update doors
function updateDoors(){
  doors.forEach(d=>{
    if(d.opening){d.open=Math.min(d.open+0.03,1);if(d.open>=1){d.opening=false;d.timer=180;}}
    if(!d.opening&&d.open>0&&!d.locked){d.timer--;if(d.timer<=0){d.open=Math.max(d.open-0.03,0);}}
  });
}

// Player movement
function updatePlayer(){
  pa+=turnR*0.04;
  const spd=0.05;
  const nx=px+Math.cos(pa)*moveF*spd-Math.sin(pa)*moveS*spd;
  const ny=py+Math.sin(pa)*moveF*spd+Math.cos(pa)*moveS*spd;
  if(canMove(nx,py))px=nx;
  if(canMove(px,ny))py=ny;
  if(fireTimer>0)fireTimer--;
  if(weapAnim>0)weapAnim--;
  if(damageFlash>0)damageFlash--;
  if(pickupTimer>0)pickupTimer--;
  if(facePain>0)facePain--;if(faceKillGrin>0)faceKillGrin--;
  if(invulnTimer>0)invulnTimer--;
  if(berserkTimer>0)berserkTimer--;
  if(invisTimer>0)invisTimer--;
  if(radSuitTimer>0)radSuitTimer--;
  if(lightAmpTimer>0)lightAmpTimer--;
  if(shooting&&(WEAPONS[curWeap].auto||fireTimer<=0))fireWeapon();
  checkItemPickup();
  gameTime++;
  // Update particles
  particles=particles.filter(p=>{p.life--;if(p.vx){p.x+=p.vx;p.y+=p.vy;}return p.life>0;});
}

// Raycasting renderer
const wallColors=["","#888","#668","#686","#866","#888"];
let zBuffer=new Array(W);

function renderScene(){
  const viewH=H-60;// Reserve bottom for HUD
  const bright=lightAmpTimer>0?1.5:1;
  // Sky and floor
  ctx.fillStyle=invulnTimer>0?"#444":"#333";ctx.fillRect(0,0,W,viewH/2);
  ctx.fillStyle=invulnTimer>0?"#555":"#555";ctx.fillRect(0,viewH/2,W,viewH/2);
  // Cast rays
  for(let x=0;x<W;x++){
    const rayA=pa-HALF_FOV+FOV*(x/W);
    const rdx=Math.cos(rayA),rdy=Math.sin(rayA);
    let dist=0,hit=false,side=0,mapX,mapY,wallType=1;
    const stepX=rdx>0?1:-1,stepY=rdy>0?1:-1;
    mapX=Math.floor(px);mapY=Math.floor(py);
    let sideDistX,sideDistY,deltaDistX=Math.abs(1/rdx),deltaDistY=Math.abs(1/rdy);
    sideDistX=rdx>0?(mapX+1-px)*deltaDistX:(px-mapX)*deltaDistX;
    sideDistY=rdy>0?(mapY+1-py)*deltaDistY:(py-mapY)*deltaDistY;
    for(let i=0;i<50&&!hit;i++){
      if(sideDistX<sideDistY){sideDistX+=deltaDistX;mapX+=stepX;side=0;}
      else{sideDistY+=deltaDistY;mapY+=stepY;side=1;}
      if(mapX<0||mapX>=mapW||mapY<0||mapY>=mapH){hit=true;break;}
      const cell=map[mapY][mapX];
      if(cell==="E"){wallType=5;hit=true;}
      else if(cell>=6&&cell<=9){
        const d=doors.find(d=>d.x===mapX&&d.y===mapY);
        if(!d||d.open<0.8){wallType=4;hit=true;}
      }else if(cell>0){wallType=cell;hit=true;}
    }
    dist=side===0?sideDistX-deltaDistX:sideDistY-deltaDistY;
    dist=Math.max(dist,0.1);
    const perpDist=dist*Math.cos(rayA-pa);
    zBuffer[x]=perpDist;
    const wallH=Math.min(viewH*1.2,viewH/perpDist);
    const wallTop=(viewH-wallH)/2;
    const shade=Math.min(1,bright/(perpDist*0.3+0.5))*(side===0?1:0.7);
    const baseCol=wallColors[wallType]||"#888";
    const r=parseInt(baseCol.slice(1,2),16)*17,g=parseInt(baseCol.slice(2,3),16)*17,b=parseInt(baseCol.slice(3,4),16)*17;
    ctx.fillStyle=`rgb(${Math.floor(r*shade)},${Math.floor(g*shade)},${Math.floor(b*shade)})`;
    ctx.fillRect(x,wallTop,1,wallH);
    // Simple texture lines
    if(wallH>10){
      ctx.fillStyle=`rgba(0,0,0,${0.15*shade})`;
      for(let ty=wallTop;ty<wallTop+wallH;ty+=wallH/8){ctx.fillRect(x,ty,1,1);}
    }
  }
}

// Render sprites (enemies and items)
function renderSprites(){
  const viewH=H-60;
  const bright=lightAmpTimer>0?1.5:1;
  let spriteList=[];
  // Items
  items.forEach(it=>{
    if(it.picked)return;
    const dx=it.x-px,dy=it.y-py;
    const dist=Math.sqrt(dx*dx+dy*dy);
    spriteList.push({x:it.x,y:it.y,dist:dist,color:it.color,size:0.4,isEnemy:false,dead:false});
  });
  // Enemies
  enemies.forEach(e=>{
    const dx=e.x-px,dy=e.y-py;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const sz=e.type==="caco"?0.7:e.type==="baron"?0.8:0.5;
    spriteList.push({x:e.x,y:e.y,dist:dist,color:e.dead?"#400":e.color,size:sz,isEnemy:true,dead:e.dead,pain:e.pain,hp:e.hp,maxHp:e.maxHp});
  });
  // Projectiles
  projectiles.forEach(p=>{
    const dx=p.x-px,dy=p.y-py;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const col=p.type==="rocket"?"#f80":p.type==="plasma"?"#4af":"#fa0";
    spriteList.push({x:p.x,y:p.y,dist:dist,color:col,size:0.2,isEnemy:false,dead:false});
  });
  // Particles
  particles.forEach(p=>{
    const dx=p.x-px,dy=p.y-py;
    const dist=Math.sqrt(dx*dx+dy*dy);
    spriteList.push({x:p.x,y:p.y,dist:dist,color:p.color,size:0.15,isEnemy:false,dead:false});
  });
  // Sort back to front
  spriteList.sort((a,b)=>b.dist-a.dist);
  spriteList.forEach(s=>{
    const dx=s.x-px,dy=s.y-py;
    const angle=Math.atan2(dy,dx)-pa;
    let normAngle=angle;
    while(normAngle>Math.PI)normAngle-=Math.PI*2;
    while(normAngle<-Math.PI)normAngle+=Math.PI*2;
    if(Math.abs(normAngle)>HALF_FOV+0.2)return;
    const screenX=W/2+normAngle*(W/FOV);
    const spriteH=Math.min(viewH,(viewH*s.size)/s.dist);
    const spriteW=spriteH;
    const spriteTop=(viewH-spriteH)/2;
    const shade=Math.min(1,bright/(s.dist*0.3+0.5));
    // Check z-buffer
    const sx=Math.floor(screenX-spriteW/2);
    for(let x=Math.max(0,sx);x<Math.min(W,sx+spriteW);x++){
      if(zBuffer[x]<s.dist)continue;
      const col=s.color;
      const r=parseInt(col.length>4?col.slice(1,3):col.slice(1,2)+col.slice(1,2),16);
      const g=parseInt(col.length>4?col.slice(3,5):col.slice(2,3)+col.slice(2,3),16);
      const b=parseInt(col.length>4?col.slice(5,7):col.slice(3,4)+col.slice(3,4),16);
      ctx.fillStyle=`rgb(${Math.floor(r*shade)},${Math.floor(g*shade)},${Math.floor(b*shade)})`;
      if(s.dead&&s.isEnemy){ctx.fillRect(x,spriteTop+spriteH*0.6,1,spriteH*0.4);}
      else if(s.isEnemy){
        ctx.fillRect(x,spriteTop,1,spriteH);
        // Eyes
        if(spriteH>15){const relX=(x-sx)/spriteW;
          if((relX>0.3&&relX<0.4)||(relX>0.6&&relX<0.7)){
            const ey=spriteTop+spriteH*0.25;
            ctx.fillStyle=s.pain>0?"#f00":"#ff0";ctx.fillRect(x,ey,1,Math.max(2,spriteH*0.08));}
        }
        // Health bar
        if(spriteH>10&&s.hp<s.maxHp){
          const bw=spriteW*0.8,bx=screenX-bw/2,by=spriteTop-6;
          if(x===Math.max(0,sx)){
            ctx.fillStyle="#300";ctx.fillRect(bx,by,bw,3);
            ctx.fillStyle="#f00";ctx.fillRect(bx,by,bw*(s.hp/s.maxHp),3);}
        }
      }else{
        ctx.fillRect(x,spriteTop+spriteH*0.2,1,spriteH*0.6);
        // Item glow
        if(spriteH>5){ctx.fillStyle=`rgba(255,255,255,${0.3*shade})`;
          ctx.fillRect(x,spriteTop+spriteH*0.35,1,spriteH*0.1);}
      }
    }
  });
}

// Minimap
function renderMinimap(){
  const ms=3,ox=W-mapW*ms-4,oy=4;
  ctx.globalAlpha=0.6;
  for(let y=0;y<mapH;y++)for(let x=0;x<mapW;x++){
    const c=map[y][x];
    if(mapReveal||Math.abs(x-Math.floor(px))<6&&Math.abs(y-Math.floor(py))<6){
      if(c==="E")ctx.fillStyle="#0f0";
      else if(c>=7&&c<=9)ctx.fillStyle=["","#f00","#00f","#ff0"][c-6];
      else if(c>=6)ctx.fillStyle="#a80";
      else if(c>0)ctx.fillStyle="#666";
      else ctx.fillStyle="#222";
      ctx.fillRect(ox+x*ms,oy+y*ms,ms,ms);
    }
  }
  // Player dot
  ctx.fillStyle="#0f0";
  ctx.fillRect(ox+px*ms-1,oy+py*ms-1,2,2);
  // Direction line
  ctx.strokeStyle="#0f0";ctx.lineWidth=1;ctx.beginPath();
  ctx.moveTo(ox+px*ms,oy+py*ms);
  ctx.lineTo(ox+px*ms+Math.cos(pa)*4,oy+py*ms+Math.sin(pa)*4);
  ctx.stroke();
  // Enemy dots
  enemies.forEach(e=>{if(!e.dead){ctx.fillStyle="#f00";ctx.fillRect(ox+e.x*ms-1,oy+e.y*ms-1,2,2);}});
  // Item dots
  items.forEach(it=>{if(!it.picked){ctx.fillStyle=it.color;ctx.fillRect(ox+it.x*ms,oy+it.y*ms,1,1);}});
  ctx.globalAlpha=1;
}

// HUD Rendering - Full Doom-style status bar
function renderHUD(){
  const hy=H-60,hh=60;
  // HUD background
  ctx.fillStyle="#333";ctx.fillRect(0,hy,W,hh);
  ctx.fillStyle="#555";ctx.fillRect(0,hy,W,2);
  
  // AMMO counter (left)
  const w=WEAPONS[curWeap];
  ctx.fillStyle="#aaa";ctx.font="8px monospace";
  ctx.fillText("AMMO",4,hy+12);
  ctx.fillStyle="#ff0";ctx.font="bold 16px monospace";
  if(w.ammoType){ctx.fillText(ammo[w.ammoType]+"",4,hy+30);}
  else{ctx.fillText("--",4,hy+30);}
  
  // All ammo types
  ctx.font="7px monospace";
  const ammoY=hy+40;
  ctx.fillStyle=curWeap===1||curWeap===3?"#ff0":"#888";ctx.fillText("BUL:"+ammo.bullet,2,ammoY);
  ctx.fillStyle=curWeap===2?"#ff0":"#888";ctx.fillText("SHL:"+ammo.shell,2,ammoY+9);
  ctx.fillStyle=curWeap===4?"#ff0":"#888";ctx.fillText("RKT:"+ammo.rocket,42,ammoY);
  ctx.fillStyle=curWeap===5?"#ff0":"#888";ctx.fillText("CEL:"+ammo.cell,42,ammoY+9);
  
  // Health (center-left)
  ctx.fillStyle="#aaa";ctx.font="8px monospace";
  ctx.fillText("HEALTH",80,hy+12);
  ctx.fillStyle=pHealth>50?"#0f0":pHealth>25?"#ff0":"#f00";
  ctx.font="bold 16px monospace";
  ctx.fillText(pHealth+"%",80,hy+30);
  // Health bar
  ctx.fillStyle="#300";ctx.fillRect(80,hy+34,50,5);
  const hpCol=pHealth>100?"#44f":pHealth>50?"#0a0":pHealth>25?"#aa0":"#a00";
  ctx.fillStyle=hpCol;ctx.fillRect(80,hy+34,Math.min(50,50*(pHealth/100)),5);
  if(pHealth>100){ctx.fillStyle="#00f";ctx.fillRect(80,hy+34,50*((pHealth-100)/100),5);}
  
  // Face/Status indicator (center)
  const faceX=138,faceY=hy+10,faceW=20,faceH=24;
  const ft=FACE_TYPES[activeFaceIdx];ctx.fillStyle=ft.color;ctx.fillRect(faceX,faceY,faceW,faceH);
  // Face expression based on health
  if(pHealth<=0){
    ctx.fillStyle="#800";ctx.fillRect(faceX+4,faceY+8,4,2);ctx.fillRect(faceX+12,faceY+8,4,2);
    ctx.fillStyle="#600";ctx.fillRect(faceX+6,faceY+16,8,4);
  }else if(facePain>0){
    ctx.fillStyle="#a00";ctx.fillRect(faceX+3,faceY+8,5,3);ctx.fillRect(faceX+12,faceY+8,5,3);
    ctx.fillStyle="#800";ctx.fillRect(faceX+7,faceY+18,6,2);
  }else if(faceKillGrin>0){ctx.fillStyle=ft.eye;ctx.fillRect(faceX+4,faceY+8,4,4);ctx.fillRect(faceX+12,faceY+8,4,4);ctx.fillStyle="#f00";ctx.fillRect(faceX+6,faceY+16,8,4);}else if(pHealth>75){
    ctx.fillStyle="#000";ctx.fillRect(faceX+5,faceY+8,3,3);ctx.fillRect(faceX+12,faceY+8,3,3);
    ctx.fillStyle="#a00";ctx.fillRect(faceX+7,faceY+18,6,2);
  }else if(pHealth>40){
    ctx.fillStyle="#000";ctx.fillRect(faceX+5,faceY+9,3,2);ctx.fillRect(faceX+12,faceY+9,3,2);
    ctx.fillStyle="#800";ctx.fillRect(faceX+8,faceY+18,4,2);
  }else{
    ctx.fillStyle="#a00";ctx.fillRect(faceX+4,faceY+7,4,4);ctx.fillRect(faceX+12,faceY+7,4,4);
    ctx.fillStyle="#600";ctx.fillRect(faceX+7,faceY+16,6,4);
    ctx.fillStyle="#f00";ctx.fillRect(faceX+2,faceY+12,2,6);
  }
  ctx.fillStyle="#fff";ctx.font="5px monospace";ctx.textAlign="center";ctx.fillText(ft.name,faceX+faceW/2,faceY+faceH+8);ctx.textAlign="left";
    // Invulnerability face glow
  if(invulnTimer>0){ctx.fillStyle="rgba(255,255,0,0.3)";ctx.fillRect(faceX,faceY,faceW,faceH);}
  if(berserkTimer>0){ctx.fillStyle="rgba(255,0,0,0.3)";ctx.fillRect(faceX,faceY,faceW,faceH);}
  
  // Armor (center-right)
  ctx.fillStyle="#aaa";ctx.font="8px monospace";
  ctx.fillText("ARMOR",165,hy+12);
  ctx.fillStyle=pArmorType===2?"#44f":pArmor>0?"#0a0":"#666";
  ctx.font="bold 16px monospace";
  ctx.fillText(pArmor+"%",165,hy+30);
  // Armor bar
  ctx.fillStyle="#003";ctx.fillRect(165,hy+34,50,5);
  ctx.fillStyle=pArmorType===2?"#00f":"#0a0";
  ctx.fillRect(165,hy+34,Math.min(50,50*(pArmor/200)),5);
  
  // Arms display (right side)
  ctx.fillStyle="#aaa";ctx.font="7px monospace";
  ctx.fillText("ARMS",165,hy+48);
  for(let i=0;i<6;i++){
    ctx.fillStyle=i===curWeap?"#ff0":hasWeap[i]?"#666":"#333";
    ctx.fillRect(190+i*8,hy+42,6,8);
    ctx.fillStyle=i===curWeap?"#000":"#aaa";ctx.font="6px monospace";
    ctx.fillText((i+1)+"",191+i*8,hy+49);
  }
  
  // Keys display
  ctx.font="7px monospace";
  if(hasKey.red){ctx.fillStyle="#f00";ctx.fillRect(80,hy+44,8,8);ctx.fillStyle="#fff";ctx.fillText("R",81,hy+51);}
  if(hasKey.blue){ctx.fillStyle="#00f";ctx.fillRect(90,hy+44,8,8);ctx.fillStyle="#fff";ctx.fillText("B",91,hy+51);}
  if(hasKey.yellow){ctx.fillStyle="#ff0";ctx.fillRect(100,hy+44,8,8);ctx.fillStyle="#000";ctx.fillText("Y",101,hy+51);}
  
  // Weapon name
  ctx.fillStyle="#aaa";ctx.font="7px monospace";
  ctx.fillText(WEAPONS[curWeap].name,4,hy+58);
  
  // Power-up indicators
  let px2=138;
  if(invulnTimer>0){ctx.fillStyle="#ff0";ctx.fillText("INV",px2,hy+58);px2+=22;}
  if(berserkTimer>0){ctx.fillStyle="#f00";ctx.fillText("BER",px2,hy+58);px2+=22;}
  if(invisTimer>0){ctx.fillStyle="#88f";ctx.fillText("INV",px2,hy+58);px2+=22;}
  if(radSuitTimer>0){ctx.fillStyle="#0f0";ctx.fillText("RAD",px2,hy+58);px2+=22;}
  if(lightAmpTimer>0){ctx.fillStyle="#ff8";ctx.fillText("LIT",px2,hy+58);px2+=22;}
}

// Weapon visual on screen
function renderWeapon(){
  const viewH=H-60;
  const wx=W/2-15+Math.sin(gameTime*0.1)*2,wy=viewH-40+(weapAnim>0?-10+weapAnim:0);
  const cols=["#888","#aaa","#a80","#aa0","#800","#088"];
  ctx.fillStyle=cols[curWeap];
  ctx.fillRect(wx,wy,30,40);
  ctx.fillStyle="#666";ctx.fillRect(wx+10,wy-10,10,15);
  if(weapAnim>5){ctx.fillStyle="#ff0";ctx.fillRect(wx+5,wy-20,20,10);ctx.fillStyle="#f80";ctx.fillRect(wx+8,wy-25,14,8);}
}

// Crosshair
function renderCrosshair(){
  const viewH=H-60;const cx=W/2,cy=viewH/2;
  ctx.strokeStyle=invulnTimer>0?"#ff0":"#0f0";ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(cx-4,cy);ctx.lineTo(cx-1,cy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+1,cy);ctx.lineTo(cx+4,cy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,cy-4);ctx.lineTo(cx,cy-1);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,cy+1);ctx.lineTo(cx,cy+4);ctx.stroke();
}

// Damage flash and pickup message
function renderEffects(){
  const viewH=H-60;
  if(damageFlash>0){ctx.fillStyle=`rgba(255,0,0,${damageFlash*0.06})`;ctx.fillRect(0,0,W,viewH);}
  if(invulnTimer>0&&invulnTimer%4<2){ctx.fillStyle="rgba(255,255,0,0.05)";ctx.fillRect(0,0,W,viewH);}
  if(radSuitTimer>0){ctx.fillStyle="rgba(0,255,0,0.03)";ctx.fillRect(0,0,W,viewH);}
  if(pickupTimer>0){
    ctx.fillStyle="#ff0";ctx.font="bold 9px monospace";
    ctx.textAlign="center";ctx.fillText(pickupMsg,W/2,viewH-10);ctx.textAlign="left";
  }
}

// Level complete
function completeLevel(){
  gameState="levelEnd";
  playSound(500,0.2,"sine",0.2);setTimeout(()=>playSound(700,0.2,"sine",0.2),200);
  setTimeout(()=>playSound(900,0.3,"sine",0.25),400);
}

// Title screen
function renderSkins(){
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#f00";ctx.font="bold 16px monospace";ctx.textAlign="center";
  ctx.fillText("SKINS",W/2,30);ctx.font="7px monospace";
  for(var i=0;i<FACE_TYPES.length;i++){var ft=FACE_TYPES[i],y=50+i*35,u=isFaceUnlocked(i);
    ctx.fillStyle=u?ft.color:"#333";ctx.fillRect(20,y,24,24);
    ctx.fillStyle=i===activeFaceIdx?"#ff0":"#fff";ctx.textAlign="left";
    ctx.fillText(u?ft.name:"???",50,y+15);}
  ctx.fillStyle="#ff0";ctx.textAlign="center";ctx.fillText("[TAP to go back]",W/2,H-15);ctx.textAlign="left";
}
function renderSettings(){
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#f00";ctx.font="bold 16px monospace";ctx.textAlign="center";
  ctx.fillText("SETTINGS",W/2,30);
  ctx.fillStyle="#fff";ctx.font="8px monospace";
  ctx.fillText("Sensitivity: "+aimSensitivity,W/2,60);
  ctx.fillStyle="#444";ctx.fillRect(60,70,120,8);ctx.fillStyle="#f00";ctx.fillRect(60,70,aimSensitivity*12,8);
  ctx.fillStyle="#fff";ctx.fillText("Audio: "+(audioOn?"ON":"OFF"),W/2,100);
  ctx.fillStyle="#ff0";ctx.fillText("[TAP to go back]",W/2,130);ctx.textAlign="left";
}
function renderTitle(){
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  // Doom-style title
  ctx.fillStyle="#a00";ctx.font="bold 36px monospace";
  ctx.textAlign="center";ctx.fillText("DOOM",W/2,80);
  ctx.fillStyle="#f00";ctx.font="bold 34px monospace";
  ctx.fillText("DOOM",W/2-1,79);
  // Subtitle
  ctx.fillStyle="#ff0";ctx.font="bold 12px monospace";
  ctx.fillText("by GLX",W/2,105);
  // Menu
  ctx.fillStyle="#fff";ctx.font="10px monospace";
  ctx.fillStyle=menuSelection===0?"#ff0":"#fff";ctx.fillText("PLAY",W/2,140);
  ctx.fillStyle=menuSelection===1?"#ff0":"#fff";ctx.fillText("SETTINGS",W/2,155);
  ctx.fillStyle=menuSelection===2?"#ff0":"#fff";ctx.fillText("SKINS",W/2,170);
  ctx.fillStyle="#888";ctx.font="9px monospace";
  ctx.fillText("Level "+level+": "+LEVELS[level].name,W/2,170);
  // Flashing start text
  if(Math.floor(gameTime/30)%2===0){
    ctx.fillStyle="#ff0";ctx.font="bold 10px monospace";
    ctx.fillText("PRESS ANY KEY / TAP",W/2,200);
  }
  // Credits
  ctx.fillStyle="#f80";ctx.font="bold 9px monospace";
  ctx.fillText("Created by",W/2,240);
  ctx.fillStyle="#ff0";ctx.font="bold 10px monospace";
  ctx.fillText("Jeff Hollaway",W/2,254);
  ctx.fillStyle="#0ff";ctx.font="bold 9px monospace";
  ctx.fillText("[GhostLegacyX]",W/2,268);
  ctx.textAlign="left";
  gameTime++;
}

// Game over screen
function renderGameOver(){
  ctx.fillStyle="rgba(0,0,0,0.7)";ctx.fillRect(0,0,W,H);
  ctx.textAlign="center";
  ctx.fillStyle="#f00";ctx.font="bold 24px monospace";
  ctx.fillText("GAME OVER",W/2,100);
  ctx.fillStyle="#fff";ctx.font="10px monospace";
  ctx.fillText("Score: "+score,W/2,140);
  ctx.fillText("Kills: "+kills+"/"+totalEnemies,W/2,160);
  ctx.fillText("Level: "+level+" - "+LEVELS[level].name,W/2,180);
  if(Math.floor(gameTime/30)%2===0){
    ctx.fillStyle="#ff0";ctx.font="bold 10px monospace";
    ctx.fillText("TAP TO RESTART",W/2,220);
  }
  ctx.textAlign="left";gameTime++;
}

// Level end stats screen
function renderLevelEnd(){
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  ctx.textAlign="center";
  ctx.fillStyle="#f00";ctx.font="bold 16px monospace";
  ctx.fillText("LEVEL COMPLETE!",W/2,40);
  ctx.fillStyle="#ff0";ctx.font="12px monospace";
  ctx.fillText(LEVELS[level].name,W/2,60);
  ctx.fillStyle="#fff";ctx.font="10px monospace";
  const kp=totalEnemies>0?Math.floor(kills/totalEnemies*100):100;
  const ip=totalItems>0?Math.floor(itemsCollected/totalItems*100):100;
  const sp=totalSecrets>0?Math.floor(secretsFound/totalSecrets*100):100;
  const tm=Math.floor(gameTime/60);
  ctx.fillText("Time: "+Math.floor(tm/60)+":"+("0"+tm%60).slice(-2),W/2,100);
  ctx.fillText("Score: "+score,W/2,120);
  // Kill percentage bar
  ctx.fillStyle="#aaa";ctx.fillText("Kills: "+kills+"/"+totalEnemies+" ("+kp+"%)",W/2,150);
  ctx.fillStyle="#400";ctx.fillRect(40,155,160,8);
  ctx.fillStyle="#f00";ctx.fillRect(40,155,160*(kp/100),8);
  // Item percentage bar
  ctx.fillStyle="#aaa";ctx.fillText("Items: "+itemsCollected+"/"+totalItems+" ("+ip+"%)",W/2,180);
  ctx.fillStyle="#440";ctx.fillRect(40,185,160,8);
  ctx.fillStyle="#ff0";ctx.fillRect(40,185,160*(ip/100),8);
  // Secret percentage bar
  ctx.fillStyle="#aaa";ctx.fillText("Secrets: "+secretsFound+"/"+totalSecrets+" ("+sp+"%)",W/2,210);
  ctx.fillStyle="#044";ctx.fillRect(40,215,160,8);
  ctx.fillStyle="#0ff";ctx.fillRect(40,215,160*(sp/100),8);
  // Rating
  const avg=(kp+ip+sp)/3;
  ctx.fillStyle=avg>=90?"#0f0":avg>=70?"#ff0":"#f80";
  ctx.font="bold 12px monospace";
  const rating=avg>=90?"EXCELLENT!":avg>=70?"GREAT!":avg>=50?"GOOD":"KEEP TRYING";
  ctx.fillText(rating,W/2,245);
  if(Math.floor(gameTime/30)%2===0){
    ctx.fillStyle="#fff";ctx.font="9px monospace";
    if(level<maxLevel)ctx.fillText("TAP FOR NEXT LEVEL",W/2,270);
    else ctx.fillText("TAP - YOU WON!",W/2,270);
  }
  ctx.textAlign="left";gameTime++;
}

// Victory screen
function renderVictory(){
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  ctx.textAlign="center";
  ctx.fillStyle="#ff0";ctx.font="bold 20px monospace";
  ctx.fillText("VICTORY!",W/2,60);
  ctx.fillStyle="#0f0";ctx.font="bold 14px monospace";
  ctx.fillText("ALL LEVELS CLEAR",W/2,90);
  ctx.fillStyle="#fff";ctx.font="10px monospace";
  ctx.fillText("Final Score: "+score,W/2,130);
  ctx.fillText("Total Kills: "+kills,W/2,150);
  ctx.fillStyle="#f80";ctx.font="bold 9px monospace";
  ctx.fillText("Created by",W/2,190);
  ctx.fillStyle="#ff0";ctx.font="bold 10px monospace";
  ctx.fillText("Jeff Hollaway",W/2,204);
  ctx.fillStyle="#0ff";ctx.font="bold 9px monospace";
  ctx.fillText("[GhostLegacyX]",W/2,218);
  if(Math.floor(gameTime/30)%2===0){
    ctx.fillStyle="#fff";ctx.font="9px monospace";
    ctx.fillText("TAP TO PLAY AGAIN",W/2,260);
  }
  ctx.textAlign="left";gameTime++;
}

// Main game loop
function gameLoop(){
  if(gameState==="title"){renderTitle();}else if(gameState==="settings"){renderSettings();}else if(gameState==="skins"){renderSkins();}
  else if(gameState==="play"){
    updatePlayer();updateEnemies();updateProjectiles();updateDoors();
    renderScene();renderSprites();renderWeapon();renderCrosshair();
    renderEffects();renderMinimap();renderHUD();renderControls();
  }else if(gameState==="dead"){
    renderScene();renderSprites();renderHUD();renderControls();renderGameOver();
  }else if(gameState==="levelEnd"){
    renderLevelEnd();
  }else if(gameState==="victory"){
    renderVictory();
  }
  requestAnimationFrame(gameLoop);
}

// Start game
function startGame(){
  initAudio();level=1;score=0;kills=0;
  loadLevel(level);gameState="play";
}

// Next level or victory
function nextLevel(){
  if(level<maxLevel){level++;loadLevel(level);gameState="play";}
  else{gameState="victory";}
}

// Keyboard controls
document.addEventListener("keydown",e=>{
  if(gameState==="title"){if(e.key==="ArrowDown")menuSelection=(menuSelection+1)%3;if(e.key==="ArrowUp")menuSelection=(menuSelection+2)%3;if(e.key==="Enter"){if(menuSelection===0)startGame();else if(menuSelection===1)gameState="settings";else gameState="skins";}}
  if((gameState==="settings"||gameState==="skins")&&(e.key==="Escape"||e.key==="Backspace"))gameState="title";
  if(gameState==="title"){startGame();return;}
  if(gameState==="dead"){startGame();return;}
  if(gameState==="levelEnd"){nextLevel();return;}
  if(gameState==="victory"){level=1;score=0;startGame();return;}
  const k=e.key.toLowerCase();
  if(k==="w"||k==="arrowup")moveF=1;
  if(k==="s"||k==="arrowdown")moveF=-1;
  if(k==="a")moveS=-1;
  if(k==="d")moveS=1;
  if(k==="arrowleft")turnR=-1;
  if(k==="arrowright")turnR=1;
  if(k===" "||k==="control")shooting=true;
  if(k==="e"||k==="enter"){useBtn=true;tryOpenDoor();}
  if(k==="q")switchWeapon(-1);
  if(k==="r")switchWeapon(1);
  if(k>="1"&&k<="6")selectWeapon(parseInt(k)-1);
  e.preventDefault();
});
document.addEventListener("keyup",e=>{
  const k=e.key.toLowerCase();
  if(k==="w"||k==="arrowup"||k==="s"||k==="arrowdown")moveF=0;
  if(k==="a"||k==="d")moveS=0;
  if(k==="arrowleft"||k==="arrowright")turnR=0;
  if(k===" "||k==="control")shooting=false;
  if(k==="e"||k==="enter")useBtn=false;
});

// R1 Touch controls
let touchL=null,touchR=null,touchStartL={x:0,y:0},touchStartR={x:0,y:0};
canvas.addEventListener("touchstart",e=>{
  e.preventDefault();
  if(gameState!=="play"){
    if(gameState==="title"){if(menuSelection===0)startGame();else if(menuSelection===1)gameState="settings";else gameState="skins";}else if(gameState==="settings"||gameState==="skins")gameState="title";
    else if(gameState==="dead")startGame();
    else if(gameState==="levelEnd")nextLevel();
    else if(gameState==="victory"){level=1;score=0;startGame();}
    return;
  }
  for(let t of e.changedTouches){
    const tx=t.clientX,ty=t.clientY;
    // Check SHOOT button (bottom-right, explosion icon)
    const shootBtnX=W-35,shootBtnY=H-45;
    if(Math.sqrt((tx-shootBtnX)**2+(ty-shootBtnY)**2)<22){
      shooting=true;shootBtnPressed=true;shootBtnAnim=1;continue;
    }
    // Check SWITCH WEAPON button (above shoot button, recycling arrows icon)
    const switchBtnX=W-35,switchBtnY=H-90;
    if(Math.sqrt((tx-switchBtnX)**2+(ty-switchBtnY)**2)<18){
      switchWeapon(1);switchBtnPressed=true;switchBtnAnim=1;continue;
    }
    if(tx<W/2){// Left side - movement
      touchL=t.identifier;touchStartL={x:tx,y:ty};
    }else{// Right side - look/aim
      touchR=t.identifier;touchStartR={x:tx,y:ty};
    }
  }
},{passive:false});

canvas.addEventListener("touchmove",e=>{
  e.preventDefault();
  for(let t of e.changedTouches){
    if(t.identifier===touchL){
      const dx=t.clientX-touchStartL.x,dy=t.clientY-touchStartL.y;
      moveF=Math.abs(dy)>10?(-dy/Math.abs(dy)):0;
      moveS=Math.abs(dx)>10?(dx/Math.abs(dx)):0;
    }
    if(t.identifier===touchR){
      const dx=t.clientX-touchStartR.x;
      turnR=Math.abs(dx)>5?(dx/Math.abs(dx)):0;
      touchStartR={x:t.clientX,y:t.clientY};
    }
  }
},{passive:false});

canvas.addEventListener("touchend",e=>{
  e.preventDefault();
  for(let t of e.changedTouches){
    if(t.identifier===touchL){touchL=null;moveF=0;moveS=0;}
    if(t.identifier===touchR){touchR=null;turnR=0;shooting=false;}
      shootBtnPressed=false;switchBtnPressed=false;
  }
},{passive:false});

// Double-tap right side for use/door
let lastTapTime=0;
canvas.addEventListener("click",e=>{
  if(gameState!=="play")return;
  const now=Date.now();
  if(now-lastTapTime<300){tryOpenDoor();}
  lastTapTime=now;
});

// Render on-screen controls (bottom right buttons)
function renderControls(){
  if(gameState!=="play")return;
  const bx1=W-35,by1=H-45,br1=18;
  const bx2=W-35,by2=H-90,br2=14;
  // Shoot button (explosion symbol)
  const sa=shootBtnAnim>0?shootBtnAnim:0;
  ctx.save();
  ctx.globalAlpha=0.7+sa*0.3;
  ctx.fillStyle=shootBtnPressed?"#f84":"#c52";
  ctx.beginPath();ctx.arc(bx1,by1,br1+sa*3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#fa6";ctx.lineWidth=1.5;ctx.stroke();
  // Explosion symbol (star burst)
  ctx.fillStyle="#ff0";ctx.strokeStyle="#ff0";ctx.lineWidth=1.5;
  ctx.beginPath();
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const r1=4+sa*2,r2=9+sa*2;
    const ix=bx1+Math.cos(a)*r1,iy=by1+Math.sin(a)*r1;
    const ox=bx1+Math.cos(a)*r2,oy=by1+Math.sin(a)*r2;
    ctx.moveTo(ix,iy);ctx.lineTo(ox,oy);
  }
  ctx.stroke();
  ctx.beginPath();ctx.arc(bx1,by1,3,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Weapon switch button (recycling arrows symbol)
  const wa=switchBtnAnim>0?switchBtnAnim:0;
  ctx.save();
  ctx.globalAlpha=0.7+wa*0.3;
  ctx.fillStyle=switchBtnPressed?"#4af":"#36a";
  ctx.beginPath();ctx.arc(bx2,by2,br2+wa*3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#6cf";ctx.lineWidth=1.5;ctx.stroke();
  // Recycling arrows symbol (two curved arrows)
  ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.fillStyle="#fff";
  // Arrow 1 (top arc)
  ctx.beginPath();ctx.arc(bx2,by2,7,Math.PI*1.2,Math.PI*0.2);ctx.stroke();
  // Arrowhead 1
  const ah1x=bx2+Math.cos(Math.PI*0.2)*7,ah1y=by2+Math.sin(Math.PI*0.2)*7;
  ctx.beginPath();ctx.moveTo(ah1x,ah1y);ctx.lineTo(ah1x+3,ah1y-2);ctx.lineTo(ah1x+1,ah1y+3);ctx.fill();
  // Arrow 2 (bottom arc)
  ctx.beginPath();ctx.arc(bx2,by2,7,Math.PI*0.2+Math.PI,Math.PI*1.2+Math.PI);ctx.stroke();
  // Arrowhead 2
  const ah2x=bx2+Math.cos(Math.PI*1.2+Math.PI)*7,ah2y=by2+Math.sin(Math.PI*1.2+Math.PI)*7;
  ctx.beginPath();ctx.moveTo(ah2x,ah2y);ctx.lineTo(ah2x-3,ah2y+2);ctx.lineTo(ah2x-1,ah2y-3);ctx.fill();
  ctx.restore();
  // Movement indicator (bottom left)
  if(moveF!==0||moveS!==0){
    ctx.save();ctx.globalAlpha=0.4;
    ctx.strokeStyle="#0f0";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(30,H-55,18,0,Math.PI*2);ctx.stroke();
    const mx=30+moveS*10,my=H-55-moveF*10;
    ctx.fillStyle="#0f0";ctx.beginPath();ctx.arc(mx,my,3,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}
// R1 scroll wheel for AIMING (vertical aim offset)
canvas.addEventListener("wheel",e=>{
  e.preventDefault();
  if(gameState==="play"){
    scrollAimAmount=e.deltaY*aimSensitivity*0.01;
    aimOffsetY=Math.max(-30,Math.min(30,aimOffsetY+scrollAimAmount));
  } else if(gameState==="title"&&settingsOpen){
    // Adjust sensitivity in settings
    aimSensitivity=Math.max(1,Math.min(10,aimSensitivity+(e.deltaY>0?0.5:-0.5)));
  }
},{passive:false});

// R1 side button for use/interact
if(isR1){
  document.addEventListener("keydown",e=>{
    if(e.key==="F5"||e.key==="F6"){useBtn=true;tryOpenDoor();e.preventDefault();}
  });
}

// Initialize
loadLevel(1);
gameLoop();

