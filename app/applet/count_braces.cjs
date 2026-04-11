const fs = require('fs');

const content = fs.readFileSync('/app/applet/App.tsx', 'utf8');
let open = 0;
let close = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') open++;
  if (char === '}') close++;
}

console.log(`Open: ${open}, Close: ${close}`);
console.log(`Difference: ${open - close}`);
