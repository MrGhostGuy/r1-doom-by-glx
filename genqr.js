const QRCode = require('qrcode');
const url = 'https://mrghostguy.github.io/r1-doom-by-glx/';
const outPath = 'C:\\Users\\kency\\Desktop\\DOOM-by-GLX-QR.png';
QRCode.toFile(outPath, url, {width: 300, margin: 2, color: {dark: '#000', light: '#fff'}}, (err) => {
  if(err) console.error(err);
  else console.log('QR code saved to: ' + outPath);
});
