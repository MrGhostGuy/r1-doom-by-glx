const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
c = c.replace(/\r\n/g, '\n'); // Normalize CRLF to LF for matching
const origLen = c.length;

// Step 1: Add face system variables
c = c.replace(
  'faceFrame=0,facePain=0;',
  'faceFrame=0,facePain=0,faceKillGrin=0,totalKills=0,activeFace=0;'
);

// Step 2: Add FACE_TYPES and unlock system after variable declarations
const faceSystemCode = `
// === HUD Face Portrait System ===
const FACE_TYPES=[
  {name:"Marine",skin:"#c90",eyes:"#000",mouth:"#a00"},
  {name:"Robot",skin:"#999",eyes:"#0ff",mouth:"#666"},
  {name:"Alien",skin:"#0a0",eyes:"#ff0",mouth:"#060"},
  {name:"Zombie",skin:"#686",eyes:"#f00",mouth:"#430"},
  {name:"Cyborg",skin:"#88a",eyes:"#f0f",mouth:"#448"},
  {name:"Demon",skin:"#a00",eyes:"#ff0",mouth:"#600"}
];
let faceUnlocks=[true,false,false,false,false,false];
function unlockFace(idx){
  if(idx>=0&&idx<FACE_TYPES.length&&!faceUnlocks[idx]){
    faceUnlocks[idx]=true;
    pickupMsg=FACE_TYPES[idx].name+" face unlocked!";
    pickupTimer=120;
  }
}
function cycleFace(){
  let next=(activeFace+1)%FACE_TYPES.length;
  let tries=0;
  while(!faceUnlocks[next]&&tries<6){next=(next+1)%FACE_TYPES.length;tries++;}
  if(faceUnlocks[next])activeFace=next;
}
`;
// Insert after the first occurrence of the game state variables block
const insertPoint = c.indexOf('let gameState=');
if (insertPoint > -1) {
  const lineEnd = c.indexOf(';', insertPoint) + 1;
  c = c.slice(0, lineEnd) + '\n' + faceSystemCode + c.slice(lineEnd);
  console.log('Step 2: Face system code inserted after game state vars');
} else {
  // Fallback: insert after the variable line we modified in step 1
  const altPoint = c.indexOf('faceKillGrin=0,totalKills=0,activeFace=0;');
  if (altPoint > -1) {
    const end = altPoint + 'faceKillGrin=0,totalKills=0,activeFace=0;'.length;
    c = c.slice(0, end) + '\n' + faceSystemCode + c.slice(end);
    console.log('Step 2: Face system code inserted after face vars');
  }
}

// Step 3: Add kill grin trigger on enemy death
c = c.replace(
  /e\.dead=true;e\.state="dead"/g,
  'e.dead=true;e.state="dead";faceKillGrin=30;totalKills++;if(totalKills===5)unlockFace(1);if(totalKills===15)unlockFace(2);if(totalKills===30)unlockFace(3);if(totalKills===50)unlockFace(4);if(totalKills===75)unlockFace(5)'
);

// Step 4: Add faceKillGrin decrement alongside facePain
c = c.replace(
  'if(facePain>0)facePain--;',
  'if(facePain>0)facePain--;if(faceKillGrin>0)faceKillGrin--;'
);

// Step 5: Replace face skin color with face-type-aware color
c = c.replace(
  'ctx.fillStyle="#c90";ctx.fillRect(faceX,faceY,faceW,faceH);',
  'const ft=FACE_TYPES[activeFace]||FACE_TYPES[0];ctx.fillStyle=ft.skin;ctx.fillRect(faceX,faceY,faceW,faceH);'
);

// Step 6: Add kill grin expression before the healthy face check
c = c.replace(
  '}else if(pHealth>75){',
  '}else if(faceKillGrin>0){ctx.fillStyle=ft.eyes;ctx.fillRect(faceX+4,faceY+7,4,4);ctx.fillRect(faceX+12,faceY+7,4,4);ctx.fillStyle=ft.mouth;ctx.fillRect(faceX+6,faceY+17,8,3);ctx.fillStyle="#fff";ctx.fillRect(faceX+7,faceY+17,6,1);}else if(pHealth>75){'
);

// Step 7: Replace hardcoded eye colors with face-type colors for healthy state
c = c.replace(
  'ctx.fillStyle="#000";ctx.fillRect(faceX+5,faceY+8,3,3);ctx.fillRect(faceX+12,faceY+8,3,3);\n      ctx.fillStyle="#a00";ctx.fillRect(faceX+7,faceY+18,6,2);',
  'ctx.fillStyle=ft.eyes;ctx.fillRect(faceX+5,faceY+8,3,3);ctx.fillRect(faceX+12,faceY+8,3,3);\n      ctx.fillStyle=ft.mouth;ctx.fillRect(faceX+7,faceY+18,6,2);'
);

// Step 8: Add face name label below face portrait
c = c.replace(
  '// Invulnerability face glow',
  'ctx.fillStyle="#fff";ctx.font="6px monospace";ctx.fillText(ft.name,faceX,faceY+faceH+8);\n    // Invulnerability face glow'
);

// Step 9: Add F key to cycle faces
c = c.replace(
  'if(k==="e"||k==="enter"){useBtn=true;tryOpenDoor();}',
  'if(k==="e"||k==="enter"){useBtn=true;tryOpenDoor();}\n      if(k==="f"){cycleFace();}'
);

// Write updated file
fs.writeFileSync('app.js', c);
console.log('Original size:', origLen);
console.log('New size:', c.length);
console.log('Bytes added:', c.length - origLen);

// Verify all features
const checks = ['faceKillGrin','FACE_TYPES','unlockFace','cycleFace','faceUnlocks','activeFace','totalKills','Robot','Alien','Zombie','Cyborg','Demon'];
checks.forEach(k => {
  const m = [...c.matchAll(new RegExp(k, 'g'))];
  console.log(k + ': ' + m.length + ' matches');
});
console.log('All updates applied successfully!');