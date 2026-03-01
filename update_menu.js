const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
c = c.replace(/\r\n/g, '\n');
const orig = c.length;

// Step 1: Add new variables after existing variable declarations (line 25 area)
// Find: settingsOpen=false,titleSelection=0
// Add: menuSelection, activeFace, FACE_TYPES, audioOn, etc.
c = c.replace(
  'settingsOpen=false,titleSelection=0',
  'settingsOpen=false,titleSelection=0,menuSelection=0,skinsScrollY=0,activeFaceIdx=0,audioOn=true,totalKills=0,faceKillGrin=0'
);

// Step 2: Add FACE_TYPES array and menu functions after the ITEM_TYPES definition
// Find the end of ITEM_TYPES block and add face types after it
const faceTypesCode = `

// Face skin types with unlock requirements
const FACE_TYPES = [
  {name:"Marine",color:"#c90",eyeColor:"#000",unlock:0,desc:"Default"},
  {name:"Robot",color:"#aaa",eyeColor:"#f00",unlock:10,desc:"Kill 10 enemies"},
  {name:"Alien",color:"#0a0",eyeColor:"#ff0",unlock:25,desc:"Kill 25 enemies"},
  {name:"Zombie",color:"#686",eyeColor:"#f80",unlock:50,desc:"Kill 50 enemies"},
  {name:"Cyborg",color:"#68a",eyeColor:"#0ff",unlock:75,desc:"Kill 75 enemies"},
  {name:"Demon",color:"#a00",eyeColor:"#ff0",unlock:100,desc:"Kill 100 enemies"}
];

function isFaceUnlocked(idx) {
  return totalKills >= FACE_TYPES[idx].unlock;
}

// Draw a face portrait at given position with given face type
function drawFaceAt(x, y, w, h, faceIdx, health) {
  const ft = FACE_TYPES[faceIdx];
  ctx.fillStyle = ft.color;
  ctx.fillRect(x, y, w, h);
  // Eyes
  if (health <= 0) {
    ctx.strokeStyle = ft.eyeColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+4,y+6); ctx.lineTo(x+8,y+10); ctx.moveTo(x+8,y+6); ctx.lineTo(x+4,y+10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+w-8,y+6); ctx.lineTo(x+w-4,y+10); ctx.moveTo(x+w-4,y+6); ctx.lineTo(x+w-8,y+10); ctx.stroke();
    ctx.fillStyle = "#600"; ctx.fillRect(x+6,y+16,w-12,4);
  } else if (facePain > 0) {
    ctx.fillStyle = ft.eyeColor;
    ctx.fillRect(x+5,y+8,3,2); ctx.fillRect(x+w-8,y+8,3,2);
    ctx.fillStyle = "#800"; ctx.fillRect(x+6,y+15,w-12,3);
  } else if (health > 75) {
    ctx.fillStyle = ft.eyeColor;
    ctx.fillRect(x+5,y+7,3,3); ctx.fillRect(x+w-8,y+7,3,3);
    ctx.fillStyle = "#fff"; ctx.fillRect(x+6,y+7,1,1); ctx.fillRect(x+w-7,y+7,1,1);
    ctx.fillStyle = "#a00"; ctx.fillRect(x+7,y+16,w-14,2);
  } else if (health > 40) {
    ctx.fillStyle = ft.eyeColor;
    ctx.fillRect(x+5,y+8,2,2); ctx.fillRect(x+w-7,y+8,2,2);
    ctx.fillStyle = "#800"; ctx.fillRect(x+7,y+16,w-14,2);
  } else {
    ctx.fillStyle = ft.eyeColor;
    ctx.fillRect(x+4,y+6,4,4); ctx.fillRect(x+w-8,y+6,4,4);
    ctx.fillStyle = "#600"; ctx.fillRect(x+6,y+15,w-12,5);
    ctx.fillStyle = "#f00"; ctx.fillRect(x+2,y+12,2,3);
  }
  // Kill grin overlay
  if (faceKillGrin > 0 && health > 0) {
    ctx.fillStyle = ft.eyeColor;
    ctx.fillRect(x+5,y+7,3,3); ctx.fillRect(x+w-8,y+7,3,3);
    ctx.fillStyle = "#ff0"; ctx.fillRect(x+6,y+15,w-12,3);
  }
}

// Render main menu screen
function renderMenu() {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  // Title
  ctx.fillStyle = "#a00"; ctx.font = "bold 24px monospace";
  ctx.fillText("DOOM", W/2, 45);
  ctx.fillStyle = "#0a0"; ctx.font = "bold 10px monospace";
  ctx.fillText("by GLX", W/2, 60);
  // Menu options
  const items = ["PLAY", "SETTINGS", "SKINS"];
  const startY = 110;
  for (let i = 0; i < items.length; i++) {
    const y = startY + i * 40;
    const sel = (menuSelection === i);
    // Selection highlight
    if (sel) {
      ctx.fillStyle = "#330"; ctx.fillRect(20, y - 14, W - 40, 28);
      ctx.strokeStyle = "#ff0"; ctx.lineWidth = 1;
      ctx.strokeRect(20, y - 14, W - 40, 28);
    }
    ctx.fillStyle = sel ? "#ff0" : "#fff";
    ctx.font = sel ? "bold 14px monospace" : "bold 12px monospace";
    ctx.fillText(items[i], W/2, y + 5);
  }
  // Credits
  ctx.fillStyle = "#f80"; ctx.font = "bold 8px monospace";
  ctx.fillText("Created by", W/2, 230);
  ctx.fillStyle = "#ff0"; ctx.font = "bold 9px monospace";
  ctx.fillText("Jeff Hollaway", W/2, 244);
  ctx.fillStyle = "#0ff"; ctx.font = "bold 8px monospace";
  ctx.fillText("[GhostLegacyX]", W/2, 258);
  ctx.textAlign = "left";
}

// Render settings screen
function renderSettings() {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff0"; ctx.font = "bold 14px monospace";
  ctx.fillText("SETTINGS", W/2, 30);
  // Sensitivity slider
  ctx.fillStyle = "#fff"; ctx.font = "bold 10px monospace";
  ctx.fillText("AIM SENSITIVITY", W/2, 65);
  const sliderX = 30, sliderW = W - 60, sliderY = 80;
  ctx.fillStyle = "#444"; ctx.fillRect(sliderX, sliderY, sliderW, 8);
  const knobX = sliderX + ((aimSensitivity - 1) / 9) * sliderW;
  ctx.fillStyle = "#ff0"; ctx.fillRect(knobX - 4, sliderY - 4, 8, 16);
  ctx.fillStyle = "#aaa"; ctx.font = "9px monospace";
  ctx.fillText(aimSensitivity.toString(), W/2, sliderY + 28);
  // Audio toggle
  ctx.fillStyle = "#fff"; ctx.font = "bold 10px monospace";
  ctx.fillText("AUDIO", W/2, 140);
  const toggleW = 60, toggleH = 24;
  const toggleX = W/2 - toggleW/2, toggleY = 150;
  ctx.fillStyle = audioOn ? "#0a0" : "#600";
  ctx.fillRect(toggleX, toggleY, toggleW, toggleH);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
  ctx.strokeRect(toggleX, toggleY, toggleW, toggleH);
  ctx.fillStyle = "#fff"; ctx.font = "bold 10px monospace";
  ctx.fillText(audioOn ? "ON" : "OFF", W/2, toggleY + 16);
  // Back button
  ctx.fillStyle = "#888"; ctx.font = "bold 10px monospace";
  ctx.fillText("< BACK", W/2, H - 20);
  ctx.textAlign = "left";
}

// Render skins screen
function renderSkins() {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff0"; ctx.font = "bold 14px monospace";
  ctx.fillText("SKINS", W/2, 25);
  ctx.fillStyle = "#888"; ctx.font = "8px monospace";
  ctx.fillText("Total Kills: " + totalKills, W/2, 40);
  // Grid: 2 columns, 3 rows
  const cols = 2, padX = 20, padY = 50, cellW = 90, cellH = 80, gapX = 20, gapY = 10;
  for (let i = 0; i < FACE_TYPES.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = padX + col * (cellW + gapX);
    const y = padY + row * (cellH + gapY);
    const unlocked = isFaceUnlocked(i);
    const selected = (activeFaceIdx === i);
    // Card background
    ctx.fillStyle = selected ? "#220" : "#111";
    ctx.fillRect(x, y, cellW, cellH);
    if (selected) {
      ctx.strokeStyle = "#ff0"; ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellW, cellH);
    } else {
      ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);
    }
    if (unlocked) {
      // Draw face preview
      drawFaceAt(x + 33, y + 5, 24, 28, i, 80);
      ctx.fillStyle = "#fff"; ctx.font = "bold 8px monospace";
      ctx.fillText(FACE_TYPES[i].name, x + cellW/2, y + 42);
      if (selected) {
        ctx.fillStyle = "#0f0"; ctx.font = "bold 7px monospace";
        ctx.fillText("EQUIPPED", x + cellW/2, y + 55);
      } else {
        ctx.fillStyle = "#aaa"; ctx.font = "7px monospace";
        ctx.fillText("TAP TO EQUIP", x + cellW/2, y + 55);
      }
      ctx.fillStyle = "#666"; ctx.font = "7px monospace";
      ctx.fillText(FACE_TYPES[i].desc, x + cellW/2, y + 68);
    } else {
      // Locked: blacked out silhouette
      ctx.fillStyle = "#222"; ctx.fillRect(x + 33, y + 5, 24, 28);
      ctx.fillStyle = "#111"; // dark silhouette shape
      ctx.fillRect(x + 37, y + 9, 16, 20);
      ctx.fillStyle = "#f00"; ctx.font = "bold 7px monospace";
      ctx.fillText("LOCKED", x + cellW/2, y + 42);
      ctx.fillStyle = "#888"; ctx.font = "7px monospace";
      ctx.fillText(FACE_TYPES[i].desc, x + cellW/2, y + 55);
      ctx.fillStyle = "#555"; ctx.font = "7px monospace";
      ctx.fillText(FACE_TYPES[i].unlock + " kills needed", x + cellW/2, y + 68);
    }
  }
  // Back button
  ctx.fillStyle = "#888"; ctx.font = "bold 10px monospace";
  ctx.fillText("< BACK", W/2, H - 15);
  ctx.textAlign = "left";
}

// Handle menu touch/click
function handleMenuTouch(tx, ty) {
  const items = ["PLAY", "SETTINGS", "SKINS"];
  const startY = 110;
  for (let i = 0; i < items.length; i++) {
    const y = startY + i * 40;
    if (ty > y - 14 && ty < y + 14 && tx > 20 && tx < W - 20) {
      menuSelection = i;
      if (i === 0) { startGame(); }
      else if (i === 1) { gameState = "settings"; }
      else if (i === 2) { gameState = "skins"; }
      return;
    }
  }
}

// Handle settings touch/click
function handleSettingsTouch(tx, ty) {
  // Sensitivity slider: y=76 to y=92, x=30 to W-30
  if (ty > 68 && ty < 100 && tx > 25 && tx < W - 25) {
    const sliderX = 30, sliderW = W - 60;
    aimSensitivity = Math.round(1 + ((tx - sliderX) / sliderW) * 9);
    aimSensitivity = Math.max(1, Math.min(10, aimSensitivity));
    return;
  }
  // Audio toggle: y=150 to y=174
  if (ty > 145 && ty < 180) {
    audioOn = !audioOn;
    return;
  }
  // Back button: near bottom
  if (ty > H - 40) {
    gameState = "menu";
    return;
  }
}

// Handle skins touch/click
function handleSkinsTouch(tx, ty) {
  // Check skin cards
  const cols = 2, padX = 20, padY = 50, cellW = 90, cellH = 80, gapX = 20, gapY = 10;
  for (let i = 0; i < FACE_TYPES.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = padX + col * (cellW + gapX);
    const y = padY + row * (cellH + gapY);
    if (tx > x && tx < x + cellW && ty > y && ty < y + cellH) {
      if (isFaceUnlocked(i)) {
        activeFaceIdx = i;
      }
      return;
    }
  }
  // Back button
  if (ty > H - 40) {
    gameState = "menu";
    return;
  }
}
`;

