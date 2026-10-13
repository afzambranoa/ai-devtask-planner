const fs = require('fs');
const path = process.argv[2];
const b64 = process.argv[3];
fs.writeFileSync(path, Buffer.from(b64, 'base64').toString('utf8'));
console.log('OK:', path);