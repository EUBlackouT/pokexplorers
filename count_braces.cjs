
const fs = require('fs');
const content = fs.readFileSync('App.tsx', 'utf8');
let open = 0;
let close = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') open++;
    if (content[i] === '}') close++;
}
console.log('Open:', open);
console.log('Close:', close);