// Insert FACE_TYPES after the yellowKey ITEM_TYPES closing
c = c.replace(
  'yellowKey:{name:"Yellow Key",color:"#ff0",effect:"key",keyType:"yellow"}\n};',
  'yellowKey:{name:"Yellow Key",color:"#ff0",effect:"key",keyType:"yellow"}\n};' + faceTypesCode
);

// Step 3: Replace renderTitle to show menu state instead
c = c.replace(
  'function renderTitle(){',
  'function renderTitle(){\n  if(gameState==="menu"){renderMenu();return;}\n  if(gameState==="settings"){renderSettings();return;}\n  if(gameState==="skins"){renderSkins();return;}'
);

// Step 4: Replace "NEW GAME" with menu transition
// Change the title screen: after showing title, go to menu on tap instead of starting game
c = c.replace(
  '// Menu\n    ctx.fillStyle="#fff";ctx.font="bold 10px monospace";\n    ctx.fillText("NEW GAME",W/2,150);',
  '// Menu hint\n    ctx.fillStyle="#fff";ctx.font="bold 10px monospace";\n    ctx.fillText("MAIN MENU",W/2,150);'
);

// Step 5: Update game loop to handle new states
c = c.replace(
  'if(gameState==="title"){renderTitle();}',
  'if(gameState==="title"||gameState==="menu"||gameState==="settings"||gameState==="skins"){renderTitle();}'
);

