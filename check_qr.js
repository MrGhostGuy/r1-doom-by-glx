const fs = require('fs');
// Read the PNG and check dimensions
const buf = fs.readFileSync('C:\\Users\\kency\\Desktop\\Rabbit R1\\R1-2D-Minecraft-QR-Enhanced.png');
// PNG width is at bytes 16-19 (big-endian)
const w = buf.readUInt32BE(16);
const h = buf.readUInt32BE(20);
console.log('Current dimensions:', w, 'x', h);
console.log('File size:', buf.length, 'bytes');
