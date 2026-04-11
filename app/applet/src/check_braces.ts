import fs from 'fs';

const content = fs.readFileSync('/app/applet/App.tsx', 'utf8');
let open = 0;
let close = 0;
let line = 1;
let col = 1;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') open++;
  if (char === '}') close++;
  if (char === '\n') {
    line++;
    col = 1;
  } else {
    col++;
  }
}

console.log(`Open: ${open}, Close: ${close}`);
console.log(`Difference: ${open - close}`);