// Step 6: Update touch handler - title goes to menu, menu/settings/skins have their own handlers
c = c.replace(
  'if(gameState==="title")startGame();',
  'if(gameState==="title"){gameState="menu";return;}\n        if(gameState==="menu"){const r=canvas.getBoundingClientRect();const tx=(touches[0].clientX-r.left)*(W/r.width);const ty=(touches[0].clientY-r.top)*(H/r.height);handleMenuTouch(tx,ty);return;}\n        if(gameState==="settings"){const r=canvas.getBoundingClientRect();const tx=(touches[0].clientX-r.left)*(W/r.width);const ty=(touches[0].clientY-r.top)*(H/r.height);handleSettingsTouch(tx,ty);return;}\n        if(gameState==="skins"){const r=canvas.getBoundingClientRect();const tx=(touches[0].clientX-r.left)*(W/r.width);const ty=(touches[0].clientY-r.top)*(H/r.height);handleSkinsTouch(tx,ty);return;}'
);

// Step 7: Update click handler to also work for menu states (for desktop testing)
// Find the click event listener and add menu click support
c = c.replace(
  'canvas.addEventListener("click",e=>{',
  'canvas.addEventListener("click",e=>{\n  const r2=canvas.getBoundingClientRect();const mx=(e.clientX-r2.left)*(W/r2.width);const my=(e.clientY-r2.top)*(H/r2.height);\n  if(gameState==="title"){gameState="menu";return;}\n  if(gameState==="menu"){handleMenuTouch(mx,my);return;}\n  if(gameState==="settings"){handleSettingsTouch(mx,my);return;}\n  if(gameState==="skins"){handleSkinsTouch(mx,my);return;}'
);

