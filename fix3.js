const fs=require('fs');
let c=fs.readFileSync('app.js','utf8');
const ft="const FACE_TYPES=[{name:'Marine',color:'#c90',eyeColor:'#000',unlock:0,desc:'Default'},{name:'Robot',color:'#aaa',eyeColor:'#f00',unlock:10,desc:'Kill 10 enemies'},{name:'Alien',color:'#0a0',eyeColor:'#ff0',unlock:25,desc:'Kill 25 enemies'},{name:'Zombie',color:'#686',eyeColor:'#f80',unlock:50,desc:'Kill 50 enemies'},{name:'Cyborg',color:'#68a',eyeColor:'#0ff',unlock:75,desc:'Kill 75 enemies'},{name:'Demon',color:'#a00',eyeColor:'#ff0',unlock:100,desc:'Kill 100 enemies'}];\nfunction isFaceUnlocked(idx){return totalKills>=FACE_TYPES[idx].unlock;}\n";
c=c.replace('LEVELS=[null,',ft+'LEVELS=[null,');
fs.writeFileSync('app.js',c);
console.log('Done',c.includes('FACE_TYPES=['),c.includes('isFaceUnlocked'),c.length);