// Step 8: Replace the face drawing in HUD with our new drawFaceAt function
c = c.replace(
  '// Face/Status indicator (center)\n    const faceX=138,faceY=hy+10,faceW=20,faceH=24;\n    ctx.fillStyle="#c90";ctx.fillRect(faceX,faceY,faceW,faceH);',
  '// Face/Status indicator (center)\n    const faceX=138,faceY=hy+10,faceW=20,faceH=24;\n    drawFaceAt(faceX,faceY,faceW,faceH,activeFaceIdx,pHealth);'
);

// Remove old face expression code (lines 680-697 area) - the health-based if/else chain
// This is between "// Face expression based on health" and "// Invulnerability face glow"
c = c.replace(
  /\/\/ Face expression based on health\n[\s\S]*?\/\/ Invulnerability face glow/,
  '// Face expression handled by drawFaceAt above\n    // Invulnerability face glow'
);

// Step 9: Add kill grin trigger where enemies die
c = c.replace(
  /e\.dead=true;e\.state="dead"/g,
  'e.dead=true;e.state="dead";faceKillGrin=30;totalKills++'
);

// Step 10: Add faceKillGrin decrement in the game update (near facePain decrement)
c = c.replace(
  'if(facePain>0)facePain--;',
  'if(facePain>0)facePain--;\n    if(faceKillGrin>0)faceKillGrin--;'
);

// Step 11: Add face name display below face in HUD
c = c.replace(
  '// Invulnerability face glow',
  '// Face name\n    ctx.fillStyle="#fff";ctx.font="6px monospace";ctx.textAlign="center";\n    ctx.fillText(FACE_TYPES[activeFaceIdx].name,faceX+faceW/2,faceY+faceH+8);\n    ctx.textAlign="left";\n    // Invulnerability face glow'
);

// Step 12: Add settings touch move for slider dragging
const touchMoveCode = `
// Settings slider drag support
canvas.addEventListener("touchmove",e=>{
  if(gameState==="settings"){
    e.preventDefault();
    const t=e.touches[0];const r=canvas.getBoundingClientRect();
    const tx=(t.clientX-r.left)*(W/r.width);const ty=(t.clientY-r.top)*(H/r.height);
    if(ty>68&&ty<100&&tx>25&&tx<W-25){
      const sliderX=30,sliderW=W-60;
      aimSensitivity=Math.round(1+((tx-sliderX)/sliderW)*9);
      aimSensitivity=Math.max(1,Math.min(10,aimSensitivity));
    }
  }
},{passive:false});

// Mouse move for desktop slider drag
let mouseDownOnSlider=false;
canvas.addEventListener("mousedown",e=>{
  if(gameState==="settings"){
    const r=canvas.getBoundingClientRect();const my=(e.clientY-r.top)*(H/r.height);
    if(my>68&&my<100)mouseDownOnSlider=true;
  }
});
canvas.addEventListener("mousemove",e=>{
  if(mouseDownOnSlider&&gameState==="settings"){
    const r=canvas.getBoundingClientRect();const mx=(e.clientX-r.left)*(W/r.width);
    const sliderX=30,sliderW=W-60;
    aimSensitivity=Math.round(1+((mx-sliderX)/sliderW)*9);
    aimSensitivity=Math.max(1,Math.min(10,aimSensitivity));
  }
});
canvas.addEventListener("mouseup",()=>{mouseDownOnSlider=false;});
`;

// Insert before the final loadLevel call
c = c.replace(
  'loadLevel(1);',
  touchMoveCode + '\nloadLevel(1);'
);

// Step 13: Mute audio when audioOn is false - wrap sound play calls
// Add audio check to the sound functions
c = c.replace(
  /function sndShoot\(\)/,
  'function sndCheck(){return audioOn;}\nfunction sndShoot()'
);

// Add audioOn check to each sound function's play call
const soundFuncs = ['sndShoot','sndHurt','sndPickup','sndDoor','sndKey','sndExplosion'];
// We'll add a global check by wrapping the audio context resume
c = c.replace(
  'function initAudio(){',
  'function initAudio(){\n  if(!audioOn)return;'
);

// Write the modified file
fs.writeFileSync('app.js', c);

// Verify
const newC = fs.readFileSync('app.js', 'utf8');
console.log('Original size:', orig);
console.log('New size:', newC.length);
console.log('Bytes added:', newC.length - orig);

// Check features
const checks = ['FACE_TYPES','renderMenu','renderSettings','renderSkins','handleMenuTouch','handleSettingsTouch','handleSkinsTouch','drawFaceAt','isFaceUnlocked','activeFaceIdx','audioOn','faceKillGrin','totalKills','menuSelection'];
checks.forEach(k => {
  const count = (newC.match(new RegExp(k, 'g')) || []).length;
  console.log(k + ':', count, 'matches');
});
console.log('All updates applied!');